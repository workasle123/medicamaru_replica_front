import { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';
import BreadcrumbsSkeleton from '@/components/skeleton/BreadcrumbsSkeleton';
import ListingSkeleton from '@/components/skeleton/ListingSkeleton';

/**
 * Search results — loading state.
 *
 * The most valuable fallback on the site: search is `force-dynamic`, it is
 * reached from the header on every page, and the visitor has just typed
 * something and is waiting to find out whether it matched anything.
 *
 * No description row — the search listing passes none, so reserving space for
 * one would leave a gap the results never fill. The title is a box rather
 * than real text because the query is in searchParams, which `loading.js`
 * cannot read.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="検索結果を読み込んでいます">
      <div className="container">
        <BreadcrumbsSkeleton depth={1} />
        <ListingSkeleton description={false} />
      </div>
    </SkeletonScreen>
  );
}
