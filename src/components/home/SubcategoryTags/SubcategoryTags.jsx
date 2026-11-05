import Link from 'next/link';
import ScrollRail from '@/components/ui/ScrollRail/ScrollRail';
import styles from './SubcategoryTags.module.css';

/**
 * SubcategoryTags — a category's subcategories as a row of chips.
 *
 * Sits under the category heading on the homepage rails, giving a second way
 * into the catalogue without spending a whole section on it.
 *
 * The row scrolls rather than wraps, so a category with eight subcategories
 * takes exactly as much vertical space as one with three. Arrows appear only
 * when the row genuinely overflows — which depends on label length, not just
 * count — and step one chip at a time, since paging a whole row would skip
 * past chips the reader was still scanning.
 *
 * @param {Object} props
 * @param {{slug: string, name: string}[]} props.subcategories
 * @param {string} props.parentSlug  The category these sit under — subcategory
 *   URLs are nested as /category/{parent}/{child}.
 * @param {string} props.categoryName  Used to name the arrows for screen readers.
 */
export default function SubcategoryTags({ subcategories = [], parentSlug, categoryName = '' }) {
  if (!subcategories.length) return null;

  return (
    <div className={styles.wrap}>
      <ScrollRail fluid step="item" label={`${categoryName}のサブカテゴリー`}>
        {subcategories.map((sub) => (
          <li key={sub.slug}>
            <Link href={`/category/${parentSlug}/${sub.slug}`} className={styles.tag}>
              {sub.name}
            </Link>
          </li>
        ))}
      </ScrollRail>
    </div>
  );
}
