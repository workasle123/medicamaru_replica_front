import { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';
import BreadcrumbsSkeleton from '@/components/skeleton/BreadcrumbsSkeleton';
import ChipRowSkeleton from '@/components/skeleton/ChipRowSkeleton';
import ListingSkeleton from '@/components/skeleton/ListingSkeleton';

/**
 * Symptom browse — loading state.
 *
 * Same shape as the category listing, which is the point: both render through
 * ListingLayout, so both fall back to the same skeleton and a visitor moving
 * between them sees one consistent loading state rather than two.
 *
 * 「症状で絞り込む」 is drawn as real text. The group route always renders that
 * heading above its chips, and a heading the page can state immediately is
 * worth more than another grey box. A standalone symptom has no chip row, so
 * the row is the one thing here that may not be replaced like-for-like — it
 * costs about 70px at the top of a page that has not arrived yet.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="商品を読み込んでいます">
      <div className="container">
        <BreadcrumbsSkeleton depth={2} />
        <ChipRowSkeleton heading="症状で絞り込む" />
        <ListingSkeleton />
      </div>
    </SkeletonScreen>
  );
}
