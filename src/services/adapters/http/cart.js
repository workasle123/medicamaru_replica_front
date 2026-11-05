/**
 * Medicamaru — HTTP cart adapter.
 *
 * Verified against the local backend replica on 2026-08-17. It previously
 * described an unverified contract from PHASE-0-AUDIT §7.3 and every call
 * failed; what the backend actually wants is:
 *
 *  · POST for everything. GET/PATCH/DELETE return 405 — there is no REST verb
 *    vocabulary here, all five cart routes are POST.
 *  · The cart is identified by `session_id` (guest) or `customer_id` (signed
 *    in) IN THE BODY. The old `X-Cart-Session` header was never read, so every
 *    call looked like a fresh anonymous cart.
 *  · Quantity travels as a URL SEGMENT: /cart/updateQuantity/{id}/{quantity}.
 *  · `{id}` on update and remove is the CART ROW id, not a variant id.
 *  · Add needs `product_id` AND `product_variant_id`.
 *
 * Nothing here sends a price. The backend used to require `price` and
 * `total_price` from the caller and store them verbatim — it now derives both
 * from the variant and ignores them if sent, so the note this file has always
 * carried finally holds: the backend is the sole authority on cost.
 */

import { apiFetch } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/errors';
import { normaliseCart, normaliseOrderSummary, bankTransferFromGateway } from './normalise';

/** Cart responses must never be cached — stock and totals are live. */
const LIVE = { revalidate: 0 };

/**
 * Who the cart belongs to. Exactly one of these is meaningful at a time, but
 * both are sent: the backend prefers `customer_id` when present and falls back
 * to `session_id`, which is also how a guest cart is merged on login.
 */
function identity({ sessionId, customerId } = {}) {
  return {
    session_id: sessionId ?? undefined,
    customer_id: customerId ?? undefined,
  };
}

/** The cart envelope lives at `results`; `results.data` holds items and money. */
const results = (res) => res?.results ?? res ?? null;

/**
 * The refusal detail a 422 carried, if any.
 *
 * The coupon endpoint answers with a stable `reason` — `missing`, `not_found`,
 * `expired`, `minimum_not_met`, `category_not_in_cart`, `product_not_in_cart`,
 * `scope_not_set`, `automatic` — alongside an English message. The reason is
 * what gets mapped to Japanese below; the English never reaches a customer.
 */
const refusal = (error) => error?.payload?.results ?? {};

const jpy = (n) => Number(n || 0).toLocaleString('ja-JP');

/** Japanese copy for a refused coupon, chosen by `reason`. */
function couponMessage(result) {
  switch (result.reason) {
    case 'missing':
      return 'クーポンコードを入力してください。';
    case 'expired':
      return 'このクーポンの有効期間は終了しています。';
    case 'minimum_not_met': {
      /* Measured against `eligible_amount`, not the cart total. For a
         category coupon those differ — the minimum is tested on that
         category's subtotal — and quoting the whole cart would understate
         the shortfall and send the customer back with it still unmet. Falls
         back to cart_total for a whole-cart coupon, where they are equal. */
      const measured = Number(result.eligible_amount ?? result.cart_total);
      const short = Math.max(0, Number(result.offer_value_min) - measured);
      return `${jpy(result.offer_value_min)}円以上のご購入でご利用いただけます。あと${jpy(short)}円です。`;
    }
    /* The coupon is limited to a category or to named products, and the cart
       holds none of them. Saying only 「適用できませんでした」 leaves the
       customer to guess at a rule the shop knows perfectly well. */
    case 'category_not_in_cart':
      return 'このクーポンは対象カテゴリーの商品にのみご利用いただけます。';
    case 'product_not_in_cart':
      return 'このクーポンは対象商品にのみご利用いただけます。';
    /* Free shipping is resolved from the cart, never redeemed as a code. */
    case 'automatic':
      return '送料無料は自動で適用されます。クーポンコードのご入力は不要です。';
    /* `scope_not_set` is a coupon the admin left half-configured. Nothing the
       customer can do about it, so it reads as unavailable rather than
       exposing the reason. */
    /* One time per user, and this customer has had theirs. Said plainly:
       the alternative is a code that simply refuses with no reason, which
       reads as the site being broken rather than the rule working. */
    case 'already_used':
      return 'このクーポンはすでにご利用いただいています。お一人様一回限りご利用いただけます。';
    case 'scope_not_set':
    case 'not_found':
      return 'このクーポンコードはご利用いただけません。';
    default:
      return 'クーポンを適用できませんでした。';
  }
}

/**
 * @param {string} path
 * @param {object} body
 * @param {string} [token]  Required by the coupon and point endpoints, which sit
 *   behind auth:sanctum. Without one they answer 401 — not a validation failure,
 *   so it would surface as an unhandled error rather than a message.
 */
async function mutate(path, body, token) {
  try {
    const res = await apiFetch(path, { method: 'POST', body, token, ...LIVE });
    return { ok: true, message: res?.message ?? '', results: res?.results ?? null };
  } catch (error) {
    if (error instanceof ApiError && (error.isValidation || error.status === 404)) {
      return {
        ok: false,
        error: error.message || 'ご入力内容をご確認ください。',
        ...refusal(error),
      };
    }
    throw error;
  }
}

export const httpCartAdapter = {
  async getCart(who) {
    const res = await apiFetch(endpoints.cart(), {
      method: 'POST',
      body: identity(who),
      ...LIVE,
    });
    return normaliseCart(results(res), who?.sessionId ?? null);
  },

  /** `productId` as well as `variantId` — the backend validates both. */
  addItem: (who, { productId, variantId, quantity }) =>
    mutate(endpoints.cartAdd(), {
      ...identity(who),
      product_id: productId,
      product_variant_id: variantId,
      quantity,
    }),

  /* Cart row id and quantity are both path segments; the body carries only the
     identity, which is what scopes the row to this cart. */
  updateQuantity: (who, { cartItemId, quantity }) =>
    mutate(endpoints.cartUpdate(cartItemId, quantity), identity(who)),

  removeItem: (who, cartItemId) =>
    mutate(endpoints.cartRemove(cartItemId), identity(who)),

  /**
   * Switch one cart row between a single parcel and a split delivery.
   *
   * 'recurring' is the backend's name for the split, not a subscription: it
   * means this row leaves in ceil(totalUnits / subscription_limit) parcels,
   * which is how an order over the personal-import limit is shipped lawfully.
   *
   * NOTHING is calculated here. updateCartDeliveryType recomputes
   * deliveries_count from the row's own quantity, and the next cart read
   * re-prices postage through getShippingAmount — which bands the basket per
   * parcel and then multiplies by the parcel count. Working the new total out
   * on this side would be a second opinion about money the backend owns.
   */
  setDeliveryType: (who, { cartItemId, deliveryType }) =>
    mutate(endpoints.cartDeliveryType(), {
      ...identity(who),
      cart_id: Number(cartItemId),
      delivery_type: deliveryType === 'recurring' ? 'recurring' : 'one_time',
    }),

  /**
   * Apply a coupon by the code the customer typed.
   *
   * The backend stores coupons as banner_details rows and used to accept only
   * `banner_id`, which a storefront never sees. It now resolves `coupon_code`
   * too, so the printed code is enough.
   *
   * Signed-in only: the route is behind auth:sanctum and the coupon is
   * attributed to `customer_id`.
   */
  applyCoupon: async (who, code, token) => {
    const result = await mutate(
      endpoints.cartCoupon(),
      { ...identity(who), coupon_code: code },
      token,
    );
    return result.ok ? result : { ...result, error: couponMessage(result) };
  },

  /**
   * Banner ids this customer has already redeemed.
   *
   * Signed-in only, and an empty list on failure: a picker that silently
   * shows one coupon too many is a far smaller problem than a cart page that
   * will not render.
   */
  redeemedCoupons: async (who, token) => {
    if (!token || !who?.customerId) return [];
    try {
      const res = await apiFetch(endpoints.redeemedCoupons(), {
        method: 'POST',
        token,
        body: { customer_id: String(who.customerId) },
        ...LIVE,
      });
      const ids = res?.results?.banner_ids ?? [];
      return Array.isArray(ids) ? ids.map(String) : [];
    } catch {
      return [];
    }
  },

  /* `action_type: 'delete'` with no banner_id removes whatever coupon is
     applied. Only one can be active per customer, so this is unambiguous. */
  removeCoupon: (who, token) =>
    mutate(endpoints.cartCoupon(), { ...identity(who), action_type: 'delete' }, token),

  /**
   * Redeem points against the cart. 1 point = 1 yen.
   *
   * `points` must not exceed `maxUseWallet` from the cart listing. The backend
   * answers an over-cap request by REMOVING the discount and STILL reporting
   * 201 success, so an unchecked value silently clears what was already applied
   * instead of failing. Success is therefore read from what the backend says it
   * did, not from the status code.
   */
  applyPoints: async (who, points, token) => {
    const result = await mutate(
      endpoints.cartPoints(),
      { ...identity(who), apply_point_amount: points },
      token,
    );
    if (!result.ok) return result;

    return /removed/i.test(result.message)
      ? { ok: false, error: 'ご利用いただけるポイント数を超えています。' }
      : result;
  },

  removePoints: (who, token) =>
    mutate(endpoints.cartPoints(), { ...identity(who), remove_point_amount: 1 }, token),

  /**
   * Order placement.
   *
   * `order_items` carries identifiers and quantities only. It used to be the
   * source of each line's price; the backend now re-reads every price from the
   * variant and recomputes the total, so what is sent here cannot change what
   * is charged.
   *
   * ⚠️ The address block below is what the backend reads, and it wants more
   * than the checkout form currently collects: the name split four ways
   * (kanji/hiragana × given/family) and a date of birth. Until the form is
   * extended, a guest order stores a partial customer record — see the note in
   * the checkout page.
   */
  placeOrder: async (who, details) => {
    try {
      const res = await apiFetch(endpoints.placeOrder(), {
        method: 'POST',
        body: {
          order_items: (details.lines ?? []).map((line) => ({
            product_id: line.productId,
            product_variant_id: line.variantId,
            quantity: line.quantity,
            /* The row's own choice, not a constant. This was hardcoded
               'one_time', which made deliveriesCountFor return 1 before it
               ever looked at the cap — so a customer who asked for a split in
               the cart silently got one parcel, and was charged one postage
               for it. */
            delivery_type: line.deliveryType === 'recurring' ? 'recurring' : 'one_time',
          })),
          /* Columns are NOT NULL with no default, so these must be present
             even when zero or the insert fails with a constraint violation. */
          fixedPostage: details.shipping ?? 0,
          referalAmount: 0,
          total_points: 0,
          point_discount: 0,
          comments: details.comments ?? null,
          address: {
            address_choice: 'new',
            first_name_kanji: details.address?.givenName ?? details.address?.recipient ?? '',
            last_name_kanji: details.address?.familyName ?? '',
            first_name_hiragana: details.address?.givenNameKana ?? '',
            last_name_hiragana: details.address?.familyNameKana ?? '',
            /* The romanised name for the shipping label. A guest order is
               still a parcel, and without this the label has only 漢字 on it
               — which is what the carrier abroad cannot read.

               Falls back to the combined field the same way the kanji line
               above does: checkout asks for one 氏名 box, not a 姓/名 pair, so
               the whole name arrives in `recipientEnglish` and lands in the
               given-name column with the family one left empty. The label
               joins the two, so either shape prints correctly. */
            first_name_english:
              details.address?.givenNameEnglish ?? details.address?.recipientEnglish ?? '',
            last_name_english: details.address?.familyNameEnglish ?? '',
            email: details.email,
            tel: details.address?.phone,
            dob: details.address?.dob ?? null,
            gender: details.address?.gender ?? null,
            address_line_1: [details.address?.city, details.address?.street]
              .filter(Boolean)
              .join(' '),
            address_line_2: details.address?.building ?? '',
            city: details.address?.city,
            state: details.address?.prefecture,
            zip_code: details.address?.postalCode,
            country: details.address?.country ?? '日本',
            session_id: who?.sessionId ?? undefined,
          },
        },
        ...LIVE,
      });

      const order = res?.order ?? res?.results?.order ?? null;
      const summary = order ? normaliseOrderSummary(order) : null;

      return {
        ok: true,
        order: { id: order?.id ?? order?.order_number, ...order },
        /* What the confirmation page shows a guest, who cannot read the order
           back through getPlacedOrder (auth:sanctum). Everything is from this
           response — the order row, and the gateway's virtual account under
           `payment` — plus the lines of the cart the order was placed from. */
        receipt: summary && {
          ...summary,
          bankTransfer: bankTransferFromGateway(
            res?.payment,
            // What the backend handed the gateway: intval(round(total)).
            Math.round(Number(order.total_amount) || 0),
          ),
          lines: details.lines ?? [],
          shippingAddress: details.address ?? null,
          paymentMethod: details.paymentMethod ?? null,
        },
      };
    } catch (error) {
      if (error instanceof ApiError && error.isValidation) {
        return { ok: false, error: error.message || 'ご注文内容をご確認ください。' };
      }
      throw error;
    }
  },

  /**
   * The order behind the confirmation page.
   *
   * TWO bugs lived here. The route is inside the auth:sanctum group, and no
   * token was sent — so this answered 401, the service swallowed it, and the
   * page called notFound(). Every completed checkout showed a 404 instead of
   * a confirmation. It also returned the raw {message, code, results}
   * envelope rather than an order, so even authenticated it could not have
   * rendered.
   */
  getPlacedOrder: async (orderId, customerId, token) => {
    const res = await apiFetch(endpoints.order(orderId, customerId), { token, ...LIVE });
    const row = res?.results?.data ?? res?.data ?? null;
    return row ? normaliseOrderSummary(row) : null;
  },
};
