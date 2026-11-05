import Image from 'next/image';
import Link from 'next/link';

import styles from './CategoryGrid.module.css';
import { formatNumber } from '@/lib/format';

/**
 * CategoryGrid — top-level category navigation, as icon tiles.
 *
 * Each tile is the category's icon with its name beneath. Icons are uploaded
 * per category in the admin panel (Product Category -> Category Icon) and
 * arrive as `iconUrl`.
 *
 * A category without an icon shows a tinted disc carrying the first character
 * of its name, in the same frame an icon would sit in. Every tile keeps the same
 * height and shape whether or not its icon has been uploaded yet, so the row
 * never looks half-broken while icons are being added one at a time.
 *
 * The whole tile is the target. The name is the one link, and its ::after is
 * stretched over the card, which keeps the markup to a single anchor: nesting
 * the subcategory links inside a card-sized <a> would be invalid HTML.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Category[]} props.categories
 * @param {number} [props.limit]
 */
export default function CategoryGrid({ categories = [], limit }) {
  const items = limit ? categories.slice(0, limit) : categories;

  if (!items.length) return null;

  return (
    <ul className={styles.grid} role="list">
      {items.map((category) => (
        <li key={category.slug}>
          <div className={styles.card}>
            <span className={styles.iconFrame} aria-hidden="true">
              {category.iconUrl ? (
                /* Empty alt: the name directly below says the same thing, and a
                   screen reader would otherwise announce every category twice.
                   No `sizes`: with a fixed width, next/image emits just a 1x and
                   2x candidate (64w, 128w). Passing `sizes` switches it to the
                   full device-width list, up to 1920w, for a 64px icon. */
                <Image
                  src={category.iconUrl}
                  alt=""
                  width={64}
                  height={64}
                  className={styles.icon}
                />
              ) : (
                <span className={styles.iconFallback}>{Array.from(category.name)[0] ?? ''}</span>
              )}
            </span>

            <Link href={`/category/${category.slug}`} className={styles.name}>
              {category.name}
            </Link>

            {/* Only when the API actually supplied a number. It renders as an
                em dash otherwise, which is meaningless and costs card height. */}
            {category.productCount > 0 && (
              <span className={styles.count}>{formatNumber(category.productCount)}商品</span>
            )}

            {category.children?.length > 0 && (
              <ul className={styles.children} role="list">
                {category.children.map((child) => (
                  <li key={child.slug}>
                    <Link href={`/category/${child.slug}`} className={styles.childLink}>
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
