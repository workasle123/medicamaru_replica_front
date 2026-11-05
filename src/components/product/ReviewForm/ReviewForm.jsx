'use client';

import { useActionState, useEffect, useId, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';

import styles from './ReviewForm.module.css';
import Alert from '@/components/ui/Alert/Alert';
import Button from '@/components/ui/Button/Button';
import { submitReviewAction } from '@/app/product/[slug]/actions';

const MAX_COMMENT = 1000;

/**
 * ReviewForm — post or edit a review of this product.
 *
 * A Client Component that decides for itself whether to appear, because the
 * product pages are PRERENDERED STATIC HTML. Reading the session cookie during
 * their render would make all ~3,000 of them dynamic and cost the speed and
 * indexability they exist for, so eligibility is fetched after hydration from
 * /api/product/{id}/review-eligibility.
 *
 * It renders one of four things, and the difference between them is the point:
 *
 *   - nothing, while the answer is unknown. A form that appears and then
 *     vanishes is worse than one that arrives a moment late.
 *   - an invitation to sign in, for a guest.
 *   - the condition, stated plainly, for a signed-in customer who has not
 *     ordered this product. Saying nothing would leave them wondering why
 *     other people's reviews are there and theirs cannot be.
 *   - the form.
 *
 * ONLY CUSTOMERS WHO ORDERED THE PRODUCT. The backend does not check this —
 * it would accept a review from any signed-in customer — so this is the
 * storefront's rule, and it is the reason the ratings mean anything. It also
 * matches what マイページ already promises about review points: 「ご購入いただ
 * いた商品のレビュー」.
 *
 * MODERATION IS VISIBLE. Every review is written at status 0 and the read
 * endpoint returns only status 1, so a customer who posts and reloads will not
 * find their own words. The success message says so; without it, a working
 * queue looks like a page that swallowed their writing.
 *
 * @param {Object} props
 * @param {string|number} props.productId
 * @param {string} props.slug  For revalidating this product's page after a post.
 */
export default function ReviewForm({ productId, slug }) {
  const [eligibility, setEligibility] = useState(null);
  const [state, formAction] = useActionState(submitReviewAction, { errors: {}, values: {} });
  const errors = state.errors ?? {};
  const values = state.values ?? {};
  const fieldId = useId();

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/product/${productId}/review-eligibility`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setEligibility(data);
      })
      .catch(() => {
        /* Leave it unknown. The form simply does not appear, which is the same
           outcome as a signed-out visitor and needs no apology. */
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!eligibility) return null;

  if (!eligibility.signedIn) {
    return (
      <div className={styles.gate}>
        <p className={styles.gateText}>
          ご購入いただいた商品には、レビューを投稿いただけます。
        </p>
        <Link href="/login" className={styles.gateLink}>
          ログインする
        </Link>
      </div>
    );
  }

  if (!eligibility.purchased) {
    return (
      <div className={styles.gate}>
        <p className={styles.gateText}>
          レビューは、この商品をご注文いただいたお客様にご投稿いただけます。
        </p>
      </div>
    );
  }

  const nicknameRequired = !eligibility.nickname;

  return (
    <div className={styles.wrap}>
      <h3 className={styles.heading}>レビューを書く</h3>

      {state.success ? (
        <Alert variant="success" title="レビューを受け付けました">
          {state.success}
        </Alert>
      ) : (
        <form action={formAction} className={styles.form} noValidate>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="slug" value={slug ?? ''} />
          {/* Tells the action whether the nickname field was rendered at all.
              An existing nickname means the field is ABSENT, not blank — and
              the backend writes the nickname only when the field is present,
              so sending an empty one would erase it. */}
          <input type="hidden" name="nicknameRequired" value={nicknameRequired ? '1' : '0'} />

          {errors.form && <Alert variant="error">{errors.form}</Alert>}

          <StarInput id={`${fieldId}-rating`} error={errors.rating} defaultValue={values.rating} />

          <div className={styles.field}>
            <label htmlFor={`${fieldId}-comment`} className={styles.label}>
              レビュー本文
              <span className={styles.required}>必須</span>
            </label>
            <CommentBox id={`${fieldId}-comment`} defaultValue={values.comment} />
            {errors.comment && <p className={styles.error}>{errors.comment}</p>}
          </div>

          {nicknameRequired && (
            <div className={styles.field}>
              <label htmlFor={`${fieldId}-nickname`} className={styles.label}>
                お名前（ニックネーム）
                <span className={styles.required}>必須</span>
              </label>
              {/* Asked once. It is saved to the account, so later reviews do
                  not ask again — and it is what every review is displayed
                  under, rather than the customer's real name. */}
              <input
                id={`${fieldId}-nickname`}
                name="nickname"
                type="text"
                className={styles.input}
                maxLength={100}
                defaultValue={values.nickname}
                autoComplete="nickname"
              />
              <p className={styles.hint}>
                レビューはこのお名前で掲載されます。ご本名以外をおすすめします。
              </p>
              {errors.nickname && <p className={styles.error}>{errors.nickname}</p>}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor={`${fieldId}-photo`} className={styles.label}>
              写真（任意）
            </label>
            <input
              id={`${fieldId}-photo`}
              name="photo"
              type="file"
              className={styles.file}
              accept="image/jpeg,image/png,image/webp"
            />
            <p className={styles.hint}>JPEG・PNG・WebP形式、5MBまで。</p>
            {errors.photo && <p className={styles.error}>{errors.photo}</p>}
          </div>

          <p className={styles.terms}>
            ご投稿いただいた内容は、確認のうえ掲載いたします。効能・効果を断定する表現や、
            事実に反する内容は掲載をお見送りする場合がございます。
          </p>

          <SubmitButton />
        </form>
      )}
    </div>
  );
}

/**
 * The rating, as five radio buttons.
 *
 * Radios rather than a click-a-star widget: a radio group is reachable by
 * keyboard and announced correctly without any work, it submits without
 * JavaScript, and the stars are drawn with CSS over it. The visual order is
 * reversed in CSS so that hovering the third star fills the first three, which
 * is what everyone expects of a star rating.
 */
function StarInput({ id, error, defaultValue }) {
  const selected = String(defaultValue ?? '');

  return (
    <fieldset className={styles.field}>
      <legend className={styles.label}>
        評価
        <span className={styles.required}>必須</span>
      </legend>

      <div className={styles.stars}>
        {[5, 4, 3, 2, 1].map((n) => (
          <span key={n} className={styles.star}>
            <input
              type="radio"
              id={`${id}-${n}`}
              name="rating"
              value={n}
              defaultChecked={selected === String(n)}
              className={styles.starInput}
            />
            <label htmlFor={`${id}-${n}`} className={styles.starLabel}>
              <span className={styles.starGlyph} aria-hidden="true">
                ★
              </span>
              <span className="visually-hidden">星{n}つ</span>
            </label>
          </span>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </fieldset>
  );
}

/** The body, with a live character count against the backend's own ceiling. */
function CommentBox({ id, defaultValue }) {
  const [length, setLength] = useState(String(defaultValue ?? '').length);

  return (
    <>
      <textarea
        id={id}
        name="comment"
        rows={6}
        className={styles.textarea}
        maxLength={MAX_COMMENT}
        defaultValue={defaultValue}
        onChange={(event) => setLength(event.currentTarget.value.length)}
        placeholder="使用した感想や、購入を検討されている方の参考になる点をお書きください。"
      />
      <p className={styles.counter} aria-live="polite">
        {length} / {MAX_COMMENT}文字
      </p>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <div className={styles.actions}>
      <Button type="submit" disabled={pending}>
        {pending ? '送信中…' : 'レビューを投稿する'}
      </Button>
    </div>
  );
}
