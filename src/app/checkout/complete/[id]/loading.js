import styles from '../../Checkout.module.css';
import Skeleton, { SkeletonScreen, SkeletonText } from '@/components/ui/Skeleton/Skeleton';

/**
 * Order confirmation — loading state.
 *
 * Reached by a redirect straight after the order is placed, and
 * `force-dynamic` because it reads the order back per request. This is the
 * page where a blank wait is most alarming: the customer has just submitted a
 * payment screen and does not yet know whether it worked.
 *
 * So the heading is REAL. By the time this route renders the order exists —
 * placeOrder has already returned and cleared the cart — and the only thing
 * still arriving is its detail. Saying 「ご注文ありがとうございます」 now is
 * accurate, and it is the one sentence someone is waiting for.
 *
 * The tick above it is a plain circle rather than the page's own
 * `.completeIcon`. That class carries the arrival animation and its ring, and
 * reusing it here would play the celebration once for the placeholder and
 * again for the page it is replaced by.
 *
 * No breadcrumbs — the real page has none.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="ご注文内容を読み込んでいます">
      <div className="container">
        <div className={styles.complete}>
          <Skeleton
            as="div"
            circle
            width="64px"
            style={{ marginInline: 'auto', marginBottom: 'var(--sp-5)' }}
          />

          <h1>ご注文ありがとうございます</h1>

          <Skeleton
            as="div"
            height="1.75rem"
            width="12rem"
            radius="var(--radius-md)"
            style={{ marginInline: 'auto', marginTop: 'var(--sp-4)' }}
          />

          <div className={styles.completeBody}>
            <SkeletonText lines={3} />
          </div>

          <div className={styles.completeSummary}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <Skeleton as="div" height="1.125rem" width="8rem" />
              </div>

              <div className={styles.miniLines}>
                {Array.from({ length: 2 }, (_, i) => (
                  <div className={styles.miniLine} key={i}>
                    <Skeleton height="0.75rem" width="60%" />
                    <Skeleton height="0.75rem" width="4rem" />
                  </div>
                ))}
              </div>

              {Array.from({ length: 3 }, (_, i) => (
                <div className={styles.row} key={i}>
                  <Skeleton height="0.75rem" width="5rem" />
                  <Skeleton height="0.75rem" width="4rem" />
                </div>
              ))}

              <div className={styles.totalRow}>
                <Skeleton height="1rem" width="3rem" />
                <Skeleton height="1.25rem" width="6rem" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonScreen>
  );
}
