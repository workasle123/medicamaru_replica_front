import Link from 'next/link';
import styles from './SymptomChips.module.css';
import { formatNumber } from '@/lib/format';

/**
 * SymptomChips — the symptom browse axis.
 *
 * Shoppers on a pharmacy site arrive knowing a symptom, not a category name.
 * Neither medicine.shop nor most competitors offer this entry point; it is a
 * deliberate differentiator (Phase 2 §4).
 *
 * Two jobs, and `hrefFor` is what separates them:
 *
 *  - On /symptom it is a list of links to pages, one per chip. Default
 *    behaviour: `basePath` + the slug.
 *  - On a group page it is a TAB STRIP. The group passes `hrefFor`, which
 *    returns a query-string URL on the same path, so choosing a symptom swaps
 *    the products without leaving the page.
 *
 * In tab mode the links also opt out of Next's scroll-to-top. The strip sits
 * just under the breadcrumb, so jumping to the top on every tab press moves
 * the page for no reason — and on a long listing it would throw away where
 * the reader was.
 *
 * @param {Object} props
 * @param {{slug: string, name: string, label?: string, productCount?: number}[]} props.symptoms
 * @param {string} [props.activeSlug]
 * @param {string} [props.basePath]  Defaults to /symptom. Ignored when hrefFor is given.
 * @param {(symptom: object) => string} [props.hrefFor]  Tab mode.
 * @param {{label: string, href: string, count?: number}} [props.leading]
 *   A chip before the rest — the group page's すべて, which clears the tab.
 */
export default function SymptomChips({
  symptoms = [],
  activeSlug,
  basePath = '/symptom',
  hrefFor,
  leading,
}) {
  if (!symptoms.length) return null;

  const base = basePath.replace(/\/$/, '');
  const tabMode = Boolean(hrefFor);

  /* Tab mode gets the one-line scroller. The other two callers — /symptom's
     flat fallback and its search results — are a page OF chips, where wrapping
     is the right thing. */
  return (
    <ul className={`${styles.list} ${tabMode ? styles.scroller : ''}`} role="list">
      {leading && (
        <li>
          <Link
            href={leading.href}
            className={`${styles.chip} ${styles.clearChip}`}
            scroll={!tabMode}
          >
            <span>{leading.label}</span>
            {typeof leading.count === 'number' && leading.count > 0 && (
              <span className={styles.count}>{formatNumber(leading.count)}</span>
            )}
          </Link>
        </li>
      )}

      {symptoms.map((symptom) => {
        const isActive = symptom.slug === activeSlug;

        return (
          <li key={symptom.slug}>
            <Link
              href={hrefFor ? hrefFor(symptom) : `${base}/${symptom.slug}`}
              className={`${styles.chip} ${isActive ? styles.active : ''}`}
              /* `page` when a chip IS the page, `true` when it is a tab on one
                 — the tab does not change which page you are on. */
              aria-current={isActive ? (tabMode ? 'true' : 'page') : undefined}
              scroll={!tabMode}
            >
              {/* `label` is the short form authored in the admin; `name` is the
                  full indication string, which is three clauses long on most
                  rows and unreadable on a chip. */}
              <span>{symptom.label || symptom.name}</span>

              {typeof symptom.productCount === 'number' && symptom.productCount > 0 && (
                <span className={styles.count}>{formatNumber(symptom.productCount)}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
