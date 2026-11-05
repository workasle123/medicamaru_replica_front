import styles from './Cart.module.css';
import Skeleton, { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';
import BreadcrumbsSkeleton from '@/components/skeleton/BreadcrumbsSkeleton';

/**
 * Cart — loading state.
 *
 * `force-dynamic`, and four backend calls deep: the cart itself, the live
 * campaigns, the signed-in customer and the coupons they have already spent.
 * Nothing here can be cached, so this is one of the few pages that waits on
 * every single view.
 *
 * 「ショッピングカート」 is drawn as real text. The heading is a literal in
 * page.js — it does not depend on what is in the cart — so the page can name
 * itself while it counts.
 *
 * Three line rows. The grid is the cart's own `.line` — 48px thumbnail,
 * flexible name, price hard right, widening to 96px at 640px — so a row is
 * the height it will be whatever ends up in it.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="カートを読み込んでいます">
      <div className="container">
        <BreadcrumbsSkeleton depth={1} />

        <h1 className={styles.title}>ショッピングカート</h1>

        <div className={styles.layout}>
          <div>
            <ul className={styles.lines} role="list">
              {Array.from({ length: 3 }, (_, i) => (
                <li className={styles.line} key={i}>
                  <Skeleton as="div" className={styles.thumb} />

                  <div className={styles.lineInfo}>
                    <Skeleton as="div" height="0.875rem" />
                    <Skeleton
                      as="div"
                      height="0.875rem"
                      width="60%"
                      style={{ marginTop: 'var(--sp-2)' }}
                    />
                    <Skeleton
                      as="div"
                      height="0.75rem"
                      width="40%"
                      style={{ marginTop: 'var(--sp-3)' }}
                    />
                    <Skeleton
                      as="div"
                      height="var(--control-h-md)"
                      width="11rem"
                      radius="var(--radius-md)"
                      style={{ marginTop: 'var(--sp-3)' }}
                    />
                  </div>

                  <Skeleton height="1.125rem" width="5.5rem" />
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.summary}>
            <p className={styles.summaryTitle}>お支払い金額</p>

            {Array.from({ length: 4 }, (_, i) => (
              <div className={styles.row} key={i}>
                <Skeleton height="0.75rem" width="5rem" />
                <Skeleton height="0.75rem" width="4rem" />
              </div>
            ))}

            <Skeleton
              as="div"
              height="var(--control-h-lg)"
              radius="var(--radius-md)"
              style={{ marginTop: 'var(--sp-5)' }}
            />
          </div>
        </div>
      </div>
    </SkeletonScreen>
  );
}
