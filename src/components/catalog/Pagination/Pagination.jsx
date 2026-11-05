import Link from 'next/link';
import styles from './Pagination.module.css';
import { buildListingUrl } from '@/lib/query';
import { formatNumber } from '@/lib/format';

/**
 * Pagination — real anchor links, so pages are crawlable and shareable.
 *
 * Windowed around the current page with first/last always reachable, which
 * keeps the control usable at 150+ pages without emitting 150 links.
 *
 * @param {Object} props
 * @param {string} props.basePath
 * @param {import('@/lib/types').ProductQuery} props.query
 * @param {number} props.page
 * @param {number} props.totalPages
 * @param {number} props.total
 * @param {number} props.perPage
 * @param {Object} [props.keep] Params to preserve (category/symptom)
 */
export default function Pagination({
  basePath,
  query,
  page,
  totalPages,
  total,
  perPage,
  keep = {},
}) {
  if (totalPages <= 1) {
    return total > 0 ? (
      <p className={styles.summary}>{formatNumber(total)}件の商品</p>
    ) : null;
  }

  const href = (p) => buildListingUrl(basePath, query, { page: p, ...keep });
  const pages = windowed(page, totalPages);

  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  return (
    <>
      <nav className={styles.nav} aria-label="ページ送り">
        <ul className={styles.list} role="list">
          <li>
            <Link
              href={page > 1 ? href(page - 1) : '#'}
              className={`${styles.link} ${page <= 1 ? styles.disabled : ''}`}
              aria-disabled={page <= 1}
              rel="prev"
            >
              前へ
            </Link>
          </li>

          {pages.map((p, i) =>
            p === '…' ? (
              <li key={`gap-${i}`} className={styles.ellipsis} aria-hidden="true">
                …
              </li>
            ) : (
              <li key={p}>
                <Link
                  href={href(p)}
                  className={`${styles.link} ${p === page ? styles.current : ''}`}
                  aria-current={p === page ? 'page' : undefined}
                  aria-label={`${p}ページ目`}
                >
                  {p}
                </Link>
              </li>
            )
          )}

          <li>
            <Link
              href={page < totalPages ? href(page + 1) : '#'}
              className={`${styles.link} ${page >= totalPages ? styles.disabled : ''}`}
              aria-disabled={page >= totalPages}
              rel="next"
            >
              次へ
            </Link>
          </li>
        </ul>
      </nav>

      <p className={styles.summary}>
        {formatNumber(total)}件中 {formatNumber(first)}〜{formatNumber(last)}件を表示
      </p>
    </>
  );
}

/** Page numbers with ellipses: 1 … 4 5 [6] 7 8 … 20 */
function windowed(current, total, span = 1) {
  const pages = new Set([1, total]);
  for (let p = current - span; p <= current + span; p += 1) {
    if (p > 1 && p < total) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out = [];
  let prev = 0;

  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}
