import ProductCard from '@/components/product/ProductCard/ProductCard';
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader';
import ScrollRail from '@/components/ui/ScrollRail/ScrollRail';
import SubcategoryTags from '@/components/home/SubcategoryTags/SubcategoryTags';

/**
 * ProductRail — a titled row of products.
 *
 * Ten products in a single row, five visible at a time, paged by the rail's
 * arrows. Previously this wrapped onto a second line at desktop; keeping it
 * to one line means each category occupies a predictable amount of the
 * homepage no matter how many products it has.
 *
 * Renders nothing at all when empty. A section heading above a blank space
 * looks broken; omitting it entirely is the correct empty state for an
 * optional homepage rail.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {string} [props.href]
 * @param {import('@/lib/types').ProductSummary[]} props.products
 * @param {import('@/lib/types').Category[]} [props.subcategories] Shown as tags under the heading
 * @param {string} [props.parentSlug] The category the subcategory tags belong
 *   to — their URLs nest under it.
 * @param {number} [props.limit]
 * @param {boolean} [props.priority] Above-the-fold rail
 * @param {boolean} [props.packImages] Cards show the pack photo (second image)
 */
export default function ProductRail({
  title,
  subtitle,
  href,
  products = [],
  subcategories = [],
  parentSlug,
  limit = 10,
  priority = false,
  packImages = false,
}) {
  if (!products.length) return null;

  const items = products.slice(0, limit);

  return (
    <section>
      <SectionHeader title={title} subtitle={subtitle} href={href} />

      <SubcategoryTags subcategories={subcategories} parentSlug={parentSlug} categoryName={title} />

      {/* 5 → 6 → 7 across as the viewport widens, which holds a card near
          220px instead of letting it balloon to 320px on a wide display. */}
      <ScrollRail perView={5} perViewWide={6} perViewTablet={3} perViewMobile={2} label={title}>
        {items.map((product, i) => (
          <li key={product.id}>
            {/* Only the first row can be above the fold, so only it is worth
                preloading — priority on all ten would compete with the LCP. */}
            <ProductCard product={product} priority={priority && i < 5} preferPack={packImages} />
          </li>
        ))}
      </ScrollRail>
    </section>
  );
}
