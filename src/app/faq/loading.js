import ContentPage from '@/components/content/ContentPage/ContentPage';
import Skeleton, { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';
import SidePanelSkeleton from '@/components/skeleton/SidePanelSkeleton';
import styles from './Faq.module.css';

/**
 * FAQ — loading state.
 *
 * The jump tiles over the question groups, in the real grid: as many 160px
 * tiles as the middle column holds, each at least 52px tall.
 *
 * No 最終更新日 line. ContentPage only renders one when it is given an
 * `updatedAt`, and that date comes from the newest question in the data —
 * there is nothing to put there yet, and inventing a row for it would leave a
 * gap the page does not fill.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="よくあるご質問を読み込んでいます">
      <ContentPage
        title="よくあるご質問"
        lead="ご注文、お支払い、配送、個人輸入についてのご質問にお答えします。"
        start={{ label: 'カテゴリー', phone: false, content: <SidePanelSkeleton /> }}
        end={{ label: '会員メニュー', phone: false, content: <SidePanelSkeleton /> }}
      >
        <div className={styles.jump}>
          <div className={styles.jumpList}>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} as="div" height="52px" radius="var(--radius-md)" />
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 'var(--sp-6)' }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i}>
              <Skeleton as="div" height="1.25rem" width="min(16rem, 55%)" />
              <div style={{ display: 'grid', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
                {Array.from({ length: 4 }, (_, q) => (
                  <Skeleton key={q} as="div" height="3rem" radius="var(--radius-md)" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ContentPage>
    </SkeletonScreen>
  );
}
