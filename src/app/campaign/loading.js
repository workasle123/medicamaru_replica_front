import ContentPage from '@/components/content/ContentPage/ContentPage';
import Skeleton, { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';
import SidePanelSkeleton from '@/components/skeleton/SidePanelSkeleton';
import styles from './Campaign.module.css';

/**
 * Campaigns and coupons — loading state.
 *
 * Title, lead and both side columns are the real ones, including `fitTitle` —
 * thirteen characters is the longest heading on the site and without that flag
 * it wraps onto a second line on a phone, which would have made the fallback
 * one line taller than the page it stands in for.
 *
 * Four cards. Eight is the usual count, but a coupon card is tall and the
 * first four fill a screen; the rest would be bytes spent below the fold.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="キャンペーンを読み込んでいます">
      <ContentPage
        title="キャンペーン・クーポン一覧"
        fitTitle
        lead="お薬らくで実施中のキャンペーンです。クーポンコードはご注文手続きの画面でご入力ください。"
        breadcrumbs={[{ name: 'キャンペーン' }]}
        start={{ label: '症状から探す・会員登録', phone: false, content: <SidePanelSkeleton /> }}
        end={{ label: '会員メニュー', phone: false, content: <SidePanelSkeleton /> }}
      >
        <div className={styles.page}>
          <div className={styles.list}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} as="div" height="11rem" radius="var(--radius-lg)" />
            ))}
          </div>
        </div>
      </ContentPage>
    </SkeletonScreen>
  );
}
