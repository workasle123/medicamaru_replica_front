import styles from './Checkout.module.css';
import Skeleton, { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';
import BreadcrumbsSkeleton from '@/components/skeleton/BreadcrumbsSkeleton';

/**
 * Checkout — loading state.
 *
 * The form panels on the left, the order summary on the right: the page's own
 * `.layout`, which is one column until 1024px and then 1fr + 340px.
 *
 * Deliberately NOT drawn as a working form. Someone would start typing an
 * address into fields that are about to be replaced by their twins, and the
 * swap would throw it away — this is the one page on the site where losing
 * what was typed costs an order. Flat panels say "nearly there" without
 * inviting that.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="ご注文手続きの画面を読み込んでいます">
      <div className="container">
        <BreadcrumbsSkeleton depth={2} />

        <h1 className={styles.title}>ご注文手続き</h1>

        <div className={styles.layout}>
          <div>
            {/* お届け先, お支払い方法, ご確認事項 — three panels, which is what
                the form renders whether or not the customer is signed in. */}
            {[5, 3, 2].map((rows, i) => (
              <div className={styles.section} key={i}>
                <div className={styles.sectionTitle}>
                  <Skeleton as="div" height="1.125rem" width="10rem" />
                </div>
                <div className={styles.fields}>
                  {Array.from({ length: rows }, (_, r) => (
                    <Skeleton
                      key={r}
                      as="div"
                      height="var(--control-h-md)"
                      radius="var(--radius-md)"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <p className={styles.summaryTitle}>ご注文内容</p>

            <div className={styles.miniLines}>
              {Array.from({ length: 2 }, (_, i) => (
                <div className={styles.miniLine} key={i}>
                  <Skeleton height="0.75rem" width="70%" />
                </div>
              ))}
            </div>

            {Array.from({ length: 4 }, (_, i) => (
              <div className={styles.row} key={i}>
                <Skeleton height="0.75rem" width="5rem" />
                <Skeleton height="0.75rem" width="4rem" />
              </div>
            ))}

            <div className={styles.totalRow}>
              <Skeleton height="1rem" width="4rem" />
              <Skeleton height="1.25rem" width="6rem" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonScreen>
  );
}
