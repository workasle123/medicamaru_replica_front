import styles from './Rating.module.css';
import { formatRating, formatNumber } from '@/lib/format';

const STARS = '★★★★★';

/**
 * Rating — fractional star display with an accessible text equivalent.
 *
 * Every reference site shows stars plus a review count on each card; the
 * count does more work for trust than the stars alone, so it is not optional.
 *
 * @param {Object} props
 * @param {number} props.average  0–5
 * @param {number} [props.count]
 * @param {boolean} [props.showValue]
 * @param {boolean} [props.aggregate]  False when these stars are ONE review's
 *   own score rather than an average over many. The screen-reader text then
 *   drops the count clause, which otherwise reads 「レビューはまだありません」
 *   on every row of a list of reviews — count defaults to 0, and this used to
 *   infer "an aggregate with nothing in it" from that.
 * @param {string} [props.className]
 */
export default function Rating({
  average = 0,
  count = 0,
  showValue = false,
  aggregate = true,
  className = '',
}) {
  const clamped = Math.max(0, Math.min(5, Number(average) || 0));
  const pct = (clamped / 5) * 100;

  return (
    <span className={[styles.rating, className].filter(Boolean).join(' ')}>
      <span className={styles.stars} aria-hidden="true">
        {STARS}
        <span className={styles.fill} style={{ width: `${pct}%` }}>
          {STARS}
        </span>
      </span>

      {showValue && <span className={styles.value}>{formatRating(clamped)}</span>}

      {count > 0 && <span className={styles.count}>({formatNumber(count)}件)</span>}

      <span className="visually-hidden">
        5段階評価で {formatRating(clamped)}
        {!aggregate ? '' : count > 0 ? `、レビュー ${formatNumber(count)}件` : '、レビューはまだありません'}
      </span>
    </span>
  );
}
