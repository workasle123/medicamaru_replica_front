import { notFound, permanentRedirect } from 'next/navigation';

import ListingLayout from '@/components/catalog/ListingLayout/ListingLayout';
import SubcategoryNav from '@/components/catalog/SubcategoryNav/SubcategoryNav';
import CategoryContent from '@/components/catalog/CategoryContent/CategoryContent';
import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import { listProducts } from '@/services/products.service';
import { listCategoryTree, getCategory } from '@/services/categories.service';
import { parseProductQuery, isFiltered } from '@/lib/query';
import { getCategorySeo, getSubcategorySeo, hasOwnBrand } from '@/services/seo.service';
import { buildMetadata } from '@/lib/seo';
import { JsonLd, categorySchema, subcategorySchema } from '@/schema';

/**
 * Category listing.
 *
 * Rendered per request, with the DATA cached rather than the page.
 *
 * This page reads `searchParams` for the filters, and a page that reads
 * searchParams cannot be statically prerendered — there is no single correct
 * output to cache. It previously declared `revalidate = 300` alongside
 * `generateStaticParams`, which put it into on-demand static generation: the
 * first request for an uncached category tried to prerender it, hit the
 * searchParams read, and threw DYNAMIC_SERVER_USAGE. Every category page
 * returned a 500 in production. Dev never showed it, because `next dev` does not
 * enforce the static/dynamic boundary the same way.
 *
 * `fetchCache` is the important half. `force-dynamic` on its own is documented
 * as equivalent to `fetchCache = 'force-no-store'`, which would send every
 * catalogue request through to Laravel on every page view — against a backend
 * capped at 500 database connections an hour. 'default-cache' keeps the
 * per-fetch `revalidate` and tags the services already set, so the HTML is built
 * per request while the JSON behind it still comes from the data cache.
 *
 * The trade is real but small: the HTML is no longer cached at the edge, so each
 * view costs a render. The backend load, which is the constrained resource, is
 * unchanged.
 */
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-cache';

/* No generateStaticParams: with `dynamic = 'force-dynamic'` it would be ignored,
   and keeping it would imply this route can be prerendered when it cannot. The
   PRERENDER_CATALOGUE guard stays on /product/[slug], which has no searchParams
   and is genuinely prerenderable. */

/**
 * The taxonomy slug a URL points at, and the path that should own it.
 *
 * A category lives at /category/{slug} and a subcategory at
 * /category/{parent}/{slug}. Anything else — a subcategory reached without its
 * parent, or with the wrong parent — is a stale or hand-typed URL, so the page
 * redirects to the canonical form rather than serving the same content at two
 * addresses and splitting its search ranking.
 *
 * @param {string[]} segments
 */
function readSlug(segments) {
  // More than two levels is not a shape this taxonomy has.
  if (!segments?.length || segments.length > 2) return null;
  return segments[segments.length - 1];
}

/** Where a resolved category/subcategory belongs. */
function canonicalPath(category) {
  return category.parent
    ? `/category/${category.parent.slug}/${category.slug}`
    : `/category/${category.slug}`;
}

/**
 * Note: in Next 16 both `params` and `searchParams` are Promises and must be
 * awaited. Verified against node_modules/next/dist/docs.
 */
export async function generateMetadata({ params, searchParams }) {
  const { slug: segments } = await params;
  const slug = readSlug(segments);
  const sp = await searchParams;
  const category = slug ? await getCategory(slug) : null;

  if (!category) {
    return buildMetadata({
      title: 'カテゴリーが見つかりません',
      path: `/category/${(segments ?? []).join('/')}`,
      noIndex: true,
    });
  }

  const query = parseProductQuery(sp);

  /* Admin-authored meta, keyed by SLUG. This route serves categories AND
     subcategories, so both are tried — resolveTaxonomy already matched one of
     them to get here, and the other simply returns null.

     Previously `category.metaTitle` was read here, but normaliseCategory never
     mapped it and the categories endpoint does not even select the column, so
     it was always undefined and the fallback always won. */
  /* Prefer meta already on the category row — one fewer request. It is only
     there once the backend selects those columns, so the /category-seo and
     /sub-category-seo endpoints remain the fallback (and are the only source
     for subcategories, whose rows do not travel with the category list).

     Unlike products there are only ~60 of these pages, so the extra request
     costs little when it is needed. */
  const seo = category.metaTitle
    ? null
    : (await getCategorySeo(slug)) ?? (await getSubcategorySeo(slug));

  const title = category.metaTitle || seo?.title || `${category.name}の通販`;
  const description =
    category.metaDescription ||
    seo?.description ||
    category.description ||
    `${category.name}の商品一覧です。症状や価格から絞り込んでお探しいただけます。`;

  // Indexing strategy: a clean category page is indexable and self-canonical.
  // Any filter/sort combination is noindex,follow and canonicals to the clean
  // page — otherwise every facet permutation becomes a duplicate-content URL.
  // okusuritsuhan self-canonicalises its facet URLs with no robots directive;
  // that is the mistake we are avoiding here.
  const filtered = isFiltered(query) || query.page > 1;

  return buildMetadata({
    title,
    description,
    keywords: category.metaKeywords || seo?.keywords,
    // Only when the admin title brands itself — see seo.service.
    titleIsComplete: hasOwnBrand(category.metaTitle) || Boolean(seo?.titleIsComplete),
    path: canonicalPath(category),
    noIndex: filtered,
  });
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug: segments } = await params;
  const slug = readSlug(segments);
  const sp = await searchParams;

  if (!slug) notFound();

  const [category, categories] = await Promise.all([
    getCategory(slug),
    listCategoryTree(),
  ]);

  if (!category) notFound();

  /* Send /category/sildenafil to /category/ed/sildenafil, and correct a wrong
     parent while we are here. 308 rather than 302: the flat URLs were live and
     are in the sitemap, so the move needs to be permanent for search engines
     to transfer their ranking rather than keep both.

     Safe in a page — the RSC-navigation problem that made redirect() unusable
     in my-account's LAYOUT does not apply here. */
  const canonical = canonicalPath(category);
  if (`/category/${segments.join('/')}` !== canonical) {
    permanentRedirect(canonical);
  }

  const query = { ...parseProductQuery(sp), category: slug };
  const result = await listProducts(query);

  /* Home › category › subcategory, matching the product page. The category
     index used to sit between home and the category itself; it is not a level
     of the taxonomy, and including it made the trail one step longer than the
     hierarchy it describes. `Breadcrumbs` supplies the home crumb. */
  const crumbs = category.parent
    ? [
        { name: category.parent.name, href: `/category/${category.parent.slug}` },
        { name: category.name },
      ]
    : [{ name: category.name }];

  // Tag facets are derived from what is actually in this result set, so we
  // never offer a filter that would return zero products.

  // Sibling subcategories: a parent shows its own children, a child shows the
  // children of its parent so you can move sideways between siblings.
  const parentCategory = category.parent
    ? categories.find((c) => c.slug === category.parent.slug)
    : category;
  const siblings = parentCategory?.children ?? [];

  /* One route serves both levels of the taxonomy, so it picks the matching
     graph. They differ only in the depth of the trail, but each lives in its
     own file so either can be retuned without disturbing the other.

     The FAQ list is passed through as-is: `category.faqs` is not mapped by the
     normaliser yet, so it is undefined and no FAQPage is emitted — correct,
     since the page renders no questions to back one up. */
  const schema = category.parent
    ? subcategorySchema({ category, path: canonical, faqs: category.faqs })
    : categorySchema({ category, path: canonical, faqs: category.faqs });

  return (
    <div className="container">
      <JsonLd data={schema} />

      {/* `schema={false}`: the BreadcrumbList is part of the graph above, where
          the CollectionPage references it by @id. Letting Breadcrumbs emit its
          own would put two of them on the page. */}
      <Breadcrumbs items={crumbs} schema={false} />

      <SubcategoryNav
        subcategories={siblings}
        activeSlug={slug}
        parent={category.parent}
        /* The siblings hang off the parent when viewing a child, off this
           category itself when viewing a top-level one. */
        parentSlug={category.parent?.slug ?? category.slug}
      />

      <ListingLayout
        title={`${category.name}の通販`}
        description={category.description}
        basePath={canonical}
        query={query}
        result={result}
        categories={categories}
      />

      {/* Editorial content sits BELOW the grid, matching how the source
          platform structures these pages: products first for shoppers,
          long-form copy underneath for search and for readers who want it. */}
      <CategoryContent category={category} />
    </div>
  );
}
