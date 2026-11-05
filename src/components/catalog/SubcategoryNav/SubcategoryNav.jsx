import Link from 'next/link';
import styles from './SubcategoryNav.module.css';
import { formatNumber } from '@/lib/format';

/**
 * SubcategoryNav — subcategory links shown above a category's results.
 *
 * The sidebar tree is hidden below 1024px, so on mobile this row is the only
 * way to move between sibling subcategories. It is not a duplicate of the
 * sidebar; it is the mobile path.
 *
 * @param {Object} props
 * @param {{slug: string, name: string, productCount?: number}[]} props.subcategories
 * @param {string} [props.activeSlug]
 * @param {{slug: string, name: string}} [props.parent] Shown when viewing a child
 * @param {string} props.parentSlug  The category all these siblings belong to.
 *   Their URLs nest under it, so it is required even when `parent` is absent
 *   (viewing the category itself, where it is that category's own slug).
 */
export default function SubcategoryNav({ subcategories = [], activeSlug, parent, parentSlug }) {
  if (!subcategories.length) return null;

  return (
    <nav className={styles.nav} aria-label="サブカテゴリー">
      <p className={styles.heading}>絞り込んで探す</p>

      <ul className={styles.list} role="list">
        {parent && (
          <li>
            <Link href={`/category/${parent.slug}`} className={`${styles.chip} ${styles.parentChip}`}>
              ← {parent.name}すべて
            </Link>
          </li>
        )}

        {subcategories.map((sub) => (
          <li key={sub.slug}>
            <Link
              href={`/category/${parentSlug}/${sub.slug}`}
              className={`${styles.chip} ${sub.slug === activeSlug ? styles.active : ''}`}
              aria-current={sub.slug === activeSlug ? 'page' : undefined}
            >
              <span>{sub.name}</span>
              {typeof sub.productCount === 'number' && (
                <span className={styles.count}>{formatNumber(sub.productCount)}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
