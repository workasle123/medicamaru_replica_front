import styles from '@/components/catalog/ListingLayout/ListingLayout.module.css';
import filterStyles from '@/components/catalog/FilterPanel/FilterPanel.module.css';
import pageStyles from '@/components/catalog/Pagination/Pagination.module.css';
import Skeleton from '@/components/ui/Skeleton/Skeleton';
import ProductGridSkeleton from './ProductGridSkeleton';

/**
 * The catalogue shell, before the products.
 *
 * Covers every listing surface — category, subcategory, symptom and search —
 * because they all render through ListingLayout, and this reuses that
 * component's own CSS module. The sidebar appears at 1024px and the filters
 * collapse into the mobile disclosure below it, exactly as the real listing
 * does, so nothing moves sideways when the products arrive.
 *
 * The TITLE is drawn as a real heading when the caller knows it. On a search
 * results page that is the query the visitor just typed, and on a category it
 * is the category they just clicked — both are already on screen in the URL
 * or the link they came from, so greying them out would hide something the
 * page could say immediately.
 *
 * @param {Object} props
 * @param {string} [props.title]
 * @param {boolean} [props.description=true] Leave room for the category's
 *   intro paragraph. False for search, which has none.
 * @param {number} [props.count=10] Placeholder cards.
 */
export default function ListingSkeleton({ title, description = true, count = 10 }) {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar} aria-label="絞り込み">
        <div className={styles.desktopOnly}>
          <FilterPanelSkeleton />
        </div>
      </aside>

      <div className={styles.results}>
        <header className={styles.header}>
          {title ? (
            <h1 className={styles.title}>{title}</h1>
          ) : (
            <Skeleton as="div" height="1.75rem" width="min(22rem, 70%)" />
          )}
          {description && (
            <p className={styles.description}>
              <Skeleton height="0.75rem" />
            </p>
          )}
        </header>

        <div className={styles.mobileFilters}>
          {/* A closed <details>, not a disclosure that cannot open: the real
              one works without JavaScript, so it is already interactive in
              the fallback and tapping it does what tapping it will do. */}
          <div className={styles.disclosure}>
            <div className={styles.disclosureSummary}>
              <Skeleton height="0.875rem" width="12rem" />
            </div>
          </div>
        </div>

        <div className={styles.toolbar}>
          <Skeleton height="0.875rem" width="8rem" />
          <Skeleton height="var(--control-h-md)" width="11rem" radius="var(--radius-md)" />
        </div>

        <ProductGridSkeleton count={count} />

        <div className={pageStyles.nav}>
          <div className={pageStyles.list}>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} height="44px" width="44px" radius="var(--radius-md)" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The filter rail: a 「カテゴリー」 heading over a list of category rows.
 *
 * Eight rows is roughly the real count and about a screen's worth, so the
 * sticky column is the same height it will be — a shorter placeholder would
 * let the page scroll further than it can once the filters land.
 */
function FilterPanelSkeleton() {
  return (
    <div className={filterStyles.panel}>
      <div className={filterStyles.group}>
        <p className={filterStyles.groupTitle}>カテゴリー</p>

        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={filterStyles.categoryGroup}>
            <div className={filterStyles.categorySummary}>
              <Skeleton height="0.875rem" width={`${55 + ((i * 7) % 35)}%`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
