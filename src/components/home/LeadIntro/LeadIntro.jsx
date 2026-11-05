import Link from 'next/link';

import styles from './LeadIntro.module.css';
import ProductCard from '@/components/product/ProductCard/ProductCard';

/**
 * LeadIntro — the block that opens the homepage.
 *
 * Replaces the campaign carousel: the page's H1 on the left, a continuously
 * moving rail of best sellers on the right.
 *
 * 40/60 rather than an even split. Half the container is 617px at a 1280px
 * viewport, which fits four cards only by squeezing each to 142px — a third
 * narrower than the 231px they are everywhere else, and not enough for a
 * Japanese product name, brand and price. At 60% the same four sit near 176px.
 *
 * The rail is CSS, not JavaScript: the list is rendered twice and the track is
 * translated exactly -50%, so the second copy is under the cursor at the moment
 * the animation restarts and the loop is seamless. That keeps this a Server
 * Component — no hydration cost on the most important block of the page.
 *
 * @param {Object} props
 * @param {import('@/lib/types').ProductSummary[]} props.products
 * @param {React.ReactNode} [props.banner]  Sits between the headline and the CTA.
 */
export default function LeadIntro({ products, banner }) {
  const items = products.slice(0, 12);

  return (
    <section className={styles.lead}>
      <div className={styles.intro}>
        <h1 className={styles.heading}>
          海外の医薬品・ジェネリック医薬品の通販
        </h1>

        {/* Slot for the LINE banner. Rendered only when one is supplied, so
            the column collapses cleanly rather than reserving empty space. */}
        {banner}

        <Link href="/category" className={styles.cta}>
          カテゴリーから探す
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className={styles.railWrap}>
        <h2 className={styles.railTitle}>売れ筋ランキング</h2>

        {/* Hovering or tabbing into the rail pauses it — a card that slides away
            mid-click is the usual failure of an auto-moving carousel. */}
        <div className={styles.viewport}>
          <ul className={styles.track}>
            {items.map((product, i) => (
              <li key={product.id} className={styles.item}>
                <ProductCard product={product} compact priority={i < 4} />
              </li>
            ))}

            {/* The duplicate exists only to make the loop seamless; announcing
                every product twice would be a screen-reader defect. */}
            {items.map((product) => (
              <li key={`dup-${product.id}`} className={styles.item} aria-hidden="true">
                <ProductCard product={product} compact />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
