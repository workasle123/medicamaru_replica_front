import Link from 'next/link';
import styles from './FilterPanel.module.css';
import { buildListingUrl, isFiltered } from '@/lib/query';
import { formatNumber } from '@/lib/format';

/**
 * FilterPanel — catalogue refinement.
 *
 * Every control is a plain <Link>, which means:
 *  - it is a Server Component and ships no JavaScript,
 *  - every filter state is a real, shareable, bookmarkable URL,
 *  - it works with JavaScript disabled,
 *  - and crawlers can follow the ones we choose to expose.
 *
 * medicine.shop has no filtering whatsoever, so this is the single largest
 * functional gap this storefront closes (Phase 2 §7).
 *
 * @param {Object} props
 * @param {string} props.basePath
 * @param {import('@/lib/types').ProductQuery} props.query
 * @param {import('@/lib/types').Category[]} [props.categories]
 * @param {boolean} [props.keepCategoryParam] Category is a param, not a path segment
 */
/* 症状から絞り込む was removed from this panel (2026-09-29).

   It showed the six most productive symptoms out of ~300 plus a search box —
   a shortlist of a browse axis, crammed into a column beside another browse
   axis. /symptom is now a proper grid of 19 groups with the symptoms as
   refinements inside one, which does that job far better than six chips can,
   and the header and footer both link to it. */

export default function FilterPanel({
  basePath,
  query,
  categories = [],
  keepCategoryParam = false,
}) {
  const keep = { keepCategoryParam, keepSymptomParam: !keepCategoryParam };

  return (
    <div className={styles.panel}>
      {categories.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>カテゴリー</h3>
          <div>
            {categories.map((category) => (
              <CategoryGroup
                key={category.slug}
                category={category}
                activeSlug={query.category}
              />
            ))}
          </div>
        </div>
      )}

      {isFiltered(query) && (
        <Link href={basePath} className={styles.reset}>
          絞り込みをリセット
        </Link>
      )}
    </div>
  );
}

/**
 * One category and its subcategories, as a native <details> disclosure.
 *
 * No JavaScript: the browser handles expand/collapse, keyboard interaction
 * and focus. The group renders `open` when the active slug is this category
 * or one of its children, so a visitor always arrives with their own branch
 * already expanded rather than having to hunt for it.
 */
function CategoryGroup({ category, activeSlug }) {
  const children = category.children ?? [];
  const isParentActive = activeSlug === category.slug;
  const activeChild = children.find((c) => c.slug === activeSlug);
  const isOpen = isParentActive || Boolean(activeChild);

  // A category with no subcategories is a plain link — a disclosure that
  // reveals nothing is just an obstacle.
  if (!children.length) {
    return (
      <Link
        href={`/category/${category.slug}`}
        className={`${styles.categorySummary} ${isParentActive ? styles.summaryActive : ''}`}
      >
        <span className={styles.summaryMain}>{category.name}</span>
        <CategoryCount value={category.productCount} />
      </Link>
    );
  }

  return (
    <details className={styles.categoryGroup} open={isOpen}>
      <summary
        className={`${styles.categorySummary} ${isParentActive ? styles.summaryActive : ''}`}
      >
        <span className={styles.summaryMain}>
          <Chevron />
          {category.name}
        </span>
        <CategoryCount value={category.productCount} />
      </summary>

      <ul className={styles.subList} role="list">
        <li>
          <Link
            href={`/category/${category.slug}`}
            className={`${styles.subLink} ${isParentActive ? styles.subActive : ''}`}
          >
            <span className={styles.viewAll}>すべて見る</span>
          </Link>
        </li>

        {children.map((child) => (
          <li key={child.slug}>
            {/* Nested, not /category/{child}. The flat form 308s to this one
                (see sitemap.js), and now that every category carries its
                children that is a redirect on every link in the tree rather
                than on the handful the viewed category used to show. */}
            <Link
              href={`/category/${category.slug}/${child.slug}`}
              className={`${styles.subLink} ${child.slug === activeSlug ? styles.subActive : ''}`}
            >
              <span>{child.name}</span>
              <CategoryCount value={child.productCount} />
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

function CategoryCount({ value }) {
  if (typeof value !== 'number') return null;
  return <span className={styles.count}>{formatNumber(value)}</span>;
}

function Chevron() {
  return (
    <svg
      className={styles.chevron}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
