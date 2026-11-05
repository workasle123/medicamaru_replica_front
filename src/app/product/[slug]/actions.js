'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { addToWishlist, submitReview } from '@/services/auth.service';
import { field, rules, validate } from '@/lib/validation';

/**
 * Medicamaru — product page Server Actions.
 *
 * Bound to the buy form's second submit button via `formAction`, so it reads
 * the SAME fields the add-to-cart submit does — including the selected pack
 * radio. That is why there is no separate wishlist form: nesting one inside the
 * buy form would be invalid HTML, and a sibling form could not see which
 * variant the customer had chosen.
 *
 * Add-only. Knowing whether something is already saved would mean reading the
 * session cookie during render, which would make all ~2,000 prerendered product
 * pages dynamic. Removal lives on /wishlist, which is per-customer anyway.
 */
export async function addToWishlistAction(formData) {
  const productId = field(formData, 'productId');
  const variantId = field(formData, 'variantId');
  const slug = field(formData, 'slug');
  const back = slug ? `/product/${slug}` : '/';

  if (!productId || !variantId) {
    redirect(`${back}?error=variant`);
  }

  const result = await addToWishlist(productId, variantId);

  /* The backend attributes the row to the authenticated customer, so an
     anonymous save has nothing to attach to. Sign in, then come back here. */
  if (result.requiresLogin) {
    redirect(`/login?next=${back}`);
  }

  if (!result.ok) {
    redirect(`${back}?error=wishlist`);
  }

  revalidatePath('/wishlist');
  // Same pattern as add-to-cart, which lands on /cart: show them the result.
  redirect('/wishlist?added=1');
}

/* Mirrors the backend's own rules, which are the ones that actually decide.
   `max:5048` there is in KILOBYTES, so the file ceiling is ~5 MB. */
const MAX_COMMENT = 1000;
const MAX_NICKNAME = 100;
const MAX_PHOTO_BYTES = 5048 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Post or edit a review.
 *
 * useActionState shape, so the form can show per-field messages rather than
 * navigating away — which matters here because a rejected 900-character
 * review that lost its text would be infuriating. Everything typed is echoed
 * back on failure.
 *
 * WHAT HAPPENS NEXT IS MODERATION, and the success message says so. Every row
 * is written at status 0 and the read endpoint only returns status 1, so a
 * customer who posts and reloads will not see their own words yet. Telling
 * them that is the difference between a queue and a bug.
 *
 * Re-submitting is safe: the endpoint upserts on (customer, product), so this
 * is also the edit path. An edit returns the row to status 0, because the
 * approved copy was approved on its old text.
 */
export async function submitReviewAction(prevState, formData) {
  const productId = field(formData, 'productId');
  const slug = field(formData, 'slug');

  const values = {
    rating: field(formData, 'rating'),
    comment: field(formData, 'comment'),
    nickname: field(formData, 'nickname'),
  };

  const photo = formData.get('photo');
  const hasPhoto = photo && typeof photo === 'object' && photo.size > 0;

  /* Asked for only when the customer has none — the form renders the field in
     that case alone, and the backend requires it in exactly the same case. A
     hidden flag rather than inferring from an empty value, because an existing
     nickname means the field is absent, not blank. */
  const nicknameRequired = field(formData, 'nicknameRequired') === '1';

  const { valid, errors } = validate(values, {
    rating: [
      (v) => (v ? null : '評価を選択してください。'),
      (v) => {
        const n = Number(v);
        return Number.isInteger(n) && n >= 1 && n <= 5
          ? null
          : '評価は1から5の間で選択してください。';
      },
    ],
    comment: [
      (v) => rules.required(v, 'レビュー本文'),
      (v) => rules.maxLength(v, MAX_COMMENT, 'レビュー本文'),
    ],
    nickname: nicknameRequired
      ? [
          (v) => rules.required(v, 'お名前（ニックネーム）'),
          (v) => rules.maxLength(v, MAX_NICKNAME, 'お名前（ニックネーム）'),
        ]
      : [(v) => rules.maxLength(v, MAX_NICKNAME, 'お名前（ニックネーム）')],
  });

  /* The file is checked here rather than through `validate`, which works on
     strings. Both checks exist server-side on purpose: `accept` and a size
     check in the browser are conveniences, and the backend rejects the same
     two things with a 422 the customer would have to decode. */
  if (hasPhoto && !PHOTO_TYPES.includes(photo.type)) {
    errors.photo = '画像はJPEG、PNG、WebP形式でお送りください。';
  } else if (hasPhoto && photo.size > MAX_PHOTO_BYTES) {
    errors.photo = '画像は5MB以内でお送りください。';
  }

  if (!productId) {
    errors.form = '対象の商品が特定できませんでした。';
  }

  if (!valid || Object.keys(errors).length > 0) {
    return { errors, values };
  }

  const result = await submitReview({
    productId,
    rating: Number(values.rating),
    comment: values.comment,
    nickname: values.nickname || undefined,
    photo: hasPhoto ? photo : null,
  });

  if (result.requiresLogin) {
    return {
      errors: { form: 'レビューの投稿にはログインが必要です。' },
      values,
    };
  }

  if (!result.ok) {
    return { errors: { form: result.error }, values };
  }

  /* So an approved review appears without waiting for the page's own
     revalidation window. It will not show this one yet — it is at status 0 —
     but a customer editing an already-approved review would otherwise go on
     seeing the old text. */
  if (slug) revalidatePath(`/product/${slug}`);

  return {
    success:
      'レビューを受け付けました。内容を確認のうえ掲載いたしますので、しばらくお待ちください。',
    errors: {},
    values: { rating: '', comment: '', nickname: values.nickname },
  };
}
