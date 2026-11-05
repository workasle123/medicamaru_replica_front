import styles from '@/components/product/ProductGrid/ProductGrid.module.css';
import ProductCardSkeleton from './ProductCardSkeleton';

/**
 * The catalogue grid, before the catalogue.
 *
 * Same CSS module as the real grid — 2 columns on a phone through 5 at
 * 1280px — so the placeholder occupies the exact cells the products will.
 *
 * @param {Object} props
 * @param {number} [props.count=10] Cards to draw. The default is one full
 *   row at every breakpoint from 640px up (3/4/5 all divide into 10 or very
 *   nearly), so no row is left ragged whichever width it renders at.
 */
export default function ProductGridSkeleton({ count = 10 }) {
  return (
    <ul className={styles.grid} role="list">
      {Array.from({ length: count }, (_, i) => (
        <li className={styles.item} key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
