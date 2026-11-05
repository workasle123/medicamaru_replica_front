import styles from './AccountLayout.module.css';
import Skeleton, { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';

/**
 * Account area — loading state, for every page under /my-account.
 *
 * ONE file covers the lot — the dashboard, 注文履歴, ポイント履歴, お届け先,
 * 会員情報 and 紹介プログラム — because `loading.js` wraps the segments below
 * it as well as the page beside it. So the shape here is deliberately the
 * thing all six have in common: a title, a line under it, and a bordered list
 * of label/value rows. Six different fallbacks shaped to six different pages
 * would be six files to keep in step for a wait that is usually under a
 * second.
 *
 * What it does NOT draw is the sidebar, the breadcrumbs or the container. Those
 * belong to `layout.js`, which stays mounted while a child page loads — a
 * layout is not re-rendered when you move between the pages inside it, so this
 * fallback lands directly in the content column with the greeting, the points
 * balance and the nav still live beside it.
 *
 * The first arrival into the account area is the exception: the layout is then
 * loading too, and `loading.js` never covers the layout in its own segment
 * (Next 16 — see node_modules/next/dist/docs/.../loading.md). That wait is the
 * one `getCurrentCustomer` + `getPoints` cost, once, and it is uncovered on
 * purpose: the alternative is a root-level fallback that would also fire on
 * every catalogue filter click.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="読み込んでいます">
      <Skeleton as="div" height="1.75rem" width="14rem" />

      <div style={{ marginTop: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
        <Skeleton as="div" height="0.75rem" width="min(28rem, 85%)" />
      </div>

      <div className={styles.section} style={{ marginTop: 0 }}>
        <div className={styles.sectionHead}>
          <Skeleton as="div" height="1.125rem" width="9rem" />
          <Skeleton as="div" height="0.75rem" width="5rem" />
        </div>

        <div className={styles.definition}>
          {Array.from({ length: 6 }, (_, i) => (
            <div className={styles.defRow} key={i}>
              <div className={styles.defLabel}>
                <Skeleton as="div" height="0.875rem" width="70%" />
              </div>
              <div className={styles.defValue}>
                <Skeleton as="div" height="0.875rem" width={`${45 + ((i * 11) % 40)}%`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonScreen>
  );
}
