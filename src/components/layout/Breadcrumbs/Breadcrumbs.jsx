import Link from 'next/link';
import styles from './Breadcrumbs.module.css';
import { breadcrumbList } from '@/schema/shared';

/**
 * Breadcrumbs — visible trail, and by default the BreadcrumbList to match.
 *
 * Emitting both from one component means the markup and the structured data
 * cannot drift apart, which is the usual failure mode when they are maintained
 * separately.
 *
 * Pages whose own graph already contains a BreadcrumbList — category,
 * subcategory and product, where the page node references the trail by @id —
 * pass `schema={false}`. Two BreadcrumbLists on one page is not an error a
 * validator reports, but it leaves a crawler to pick between them.
 *
 * @param {Object} props
 * @param {{name: string, href?: string}[]} props.items  Excluding home
 * @param {boolean} [props.schema]  false when the page emits its own trail
 */
export default function Breadcrumbs({ items = [], schema = true }) {
  const crumbs = [{ name: 'ホーム', href: '/' }, ...items];

  return (
    <>
      {/* `items`, not `crumbs` — breadcrumbList prepends ホーム itself. */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              ...breadcrumbList(items),
            }).replace(/</g, '\u003c'),
          }}
        />
      )}

      <nav className={styles.nav} aria-label="パンくずリスト">
        <ol className={styles.list}>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={`${crumb.name}-${i}`} className={styles.item}>
                {i > 0 && (
                  <span className={styles.separator} aria-hidden="true">
                    ›
                  </span>
                )}
                {crumb.href && !isLast ? (
                  <Link href={crumb.href} className={styles.link}>
                    {crumb.name}
                  </Link>
                ) : (
                  <span className={styles.current} aria-current="page">
                    {crumb.name}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
