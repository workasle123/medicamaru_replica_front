import Image from 'next/image';
import Link from 'next/link';

import SideBox from '../SideBox/SideBox';
import { IconCategories } from '../icons';
import { listCategoryTree } from '@/services/categories.service';
import styles from './CategoryMenu.module.css';

/**
 * CategoryMenu — every active category as a side-column list, each revealing
 * its subcategories on hover.
 *
 * Takes the full list (listAllCategories), not the homepage's curated eight:
 * this is a way into the whole catalogue, and the three unflagged categories
 * hold 270 products between them.
 *
 * The flyout is a mega-menu, which on a Japanese EC sidebar is the expected
 * shape rather than clutter — depth and organisation are what a Mode A
 * shopper reads as complete. It fetches its own children rather than taking
 * them as a prop so that none of the four pages rendering this column have to
 * change; see listCategoryTree for why 39 requests are affordable.
 *
 * NO JavaScript. Hover and :focus-within do the whole thing in CSS, so it
 * works before hydration and the links are crawlable. That matters for a
 * menu: these are 100+ internal links into the catalogue.
 *
 * Touch is not a gap here — this column is desktop-only (`phone: false` in
 * SideColumns), and the header carries the category menu on phones. On a
 * touch screen wide enough to see it, tapping the row still goes to the
 * category page, which lists the same subcategories.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Category[]} props.categories
 */
export default async function CategoryMenu({ categories }) {
  if (categories.length === 0) return null;

  const tree = await listCategoryTree(categories);

  return (
    <SideBox
      id="side-categories"
      title="カテゴリー"
      icon={<IconCategories />}
      flush
      /* The flyout has to escape the box, which otherwise clips to its
         rounded corners. */
      allowOverflow
    >
      <ul className={styles.list}>
        {tree.map((category) => {
          const children = category.children ?? [];

          return (
            <li key={category.slug} className={styles.item}>
              <Link href={`/category/${category.slug}`} className={styles.link}>
                {/* Empty alt: the name beside it says the same thing. Fixed
                    width with no `sizes`, so next/image emits just 1x and 2x. */}
                {category.iconUrl ? (
                  <Image
                    src={category.iconUrl}
                    alt=""
                    width={28}
                    height={28}
                    className={styles.icon}
                  />
                ) : (
                  <span className={styles.iconFallback} aria-hidden="true">
                    {Array.from(category.name)[0] ?? ''}
                  </span>
                )}
                <span className={styles.name}>{category.name}</span>
                <span className={styles.chevron} aria-hidden="true">›</span>
              </Link>

              {children.length > 0 && (
                <div className={styles.flyout}>
                  {/* The parent repeated at the top, as its own link. A
                      subcategory list with no way back to "all of this
                      category" is a dead end, and the row behind the flyout
                      is covered while the flyout is open. */}
                  <Link href={`/category/${category.slug}`} className={styles.flyoutTitle}>
                    {category.name}
                    <span className={styles.flyoutAll}>すべて見る</span>
                  </Link>

                  <ul className={styles.sublist}>
                    {children.map((sub) => (
                      <li key={sub.slug}>
                        {/* Nested, not /category/{sub}. The flat form 308s to
                            this one — see the note in sitemap.js. */}
                        <Link
                          href={`/category/${category.slug}/${sub.slug}`}
                          className={styles.sublink}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Link href="/category" className={styles.all}>
        すべてのカテゴリーを見る
      </Link>
    </SideBox>
  );
}
