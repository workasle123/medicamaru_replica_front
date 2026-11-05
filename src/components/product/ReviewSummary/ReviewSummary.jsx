import Image from 'next/image';

import styles from './ReviewSummary.module.css';
import Rating from '@/components/ui/Rating/Rating';
import { formatRating, formatNumber, formatDate } from '@/lib/format';

/**
 * ReviewSummary — aggregate rating and score distribution.
 *
 * Percentages are derived from counts the backend supplies; no rating value
 * is computed here beyond turning a count into a bar width.
 *
 * Individual reviews are listed below the aggregate. That note used to say
 * the backend had no read API for them — it does, GET /product/{id}/reviews,
 * and it has for a while. The endpoint was even already named in
 * lib/api/endpoints.js; nothing called it.
 *
 * The aggregate still comes from the product payload rather than from that
 * response, which also carries an avgRating. Reading one number from two
 * places is how they end up disagreeing on screen.
 *
 * `reviews` being empty is NOT the same as `rating.count` being 0: every row
 * is held at status 0 until an admin approves it, so a product can carry a
 * score with nothing yet published to show beneath it. Those two cases say
 * different things.
 *
 * @param {Object} props
 * @param {import('@/lib/types').RatingSummary} props.rating
 * @param {import('@/lib/types').ProductReview[]} [props.reviews]
 * @param {React.ReactNode} [props.form]  The submission form, injected by the
 *   product page. A slot rather than an import, because the form is a Client
 *   Component and this is not — and because a surface with no form (should
 *   one ever exist) must still render the list.
 */
export default function ReviewSummary({ rating, reviews = [], form = null }) {
  if (!rating || !rating.count) {
    return (
      <section id="reviews" className={styles.section}>
        <h2 className={styles.title}>カスタマーレビュー</h2>
        {/* The invitation is back, and conditional on the form actually being
            there — it asked for something a visitor could not do for as long
            as there was no form behind it. The form decides for itself whether
            the visitor is eligible, so the wording here stays neutral. */}
        <p className={styles.empty}>
          {form
            ? 'この商品にはまだレビューがありません。最初のレビューをお寄せください。'
            : 'この商品にはまだレビューがありません。'}
        </p>
        {form}
      </section>
    );
  }

  const { average, count, histogram = {}, recommendPct } = rating;

  return (
    <section id="reviews" className={styles.section}>
      <h2 className={styles.title}>カスタマーレビュー</h2>

      <div className={styles.panel}>
        <div className={styles.score}>
          <span className={`${styles.average} numeric`}>{formatRating(average)}</span>
          <span className={styles.outOf}>／ 5</span>
          {/* aggregate={false} even though this IS the aggregate. Rating adds
              its own count clause — and with no count passed it was announcing
              「レビューはまだありません」 next to a visible 203件. Passing the
              count instead would make Rating render its own (203件) beside the
              span below it. The span is the count, for everyone. */}
          <Rating average={average} aggregate={false} />
          <span className={styles.count}>{formatNumber(count)}件のレビュー</span>
          {typeof recommendPct === 'number' && (
            <span className={styles.count}>{recommendPct}%の方が「満足」と回答</span>
          )}
        </div>

        <div className={styles.histogram}>
          {[5, 4, 3, 2, 1].map((star) => {
            const value = histogram[star] ?? histogram[String(star)] ?? 0;
            const pct = count > 0 ? Math.round((value / count) * 100) : 0;
            return (
              <div key={star} className={styles.row}>
                <span>★{star}</span>
                <span className={styles.track}>
                  <span className={styles.bar} style={{ width: `${pct}%` }} />
                </span>
                <span className={`${styles.pct} numeric`}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {reviews.length > 0 && (
        <ul className={styles.reviews}>
          {reviews.map((review) => (
            <li key={review.id} className={styles.review}>
              <div className={styles.reviewHead}>
                <Rating average={review.rating} aggregate={false} />
                <span className={styles.reviewAuthor}>{review.author}</span>
                {review.createdAt && (
                  <span className={styles.reviewDate}>{formatDate(review.createdAt)}</span>
                )}
              </div>

              <p className={styles.reviewBody}>{review.comment}</p>

              {review.image && (
                /* Unoptimised and lazy: these are customer uploads of unknown
                   size, and running them through the optimiser would put
                   arbitrary visitor-supplied files through it on every product
                   page. 160px is all the thumbnail needs. */
                <Image
                  src={review.image}
                  alt=""
                  width={160}
                  height={160}
                  className={styles.reviewImage}
                  loading="lazy"
                  unoptimized
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {form}
    </section>
  );
}
