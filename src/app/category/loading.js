import SectionHeader from '@/components/ui/SectionHeader/SectionHeader';
import { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';
import BreadcrumbsSkeleton from '@/components/skeleton/BreadcrumbsSkeleton';
import CategoryGridSkeleton from '@/components/skeleton/CategoryGridSkeleton';

/**
 * Category index — loading state.
 *
 * The heading is the REAL SectionHeader with its real words. This page's
 * title and subtitle are literals in page.js, not data, so there is nothing
 * to wait for and no reason to grey them out — the page can say what it is
 * while it fetches what it holds.
 *
 * The real component is safe to use because the skeleton blocks hide
 * themselves rather than being hidden by a wrapper — see SkeletonScreen. So
 * anything genuinely known can be stated, and a screen reader hears the
 * heading and the loading status instead of silence.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="カテゴリーを読み込んでいます">
      <div className="container">
        <BreadcrumbsSkeleton depth={1} />

        <div className="section">
          <SectionHeader
            title="カテゴリーから探す"
            subtitle="目的やお悩みに合わせて、カテゴリーから商品をお探しいただけます。"
            as="h1"
          />
          <CategoryGridSkeleton />
        </div>
      </div>
    </SkeletonScreen>
  );
}
