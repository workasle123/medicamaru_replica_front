import styles from './ListingLayout.module.css';
import FilterPanel from '@/components/catalog/FilterPanel/FilterPanel';
import SortSelect from '@/components/catalog/SortSelect/SortSelect';
import ProductGrid from '@/components/product/ProductGrid/ProductGrid';
import Pagination from '@/components/catalog/Pagination/Pagination';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { formatNumber } from '@/lib/format';
import { describeQuery } from '@/lib/query';

/**
 * ListingLayout — the shared shell for every catalogue surface: category,
 * symptom, search and offers.
 *
 * Centralised so filtering, sorting, pagination, counts and the empty state
 * behave identically everywhere, rather than being reimplemented per page.
 *
 * Server Component. The only client-side JavaScript in the whole catalogue is
 * SortSelect, because a <select> must navigate on change.
 *
 * On mobile the filters collapse into a native <details> disclosure — no
 * JavaScript, no focus-trap bugs, and it works before hydration.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {string} props.basePath
 * @param {import('@/lib/types').ProductQuery} props.query
 * @param {import('@/lib/types').Paginated} props.result
 * @param {import('@/lib/types').Category[]} [props.categories]
 * @param {Object} [props.keep]
 * @param {React.ReactNode} [props.empty]
 */
export default function ListingLayout({
  title,
  description,
  basePath,
  query,
  result,
  categories = [],
  keep = {},
  empty,
}) {
  const { items, page, perPage, total, totalPages } = result;
  const filterSummary = describeQuery(query);

  const filters = (
    <FilterPanel
      basePath={basePath}
      query={query}
      categories={categories}
      keepCategoryParam={Boolean(keep.keepCategoryParam)}
    />
  );

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar} aria-label="絞り込み">
        <div className={styles.desktopOnly}>{filters}</div>
      </aside>

      <div className={styles.results}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </header>

        <div className={styles.mobileFilters}>
          <details className={styles.disclosure}>
            <summary className={styles.disclosureSummary}>
              絞り込み・条件を変更する
            </summary>
            <div className={styles.disclosureBody}>{filters}</div>
          </details>
        </div>

        <div className={styles.toolbar}>
          <p className={styles.count}>
            <span className={styles.countValue}>{formatNumber(total)}</span> 件
            {filterSummary && <>（{filterSummary}）</>}
          </p>
          <SortSelect basePath={basePath} query={{ ...query, ...keep }} />
        </div>

        <ProductGrid
          products={items}
          empty={
            empty ?? (
              <EmptyState
                title="条件に合う商品が見つかりませんでした"
                body="絞り込み条件を減らすか、別のキーワードでお試しください。"
                actionHref={basePath}
                actionLabel="条件をリセットする"
              />
            )
          }
        />

        <Pagination
          basePath={basePath}
          query={query}
          page={page}
          totalPages={totalPages}
          total={total}
          perPage={perPage}
          keep={keep}
        />
      </div>
    </div>
  );
}
