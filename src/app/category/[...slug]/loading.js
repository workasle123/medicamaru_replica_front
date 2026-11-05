import { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';
import BreadcrumbsSkeleton from '@/components/skeleton/BreadcrumbsSkeleton';
import ChipRowSkeleton from '@/components/skeleton/ChipRowSkeleton';
import ListingSkeleton from '@/components/skeleton/ListingSkeleton';

/**
 * Category and subcategory listing — loading state.
 *
 * This route is `force-dynamic`: the HTML is built per request because the
 * page reads searchParams for its filters, so every arrival and every change
 * of filter, sort or page waits on a real render. Without a fallback the
 * router simply holds the previous screen with nothing moving on it, which is
 * indistinguishable from a click that missed.
 *
 * Shaped to the real page rather than centred on a spinner: breadcrumbs, the
 * sibling chip row, then the filter rail beside the grid. Nothing moves
 * sideways or vertically when the products land, because every box here is
 * drawn with the page's own CSS module.
 *
 * `loading.js` gets no params, so the category cannot be named yet — the
 * title is one of the boxes. 「絞り込んで探す」 above the chips is not: that is a
 * literal in SubcategoryNav, the same words over every category.
 *
 * The chip row is the one thing here that may not be replaced like for like.
 * SubcategoryNav returns null for a category with no children, so on one of
 * those this reserves about 70px that the page then closes up. Worth it: most
 * categories do have children, and the alternative is that every one of them
 * jumps 70px when the row appears.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="商品を読み込んでいます">
      <div className="container">
        <BreadcrumbsSkeleton depth={1} />
        <ChipRowSkeleton heading="絞り込んで探す" />
        <ListingSkeleton />
      </div>
    </SkeletonScreen>
  );
}
