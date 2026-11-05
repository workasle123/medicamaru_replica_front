import styles from '@/components/home/CategoryGrid/CategoryGrid.module.css';
import Skeleton from '@/components/ui/Skeleton/Skeleton';

/**
 * The category tiles, before the categories.
 *
 * Six across at 1024px, three at 640px, two below — the real grid's own rule,
 * reused. The icon frame keeps its 56/64px box so a row is the height it will
 * be rather than the height of two lines of text.
 *
 * @param {Object} props
 * @param {number} [props.count=12] Tiles. Twelve is two full wide rows and
 *   divides cleanly into every column count this grid uses.
 */
export default function CategoryGridSkeleton({ count = 12 }) {
  return (
    <ul className={styles.grid} role="list">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className={styles.card}>
            <Skeleton as="div" className={styles.iconFrame} radius="var(--radius-lg)" />
            <Skeleton height="0.875rem" width="78%" />
            <Skeleton height="0.625rem" width="40%" />
          </div>
        </li>
      ))}
    </ul>
  );
}
