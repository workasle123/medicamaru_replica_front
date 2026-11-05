import 'server-only';

import { cartAdapter } from './adapters';
import { getCartId, ensureCartId, clearCartId } from '@/lib/cart/session';
import { getCustomerId, getSessionToken } from '@/lib/auth/session';
import { saveReceipt, readReceipt } from '@/lib/checkout/receipt';
import { logError, toUserMessage } from '@/lib/api/errors';

/**
 * Medicamaru — cart service.
 *
 * Server-only. Reads the cart's identity from cookies, so no caller passes one.
 *
 * Every returned cart is the backend's own calculation. Nothing in this file
 * or above it ever adds up a total.
 *
 * Two identifiers, not one: a guest cart is keyed by the `session_id` in the
 * cart cookie, and once signed in the backend keys the same cart by
 * `customer_id`, which login merges the guest rows into. Both are sent and the
 * backend prefers the customer.
 */

/** @returns {Promise<{sessionId: string|null, customerId: string|null}>} */
async function who() {
  const [sessionId, customerId] = await Promise.all([getCartId(), getCustomerId()]);
  return { sessionId, customerId };
}

const EMPTY = {
  sessionId: null,
  lines: [],
  subtotal: 0,
  discount: 0,
  shipping: 0,
  total: 0,
  pointsEarned: 0,
  amountToFreeShipping: 0,
  appliedCoupon: null,
  couponLabel: null,
  pointsApplied: 0,
  couponBannerId: null,
  couponDiscount: 0,
  pointsBalance: 0,
  maxPointsUsable: 0,
  pointsRedeemDisabled: false,
  pointsEarningDisabled: false,
};

/** @returns {Promise<import('@/lib/types').Cart>} */
export async function getCart() {
  const identity = await who();
  // Neither identifier means nothing has ever been added, and the backend
  // rejects a request carrying neither.
  if (!identity.sessionId && !identity.customerId) return EMPTY;

  try {
    return (await cartAdapter.getCart(identity)) ?? EMPTY;
  } catch (error) {
    logError(error, { service: 'cart.getCart' });
    return EMPTY;
  }
}

/**
 * LINES in the cart, for the header badge — not units.
 *
 * Three packs of one product reads 1, not 3. The badge answers "how many
 * things am I buying", which is what a customer glances at it for; how many
 * tablets is settled on the cart page, where each row carries its own
 * quantity stepper.
 *
 * It summed quantities before, which disagreed with the cart page’s own
 * footer — CheckoutBar is handed `cart.lines.length` and prints it as
 * 「合計（N点）」. So the header could say 7 while the page said 3 for the same
 * cart. The two now agree by construction rather than by coincidence.
 *
 * Note the doc comment here already said “line count” while the body summed
 * quantities; the intent was always this.
 */
export async function getCartCount() {
  const cart = await getCart();
  return cart.lines.length;
}

/**
 * `productId` is required as well as `variantId` — the backend validates the
 * variant against the product, so a variant id alone is refused.
 */
export async function addItem({ productId, variantId, quantity }) {
  try {
    // Creating the cart id here means a cookie is only set once something is
    // actually added — browsing alone never issues one.
    const [sessionId, customerId] = await Promise.all([ensureCartId(), getCustomerId()]);
    return await cartAdapter.addItem({ sessionId, customerId }, { productId, variantId, quantity });
  } catch (error) {
    logError(error, { service: 'cart.addItem', productId, variantId });
    return { ok: false, error: toUserMessage(error) };
  }
}

/**
 * `cartItemId` is the CART ROW id from the cart listing, not a variant id —
 * that is what the backend's update and remove endpoints are keyed on.
 */
/**
 * Choose whether one row ships as a single parcel or a lawful split.
 *
 * The backend re-derives the parcel count and the postage from this, so the
 * only thing travelling is the choice itself.
 */
export async function setDeliveryType({ cartItemId, deliveryType }) {
  const identity = await who();
  if (!identity.sessionId && !identity.customerId) {
    return { ok: false, error: 'カートが見つかりませんでした。' };
  }

  try {
    return await cartAdapter.setDeliveryType(identity, { cartItemId, deliveryType });
  } catch (error) {
    logError(error, { service: 'cart.setDeliveryType', cartItemId });
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function updateQuantity({ cartItemId, quantity }) {
  const identity = await who();
  if (!identity.sessionId && !identity.customerId) {
    return { ok: false, error: 'カートが見つかりませんでした。' };
  }

  try {
    return await cartAdapter.updateQuantity(identity, { cartItemId, quantity });
  } catch (error) {
    logError(error, { service: 'cart.updateQuantity', cartItemId });
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function removeItem(cartItemId) {
  const identity = await who();
  if (!identity.sessionId && !identity.customerId) {
    return { ok: false, error: 'カートが見つかりませんでした。' };
  }

  try {
    return await cartAdapter.removeItem(identity, cartItemId);
  } catch (error) {
    logError(error, { service: 'cart.removeItem', cartItemId });
    return { ok: false, error: toUserMessage(error) };
  }
}

/**
 * Coupons and points are SIGNED-IN ONLY.
 *
 * Both endpoints sit behind auth:sanctum and attribute the discount to
 * `customer_id`, so a guest cannot use either. Without this guard the call
 * answers 401, which is not a validation failure and would surface as a broken
 * page rather than a message. Points and coupons survive signing in: login
 * merges the guest cart by `session_id`.
 */
async function authed() {
  const [identity, token] = await Promise.all([who(), getSessionToken()]);
  if (!token || !identity.customerId) return null;
  return { identity, token };
}

const SIGN_IN_REQUIRED = 'クーポン・ポイントのご利用にはログインが必要です。';

export async function applyCoupon(code) {
  const auth = await authed();
  if (!auth) return { ok: false, error: SIGN_IN_REQUIRED };

  try {
    return await cartAdapter.applyCoupon(auth.identity, code, auth.token);
  } catch (error) {
    logError(error, { service: 'cart.applyCoupon' });
    return { ok: false, error: toUserMessage(error) };
  }
}

/**
 * Banner ids this customer has already spent.
 *
 * The cart page drops them from its coupon picker. Empty for a guest, who
 * cannot have redeemed anything, and empty on failure — offering one coupon
 * too many is a smaller harm than a cart that will not load.
 */
export async function listRedeemedCoupons() {
  const auth = await authed();
  if (!auth) return [];

  try {
    return await cartAdapter.redeemedCoupons(auth.identity, auth.token);
  } catch (error) {
    logError(error, { service: 'cart.listRedeemedCoupons' });
    return [];
  }
}

export async function removeCoupon() {
  const auth = await authed();
  if (!auth) return { ok: false, error: SIGN_IN_REQUIRED };

  try {
    return await cartAdapter.removeCoupon(auth.identity, auth.token);
  } catch (error) {
    logError(error, { service: 'cart.removeCoupon' });
    return { ok: false, error: toUserMessage(error) };
  }
}

/**
 * Redeem points against the cart. `points` is a yen amount — 1 point spends as
 * 1 yen.
 *
 * Clamped against the cart's own `maxPointsUsable` BEFORE it is sent. The
 * backend answers an over-cap request by silently removing the discount while
 * still reporting success, so forwarding an unchecked figure would wipe what
 * the customer had already applied and look like the button doing nothing.
 */
export async function applyPoints(points) {
  const auth = await authed();
  if (!auth) return { ok: false, error: SIGN_IN_REQUIRED };

  const amount = Math.floor(Number(points));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'ご利用ポイント数をご入力ください。' };
  }

  try {
    const cart = await getCart();
    if (cart.pointsRedeemDisabled) {
      return { ok: false, error: '現在ポイントはご利用いただけません。' };
    }
    if (amount > cart.maxPointsUsable) {
      return {
        ok: false,
        error: `このご注文にご利用いただけるのは${cart.maxPointsUsable.toLocaleString('ja-JP')}ポイントまでです。`,
      };
    }
    return await cartAdapter.applyPoints(auth.identity, amount, auth.token);
  } catch (error) {
    logError(error, { service: 'cart.applyPoints' });
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function removePoints() {
  const auth = await authed();
  if (!auth) return { ok: false, error: SIGN_IN_REQUIRED };

  try {
    return await cartAdapter.removePoints(auth.identity, auth.token);
  } catch (error) {
    logError(error, { service: 'cart.removePoints' });
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function placeOrder(details) {
  const identity = await who();
  if (!identity.sessionId && !identity.customerId) {
    return { ok: false, error: 'カートが見つかりませんでした。' };
  }

  try {
    /* The lines come from the cart the backend already holds, so the order is
       built from server-side state rather than from anything the checkout form
       could have carried. Prices are re-derived server-side regardless. */
    const cart = await getCart();
    if (cart.lines.length === 0) {
      return { ok: false, error: 'カートに商品がありません。' };
    }

    const result = await cartAdapter.placeOrder(identity, {
      ...details,
      lines: cart.lines,
      shipping: cart.shipping,
    });
    if (result.ok) {
      await clearCartId();
      /* Kept for the confirmation page — the only way a guest can see the
         order, and the bank account to pay into, once checkout redirects.
         Best effort: the order is already placed, so a cookie problem here
         must not turn a successful checkout into an error. */
      if (result.receipt) {
        try {
          await saveReceipt(result.receipt);
        } catch (error) {
          logError(error, { service: 'cart.placeOrder.saveReceipt' });
        }
      }
    }
    return result;
  } catch (error) {
    logError(error, { service: 'cart.placeOrder' });
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function getPlacedOrder(orderId) {
  try {
    /* Same ownership check as the account’s order detail — see auth.getOrder —
       and the same bearer token, without which the route answers 401 and the
       confirmation page renders notFound(). */
    const [customerId, token] = await Promise.all([getCustomerId(), getSessionToken()]);
    return await cartAdapter.getPlacedOrder(orderId, customerId, token);
  } catch (error) {
    logError(error, { service: 'cart.getPlacedOrder', orderId });
    return null;
  }
}

/**
 * The order behind the confirmation page, for members and guests alike.
 *
 * A signed-in customer gets the order read back from the backend, as before.
 * A guest has no token to read it with, so gets the receipt kept at checkout
 * (lib/checkout/receipt) — which is also the fallback if the read-back fails.
 *
 * @param {string} orderId
 * @returns {Promise<{order: object, guest: boolean}|null>}
 */
export async function getOrderConfirmation(orderId) {
  const token = await getSessionToken();

  if (token) {
    const order = await getPlacedOrder(orderId);
    if (order) return { order, guest: false };
  }

  const receipt = await readReceipt(orderId);
  return receipt ? { order: receipt, guest: !token } : null;
}
