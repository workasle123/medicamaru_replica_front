import SectionHeader from '@/components/ui/SectionHeader/SectionHeader';
import { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';
import BreadcrumbsSkeleton from '@/components/skeleton/BreadcrumbsSkeleton';
import ProductGridSkeleton from '@/components/skeleton/ProductGridSkeleton';

/**
 * Favourites — loading state.
 *
 * `force-dynamic` and per-customer, so this one is never served from a cache
 * and always waits on the backend.
 *
 * Five cards, not ten: a favourites list is usually short, and a skeleton
 * that promises two full rows to deliver three products is a worse guess than
 * one that promises one.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="お気に入りを読み込んでいます">
      <div className="container">
        <BreadcrumbsSkeleton depth={1} />

        <div className="section">
          <SectionHeader
            title="お気に入り"
            subtitle="気になる商品を保存しておけます。"
            as="h1"
          />
          <ProductGridSkeleton count={5} />
        </div>
      </div>
    </SkeletonScreen>
  );
}
