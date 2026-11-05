import styles from '@/components/catalog/SubcategoryNav/SubcategoryNav.module.css';
import Skeleton from '@/components/ui/Skeleton/Skeleton';

/**
 * The sideways-scrolling chip row that sits above a category listing.
 *
 * Reserved rather than omitted: heading plus chips is about 70px, and leaving
 * it out would let the whole grid start higher in the fallback than in the
 * page and jump down as the subcategories arrive.
 *
 * @param {Object} props
 * @param {string} [props.heading] Real text when it is known statically.
 * @param {number} [props.count=6]
 */
export default function ChipRowSkeleton({ heading, count = 6 }) {
  return (
    <div className={styles.nav}>
      {heading ? (
        <p className={styles.heading}>{heading}</p>
      ) : (
        <Skeleton as="div" height="0.875rem" width="9rem" />
      )}

      <div className={styles.list}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} style={{ flex: '0 0 auto' }}>
            <Skeleton
              height="40px"
              width={`${5 + ((i * 3) % 7)}rem`}
              radius="var(--radius-pill)"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
