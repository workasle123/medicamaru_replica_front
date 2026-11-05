import styles from '@/components/layout/Breadcrumbs/Breadcrumbs.module.css';
import Skeleton from '@/components/ui/Skeleton/Skeleton';

/**
 * The breadcrumb trail, before the trail is known.
 *
 * Its only real job is to reserve the row. Breadcrumbs sit directly under the
 * header on nearly every page, so leaving them out of a fallback drags the
 * whole page up by 44px and drops it back down when the content lands — the
 * most visible layout shift the site had available to it.
 *
 * 「ホーム」 is drawn as real text because it is the first crumb on every page
 * on the site and cannot turn out to be anything else.
 *
 * @param {Object} props
 * @param {number} [props.depth=1] Crumbs after ホーム.
 */
export default function BreadcrumbsSkeleton({ depth = 1 }) {
  return (
    <div className={styles.nav}>
      <div className={styles.list}>
        <span className={styles.item}>
          <span className={styles.link}>ホーム</span>
        </span>

        {Array.from({ length: depth }, (_, i) => (
          <span className={styles.item} key={i}>
            <span className={styles.separator} aria-hidden="true">
              ›
            </span>
            <Skeleton height="0.75rem" width={i === depth - 1 ? '7rem' : '4.5rem'} />
          </span>
        ))}
      </div>
    </div>
  );
}
