import ContentPage from '@/components/content/ContentPage/ContentPage';
import Skeleton, { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';
import SidePanelSkeleton from '@/components/skeleton/SidePanelSkeleton';
import styles from './Notices.module.css';

/**
 * Notice index — loading state.
 *
 * The REAL ContentPage, with its real title, lead and breadcrumbs. All three
 * are literals in page.js, so the heading, the trail and the three-column
 * grid are all settled before the notices arrive — only the list itself is a
 * placeholder, and it lands in the same bordered rows it will occupy.
 *
 * ISR at 600s, so this is a cache-miss fallback rather than something most
 * visitors will see.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="お知らせを読み込んでいます">
      <ContentPage
        title="お知らせ"
        lead="お薬らくからの最新のお知らせです。"
        start={{ label: 'カテゴリー', phone: false, content: <SidePanelSkeleton /> }}
        end={{ label: '会員メニュー', phone: false, content: <SidePanelSkeleton /> }}
      >
        <div className={styles.index}>
          <ul className={styles.list} role="list">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i}>
                <div className={styles.itemLink}>
                  <Skeleton as="div" height="0.875rem" width="7rem" />
                  <Skeleton
                    as="div"
                    height="1rem"
                    width={`${60 + ((i * 9) % 35)}%`}
                    style={{ marginTop: 'var(--sp-2)' }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </ContentPage>
    </SkeletonScreen>
  );
}
