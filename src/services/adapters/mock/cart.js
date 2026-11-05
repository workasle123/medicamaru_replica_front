/**
 * Medicamaru — mock cart.
 *
 * ⚠️ DEVELOPMENT ONLY. Gated behind DATA_SOURCE=mock.
 *
 * The important discipline this file preserves: **every monetary value is
 * computed here, server-side, and the frontend only renders what it is
 * given.** Subtotal, discounts, shipping and total are never derived in a
 * component. When the real backend arrives it replaces this module wholesale
 * and the UI does not change — which is the whole point (brief §17).
 *
 * Prices are re-read from the catalogue on every recalculation and never
 * taken from the request, so a tampered form field cannot change what
 * something costs.
 */

import { products } from './fixtures';
import { SHIPPING } from '@/constants/site';

/** cartId → Map<variantId, quantity> */
const carts = new Map();

/** Coupon rules live server-side. The client may only submit a code. */
const COUPONS = {
  WELCOME500: { type: 'fixed', value: 500, minSubtotal: 3000, label: '初回500円OFF' },
  SAVE10: { type: 'percent', value: 10, minSubtotal: 5000, label: '10%OFF' },
};

/** Orders placed in this process. Resets on restart — development only. */
const placedOrders = new Map();

function delay(ms = 40) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Resolve a variant id back to its product and variant. */
function lookup(variantId) {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === Number(variantId));
    if (variant) return { product, variant };
  }
  return null;
}

function emptyCart(cartId) {
  return {
    sessionId: cartId,
    lines: [],
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0,
    pointsEarned: 0,
    freeShippingThreshold: SHIPPING.freeThreshold,
    amountToFreeShipping: SHIPPING.freeThreshold,
    appliedCoupon: null,
    couponLabel: null,
    pointsApplied: 0,
  };
}

/**
 * Build the full cart, recomputing every figure from catalogue prices.
 * This is the function the real backend replaces.
 */
function build(cartId) {
  const state = carts.get(cartId);
  if (!state || state.items.size === 0) return emptyCart(cartId);

  const lines = [];
  let subtotal = 0;
  let pointsEarned = 0;
  const split = state.split ?? new Set();
  /* The dearest split in the cart, exactly as CommonHelper::getShippingAmount
     takes the MAX deliveries_count across rows rather than summing them. */
  let maxParcels = 1;

  for (const [variantId, quantity] of state.items) {
    const found = lookup(variantId);
    if (!found) continue;

    const { product, variant } = found;
    // Price comes from the catalogue, never from the client.
    const lineTotal = variant.price * quantity;
    subtotal += lineTotal;
    pointsEarned += variant.points * quantity;

    /* Mirrors getNumberOfDeliveries: ceil(totalUnits / cap), and 1 when the
       row is inside the cap. Computed for every row whatever its type, which
       is what lets the toggle name the parcel count before it is chosen. */
    const parcels = variant.purchaseLimit
      ? Math.max(1, Math.ceil((quantity * variant.pack) / variant.purchaseLimit))
      : 1;
    if (split.has(Number(variant.id))) maxParcels = Math.max(maxParcels, parcels);

    lines.push({
      /* The real backend addresses update/remove by CART ROW id, so lines carry
         an `id`. There are no cart rows here — items are keyed by variant — so
         the variant id serves as the row id and the two adapters present the
         same shape to the cart page. */
      id: String(variant.id),
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      image: product.images[0],
      packLabel: variant.packLabel,
      quantity,
      unitPrice: variant.price,
      lineTotal,
      points: variant.points * quantity,
      inStock: variant.inStock,
      purchaseLimit: variant.purchaseLimit,
      /* `pack` is the unit count inside one of this variant, which is what the
         cap is expressed in — the live adapter derives the same figure from
         quantity_per_variant and product_unit_pack. Without it the cart page
         compared packs against a tablet cap and never warned. */
      unitsPerVariant: variant.pack,
      deliveryType: split.has(Number(variant.id)) ? 'recurring' : 'one_time',
      deliveriesCount: split.has(Number(variant.id)) ? parcels : 1,
      mayBeDeliveryCount: parcels,
    });
  }

  if (!lines.length) return emptyCart(cartId);

  // --- Discounts ---------------------------------------------------------
  let discount = 0;
  let couponLabel = null;
  const coupon = state.coupon ? COUPONS[state.coupon] : null;

  if (coupon && subtotal >= coupon.minSubtotal) {
    discount +=
      coupon.type === 'fixed'
        ? coupon.value
        : Math.floor((subtotal * coupon.value) / 100);
    couponLabel = coupon.label;
  }

  // Points redemption, clamped so it can never exceed what is owed.
  const pointsApplied = Math.min(state.pointsApplied || 0, Math.max(0, subtotal - discount));
  discount += pointsApplied;

  const discountedSubtotal = Math.max(0, subtotal - discount);

  // --- Shipping ----------------------------------------------------------
  /* Banded on what ONE parcel carries, then charged per parcel — the same
     order as getShippingAmount, which divides the basket by the parcel count
     to pick a band and multiplies the band rate back by it.

     The live 送料無料 OFFER is not modelled here. On the backend that offer is
     tested against the whole cart and returns 0 whatever the split, so a cart
     covered by a running offer pays nothing extra for splitting; only the
     bands behave the way this line does. */
  const perParcelSubtotal = discountedSubtotal / maxParcels;
  const shipping =
    perParcelSubtotal >= SHIPPING.freeThreshold ? 0 : SHIPPING.flatRate * maxParcels;
  const amountToFreeShipping = Math.max(0, SHIPPING.freeThreshold - discountedSubtotal);

  return {
    sessionId: cartId,
    lines,
    subtotal,
    discount,
    shipping,
    total: discountedSubtotal + shipping,
    // Points accrue per variant, as supplied by the catalogue.
    pointsEarned,
    freeShippingThreshold: SHIPPING.freeThreshold,
    amountToFreeShipping,
    appliedCoupon: couponLabel ? state.coupon : null,
    couponLabel,
    pointsApplied,
  };
}

function ensure(cartId) {
  if (!carts.has(cartId)) {
    carts.set(cartId, { items: new Map(), coupon: null, pointsApplied: 0, split: new Set() });
  }
  const cart = carts.get(cartId);
  if (!cart.split) cart.split = new Set();
  return cart;
}

/**
 * Both adapters now take the cart's identity as an object rather than a bare id
 * string, because the live backend keys a guest cart on `session_id` and a
 * signed-in one on `customer_id`. There is no merge to model here, so the
 * customer id simply wins when present — which is the backend's own precedence.
 */
const key = (who) => (typeof who === 'string' ? who : who?.customerId || who?.sessionId || '');

export const mockCartAdapter = {
  async getCart(who) {
    await delay(20);
    return build(key(who));
  },

  /** `productId` is accepted to match the live signature; lookup is by variant. */
  async addItem(who, { variantId, quantity = 1 }) {
    await delay();
    const cartId = key(who);
    const found = lookup(variantId);
    if (!found) return { ok: false, error: '商品が見つかりませんでした。' };
    if (!found.variant.inStock) return { ok: false, error: 'この商品は在庫切れです。' };

    const state = ensure(cartId);
    const current = state.items.get(Number(variantId)) ?? 0;
    // The purchase limit is enforced server-side, not by the input's max.
    const next = Math.min(current + Number(quantity), found.variant.purchaseLimit);
    state.items.set(Number(variantId), next);

    return { ok: true, cart: build(cartId) };
  },

  /** `cartItemId` is the row id; here that is the variant id (see build()). */
  async updateQuantity(who, { cartItemId, quantity }) {
    await delay();
    const cartId = key(who);
    const state = ensure(cartId);
    const qty = Number(quantity);

    if (!Number.isFinite(qty) || qty <= 0) {
      state.items.delete(Number(cartItemId));
      return { ok: true, cart: build(cartId) };
    }

    const found = lookup(cartItemId);
    if (!found) return { ok: false, error: '商品が見つかりませんでした。' };

    state.items.set(Number(cartItemId), Math.min(qty, found.variant.purchaseLimit));
    return { ok: true, cart: build(cartId) };
  },

  /** The split switch. Mirrors updateCartDeliveryType: store the choice, let
      build() re-derive the parcel count and the postage from it. */
  async setDeliveryType(who, { cartItemId, deliveryType }) {
    await delay();
    const cartId = key(who);
    const state = ensure(cartId);
    const id = Number(cartItemId);

    if (deliveryType === 'recurring') state.split.add(id);
    else state.split.delete(id);

    return { ok: true, cart: build(cartId) };
  },

  async removeItem(who, cartItemId) {
    await delay();
    const cartId = key(who);
    ensure(cartId).items.delete(Number(cartItemId));
    return { ok: true, cart: build(cartId) };
  },

  async applyCoupon(who, code) {
    const cartId = key(who);
    await delay();
    const state = ensure(cartId);
    const normalised = String(code || '').trim().toUpperCase();
    const coupon = COUPONS[normalised];

    if (!coupon) {
      return { ok: false, error: 'クーポンコードが正しくありません。' };
    }

    const current = build(cartId);
    if (current.subtotal < coupon.minSubtotal) {
      return {
        ok: false,
        error: `このクーポンは${coupon.minSubtotal.toLocaleString('ja-JP')}円以上のご購入で利用できます。`,
      };
    }

    state.coupon = normalised;
    return { ok: true, cart: build(cartId) };
  },

  /* The fixture keeps no order history, so nothing has ever been redeemed.
     Enough for the cart page to render its picker unfiltered. */
  async redeemedCoupons() {
    await delay();
    return [];
  },

  async removeCoupon(who) {
    const cartId = key(who);
    await delay();
    ensure(cartId).coupon = null;
    return { ok: true, cart: build(cartId) };
  },

  async applyPoints(who, points) {
    const cartId = key(who);
    await delay();
    const state = ensure(cartId);
    state.pointsApplied = Math.max(0, Number(points) || 0);
    return { ok: true, cart: build(cartId) };
  },

  /* Mirrors the live adapter, which needs a distinct call: the backend reads
     `remove_point_amount` rather than an apply of zero. */
  async removePoints(who) {
    const cartId = key(who);
    await delay();
    ensure(cartId).pointsApplied = 0;
    return { ok: true, cart: build(cartId) };
  },

  async placeOrder(who, details) {
    const cartId = key(who);
    await delay(120);
    const cart = build(cartId);
    if (!cart.lines.length) {
      return { ok: false, error: 'カートに商品がありません。' };
    }

    const orderId = `MDM-2026-${String(Math.floor(1000 + cart.total % 9000)).padStart(4, '0')}`;

    // The order snapshot is built from the server-calculated cart, never
    // from anything the checkout form submitted about money.
    const order = {
      id: orderId,
      placedAt: new Date().toISOString().split('T')[0],
      status: 'pending',
      statusLabel: 'ご注文受付',
      itemCount: cart.lines.length,
      subtotal: cart.subtotal,
      discount: cart.discount,
      shipping: cart.shipping,
      total: cart.total,
      pointsEarned: cart.pointsEarned,
      lines: cart.lines.map((l) => ({
        productName: l.productName,
        slug: l.slug,
        packLabel: l.packLabel,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
      })),
      shippingAddress: details.address,
      paymentMethod: details.paymentMethod,
      /* The virtual account a furikomi order is waiting on, so the
         confirmation page's BankTransferPanel is reachable in mock mode.
         Shaped like normaliseBankTransfer's output, not like the gateway's
         raw response, because that is what the panel consumes.

         Only for bank_transfer: the live adapter returns null for the other
         methods, and a mock that always had an account number would hide the
         branch where the panel is correctly absent. */
      bankTransfer:
        details.paymentMethod === 'bank_transfer'
          ? {
              transactionId: 'MOCKTXN0042',
              bankName: 'GMOあおぞらネット銀行',
              bankCode: '0310',
              branchName: 'ビジネス営業部',
              branchCode: '101',
              accountType: '普通',
              accountNumber: '1234567',
              accountHolder: 'ｶ)ﾒﾃﾞｲｶﾏﾙ',
              amount: cart.total,
            }
          : null,
    };

    placedOrders.set(orderId, order);
    carts.delete(cartId);

    // Same contract as the HTTP adapter: the snapshot a guest's confirmation
    // page is rendered from.
    return { ok: true, order, receipt: order };
  },

  async getPlacedOrder(orderId) {
    await delay(20);
    return placedOrders.get(orderId) ?? null;
  },
};

export const AVAILABLE_COUPONS = Object.entries(COUPONS).map(([code, c]) => ({
  code,
  label: c.label,
  minSubtotal: c.minSubtotal,
}));
