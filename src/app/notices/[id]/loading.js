import ContentPage from '@/components/content/ContentPage/ContentPage';
import Skeleton, { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';
import ArticleSkeleton from '@/components/skeleton/ArticleSkeleton';
import SidePanelSkeleton from '@/components/skeleton/SidePanelSkeleton';

/**
 * Notice detail — loading state.
 *
 * The one place a ContentPage title has to be a block: a notice's heading is
 * its own data. `title` is rendered inside the <h1>, so a Skeleton passed as
 * the title gets the heading's size and margins for free.
 *
 * `breadcrumbs` must be given explicitly. ContentPage falls back to
 * `[{ name: title }]` when none are passed, and a React element is not a
 * crumb name — it would land in the BreadcrumbList JSON-LD, which has to be
 * strings. So the trail stops at お知らせ and the leaf is simply absent until
 * the notice can name itself.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="お知らせを読み込んでいます">
      <ContentPage
        title={<Skeleton as="span" height="1.75rem" width="min(28rem, 80%)" />}
        breadcrumbs={[{ name: 'お知らせ', href: '/notices' }]}
        meta={<Skeleton as="span" height="0.875rem" width="7rem" />}
        end={{ label: '会員メニュー', phone: false, content: <SidePanelSkeleton /> }}
      >
        <ArticleSkeleton sections={2} />
      </ContentPage>
    </SkeletonScreen>
  );
}
