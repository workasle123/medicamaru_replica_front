'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  addItem,
  updateQuantity,
  setDeliveryType,
  removeItem,
  applyCoupon,
  removeCoupon,
  applyPoints,
  removePoints,
  placeOrder,
} from '@/services/cart.service';
import { rules, validate, field } from '@/lib/validation';
import { getSessionToken } from '@/lib/auth/session';
import { PAYMENT_METHODS } from '@/constants/checkout';

/**
 * Medicamaru — cart Server Actions.
 *
 * Bound directly to <form> elements, so every cart operation works without
 * JavaScript. Each action revalidates the affected paths so the header badge
 * and cart page stay in step.
 *
 * Note what is NEVER read from formData: prices, discounts, totals. Only
 * identifiers and quantities. Even if a user edits the DOM, the worst they
 * can change is which variant and how many — both of which the backend
 * re-prices and re-validates against the purchase limit.
 */

/**
 * Re-read the pages whose SERVER-RENDERED content a cart change affects.
 *
 * Just those two. This used to end with `revalidatePath('/', 'layout')` — the
 * whole tree, every route — for the header cart badge. The badge has since
 * become a Client Component that reads /api/cart/count and re-reads on the
 * CART_CHANGED event, so nothing in the layout renders cart state on the
 * server any more and there is nothing there to revalidate.
 *
 * Leaving it in was not merely redundant, it broke the product page. Every
 * − and ＋ on a pack dumped the cache for EVERY route, so the next render of
 * the product page went back to the backend for the product, its reviews, its
 * related products and the layout's categories and tags — six or more calls
 * that were all sitting in cache a moment earlier. Two or three quick taps
 * put several of those renders in flight at once against a backend capped at
 * 100 concurrent connections; one call fails, getProduct rethrows for an
 * unavailable backend by design, and the customer gets 「問題が発生しました」
 * on a page they were in the middle of buying from.
 *
 * The quantity controls already call notifyCartChanged() themselves, which is
 * what actually updates the badge.
 */
function refresh() {
  revalidatePath('/cart');
  revalidatePath('/checkout');
}

/**
 * Bound directly to the product page's <form>, so it takes formData alone
 * rather than the (prevState, formData) shape useActionState expects. Keeping
 * this signature lets PriceTiers stay a Server Component.
 *
 * On failure it returns to the product page with an error code rather than
 * throwing, so the customer keeps their place.
 */
export async function addToCartAction(formData) {
  const variantId = field(formData, 'variantId');
  // The backend validates the variant against its product, so both travel.
  const productId = field(formData, 'productId');
  const quantity = Number(field(formData, 'quantity')) || 1;
  const slug = field(formData, 'slug');

  /* Where to land afterwards. The product page sends `slug` and the wishlist
     sends `returnTo`, because someone adding from a list of favourites is
     probably adding several — bouncing them to the cart after each one turns a
     three-item reorder into three trips back. */
  const returnTo = field(formData, 'returnTo');
  const back = returnTo || (slug ? `/product/${slug}` : '/cart');

  if (!variantId || !productId) {
    redirect(`${back}?error=variant`);
  }

  const result = await addItem({ productId, variantId, quantity });
  if (!result.ok) {
    redirect(`${back}?error=add`);
  }

  refresh();
  /* Staying put when the caller asked to. `added=1` is what the destination
     reads to confirm the item landed. */
  redirect(returnTo ? `${returnTo}?added=1` : '/cart?added=1');
}

/**
 * `cartItemId` is the cart ROW id, which is what the backend's update and
 * remove endpoints address. A variant id here would target the wrong row.
 */
export async function updateQuantityAction(formData) {
  const cartItemId = field(formData, 'cartItemId');

  /* The − / + buttons submit `stepQuantity`, the typed box submits `quantity`,
     and the button wins when both are present — which they always are, since a
     pressed submit button sends its pair alongside every other field in the
     form.

     They need separate names. Sharing one meant formData.get() returned whichever
     came FIRST in the DOM, so − worked (button before the input) and + silently
     applied the input's unchanged value instead of its own. */
  const stepped = field(formData, 'stepQuantity');

  /* `confirmedQuantity` is only ever filled by the over-limit dialog's 続ける,
     and it wins over both. Without it the resubmit carries no pressed button,
     so the typed box would decide and the confirmed number would be lost. */
  const confirmed = field(formData, 'confirmedQuantity');
  const quantity = Number(
    confirmed !== '' ? confirmed : stepped !== '' ? stepped : field(formData, 'quantity')
  );

  if (!Number.isFinite(quantity) || quantity < 1) return;

  await updateQuantity({ cartItemId, quantity });
  refresh();
}

/**
 * The split-delivery switch on a cart row.
 *
 * Only the row id and the chosen mode are read — the parcel count and the new
 * postage are the backend's to work out, and this never carries either.
 */
export async function setDeliveryTypeAction(formData) {
  const cartItemId = field(formData, 'cartItemId');
  const deliveryType = field(formData, 'deliveryType');

  if (!cartItemId) return;
  /* Anything else is not a mode the backend knows; it would be stored
     verbatim and then fail the === 'recurring' test as a silent one_time. */
  if (deliveryType !== 'recurring' && deliveryType !== 'one_time') return;

  await setDeliveryType({ cartItemId, deliveryType });
  refresh();
}

export async function removeItemAction(formData) {
  await removeItem(field(formData, 'cartItemId'));
  refresh();
}

export async function applyCouponAction(prevState, formData) {
  const code = field(formData, 'code');

  if (!code) {
    return { error: 'クーポンコードを入力してください。' };
  }

  const result = await applyCoupon(code);
  if (!result.ok) return { error: result.error };

  refresh();
  return { success: 'クーポンを適用しました。' };
}

export async function removeCouponAction() {
  await removeCoupon();
  refresh();
}

/**
 * Redeem points against the cart.
 *
 * The amount is a yen figure — 1 point spends as 1 yen. It is re-clamped in
 * cart.service against the cart's live `maxPointsUsable`, because that cap
 * moves with the cart total and with any coupon, and the value posted here was
 * rendered from an earlier state.
 */
export async function applyPointsAction(prevState, formData) {
  const points = field(formData, 'points');

  if (!points) {
    return { error: 'ご利用ポイント数をご入力ください。' };
  }

  const result = await applyPoints(points);
  if (!result.ok) return { error: result.error };

  refresh();
  return { success: 'ポイントを適用しました。' };
}

export async function removePointsAction() {
  await removePoints();
  refresh();
}

/**
 * Checkout submission.
 *
 * Collects address and payment selection only. No monetary value is read
 * from the form — the backend builds the order from the cart it already
 * holds (brief §17).
 */
export async function placeOrderAction(prevState, formData) {
  /* GUEST ORDERS CONFIRM THE ADDRESS TWICE.
     A signed-in customer's email is the one they already proved they can
     read — they verified it to get the account, and it is prefilled here. A
     guest's is whatever they just typed, and nothing downstream ever checks
     it: the order is accepted, and the confirmation carrying the virtual bank
     account they must transfer into goes straight to that address. A typo
     means the payment instructions reach a stranger, the customer never
     learns where to send the money, and the order simply sits unpaid — on a
     furikomi shop that is indistinguishable from somebody who changed their
     mind, so nobody ever finds out.

     Read from the session rather than from the presence of the field, so
     deleting the input from the DOM does not skip the check. */
  const isGuest = !(await getSessionToken());

  const values = {
    recipient: field(formData, 'recipient'),
    recipientEnglish: field(formData, 'recipientEnglish'),
    postalCode: field(formData, 'postalCode'),
    prefecture: field(formData, 'prefecture'),
    city: field(formData, 'city'),
    street: field(formData, 'street'),
    building: field(formData, 'building'),
    phone: field(formData, 'phone'),
    email: field(formData, 'email'),
    emailConfirm: field(formData, 'emailConfirm'),
    paymentMethod: field(formData, 'paymentMethod'),
    terms: formData.get('terms'),
    /* Checked on the SERVER, not only by `required` on the input. A checkbox
       is trivial to bypass from the console, and the personal-use statement is
       the one the shop would have to produce if a shipment were ever queried. */
    personalUse: formData.get('personalUse'),
    addressConfirmed: formData.get('addressConfirmed'),
  };

  const { valid, errors } = validate(values, {
    /* Format checks on the postcode and phone were dropped (2026-09-26), to
       match registration. The backend imposes no pattern on either — both are
       `string|max:20` — so the only thing it can actually reject is length,
       and that is what is checked here. A customer whose phone the shop would
       happily accept should not be stopped at the last step of checkout. */
    recipient: [(v) => rules.required(v, 'お届け先氏名'), (v) => rules.maxLength(v, 60, 'お届け先氏名')],
    /* The romanised name the shipping label prints. 60 matches the column.
       No character-class rule — a pattern would turn away the accented
       spellings that appear on real passports, for a field whose only job is
       to be readable to a carrier abroad. */
    recipientEnglish: [
      (v) => rules.required(v, 'お届け先氏名（English）'),
      (v) => rules.maxLength(v, 60, 'お届け先氏名（English）'),
    ],
    postalCode: [(v) => rules.required(v, '郵便番号'), (v) => rules.maxLength(v, 20, '郵便番号')],
    prefecture: [(v) => rules.required(v, '都道府県')],
    city: [(v) => rules.required(v, '市区町村')],
    street: [(v) => rules.required(v, '番地')],
    phone: [(v) => rules.required(v, '電話番号'), (v) => rules.maxLength(v, 20, '電話番号')],
    email: [(v) => rules.required(v, 'メールアドレス'), rules.email],
    /* Guests only — see isGuest above. An empty array is no rule at all, so a
       signed-in checkout is unaffected by the field not being rendered.

       Compared case-insensitively and after trimming (field() trims both), so
       「Taro@Example.com」 against 「taro@example.com」 passes. The local part of
       an address is technically case-sensitive, but no mail provider anyone
       uses treats it that way, and rejecting that pair would be a mismatch
       error on two addresses that deliver to the same inbox — which reads as
       the form being broken. */
    emailConfirm: isGuest
      ? [
          (v) => rules.required(v, 'メールアドレス（確認用）'),
          (v) =>
            v.toLowerCase() === values.email.toLowerCase()
              ? null
              : 'メールアドレスが一致しません。もう一度ご確認ください。',
        ]
      : [],
    /* Checkout no longer asks — it posts 銀行振込 in a hidden field — so the
       value now has to be checked against the known ids rather than merely
       being present. A hidden input is exactly as editable from the console
       as the radio group it replaced, and an order carrying a payment method
       the shop does not operate is worse than a rejected submission. */
    paymentMethod: [
      (v) => rules.required(v, 'お支払い方法'),
      (v) =>
        PAYMENT_METHODS.some((m) => m.id === v)
          ? null
          : 'お支払い方法が正しくありません。',
    ],
    terms: [(v) => (v ? null : 'ご注文内容の確認と同意が必要です。')],
    personalUse: [(v) => (v ? null : 'ご本人が使用する目的であることをご確認ください。')],
    addressConfirmed: [(v) => (v ? null : 'お届け先の内容をご確認ください。')],
  });

  if (!valid) {
    /* The three consents are stripped from what is echoed back: a tick is a
       statement the customer makes at the moment of ordering, so re-checking
       the boxes for them after a failed submit would be answering on their
       behalf. Everything they typed is returned. */
    const { terms, personalUse, addressConfirmed, ...echo } = values;
    return { errors, values: echo };
  }

  const result = await placeOrder({
    address: {
      recipient: values.recipient,
      /* Upper-cased here as well as on the backend, so the confirmation the
         customer sees after submitting matches what will be printed. */
      recipientEnglish: values.recipientEnglish.toUpperCase(),
      postalCode: values.postalCode,
      prefecture: values.prefecture,
      city: values.city,
      street: values.street,
      building: values.building,
      phone: values.phone,
    },
    email: values.email,
    paymentMethod: values.paymentMethod,
  });

  if (!result.ok) {
    const { terms, personalUse, addressConfirmed, ...echo } = values;
    return { errors: { form: result.error }, values: echo };
  }

  refresh();
  redirect(`/checkout/complete/${result.order.id}`);
}
