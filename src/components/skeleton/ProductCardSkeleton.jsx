import styles from '@/components/product/ProductCard/ProductCard.module.css';
import Skeleton from '@/components/ui/Skeleton/Skeleton';

/**
 * A product card, before the product.
 *
 * It imports ProductCard's OWN CSS module rather than restating the card in a
 * second stylesheet. That is deliberate: the card is a bordered box with a
 * square packshot above a centred body, and every one of those measurements
 * has already been argued out once. A copy would be a second set of numbers
 * to keep in step, and the first time they drifted the grid would reflow as
 * the real cards arrived — which is the one thing a skeleton exists to stop.
 *
 * `.media` holds the square via `.imageMissing`, which is the class the card
 * already uses for a product with no photo, so the aspect ratio is the same
 * box the image will land in.
 */
export default function ProductCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.media}>
        {/* aspect-ratio: 1 comes from the card's own missing-image class, so
            the row height is settled before any photo loads. */}
        <Skeleton as="div" className={styles.imageMissing} />
      </div>

      <div className={styles.body}>
        <Skeleton height="0.625rem" width="45%" />

        {/* Two lines: the median product name wraps onto a second one, and a
            card sized for one would grow when the names arrive. */}
        <Skeleton as="div" height="0.875rem" width="92%" />
        <Skeleton as="div" height="0.875rem" width="70%" />

        <div className={styles.priceGroup}>
          <Skeleton height="1.125rem" width="7.5rem" />
          <Skeleton height="0.625rem" width="5rem" />
        </div>
      </div>
    </div>
  );
}
