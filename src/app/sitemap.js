import { getAllProductSlugs } from '@/services/products.service';
import { getAllCategorySlugs, listSymptoms, listSymptomGroups } from '@/services/categories.service';
import { listNotices } from '@/services/notices.service';
import { absoluteUrl } from '@/lib/seo';
import { GUIDE_PATH } from '@/content/guide/medicine-guide';

/**
 * sitemap.xml
 *
 * Only indexable URLs appear here. Anything emitting `noindex` — search,
 * cart, checkout, account, wishlist, and every filtered facet URL — is
 * deliberately excluded. A sitemap that lists noindex pages sends search
 * engines contradictory signals.
 *
 * The source platform splits its sitemap into five child files because it has
 * 3,043 products. Medicamaru starts at ~500, well inside the 50,000-URL
 * limit, so a single sitemap is correct for now. Split with
 * `generateSitemaps` if the catalogue grows past a few thousand.
 */
export const revalidate = 3600;

export default async function sitemap() {
  const [products, categorySlugs, symptoms, symptomGroups, notices] = await Promise.all([
    getAllProductSlugs(),
    getAllCategorySlugs(),
    listSymptoms(),
    listSymptomGroups(),
    listNotices(100),
  ]);

  /* Which group each symptom belongs under, so the file lists the canonical
     nested URL. Listing the flat /symptom/{slug} form instead would submit a
     redirect on every row. */
  const groupSlugById = new Map(symptomGroups.map((g) => [g.id, g.slug]));

  /** Static pages, highest priority first. */
  const staticPages = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' },
    { path: '/category', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/symptom', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/notices', priority: 0.4, changeFrequency: 'weekly' },
    { path: '/about-personal-import', priority: 0.6, changeFrequency: 'monthly' },
    /* The お薬ガイド. Percent-encoded at its source — absoluteUrl only
       concatenates, and raw UTF-8 in an XML sitemap is asking for trouble. */
    { path: GUIDE_PATH, priority: 0.6, changeFrequency: 'monthly' },
    { path: '/pharmaceutical-law', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/about', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/editorial-policy', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ];

  const now = new Date();

  const entries = staticPages.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  /* Categories and subcategories.
     This iterated `category.children`, but listAllCategories does not populate
     children — only getCategory does, per category — so the inner loop never
     ran and no subcategory ever reached the sitemap. getAllCategorySlugs
     returns both levels, and both resolve to real listing pages. */
  for (const { slug, parentSlug } of categorySlugs) {
    entries.push({
      /* Nested for a subcategory, so the sitemap lists the canonical URL. The
         flat form 308s to this one, and submitting a redirecting URL wastes
         crawl budget and muddies which address should rank. */
      url: absoluteUrl(parentSlug ? `/category/${parentSlug}/${slug}` : `/category/${slug}`),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  /* The browse groups. These are the symptom pages actually worth ranking:
     a curated name in customer language with real product counts behind it,
     rather than an imported indication string. Priority above the individual
     symptoms for the same reason. */
  for (const group of symptomGroups) {
    entries.push({
      url: absoluteUrl(`/symptom/${group.slug}`),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  /* A GROUPED symptom has no URL of its own any more — it is a tab on its
     group's page (/symptom/{group}?symptom={slug}), and a query-string facet
     does not belong in a sitemap.

     Only the handful with no group still have a page, and only while they are
     not thin: the route serves those noindex below MIN_INDEXABLE_PRODUCTS, and
     submitting a noindex URL asks a crawler to fetch something it has been
     told to ignore. */
  for (const symptom of symptoms) {
    if (groupSlugById.has(symptom.groupId)) continue;
    if ((symptom.productCount ?? 0) < 3) continue;

    entries.push({
      url: absoluteUrl(`/symptom/${symptom.slug}`),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  // Products carry their real last-updated date, which is the most useful
  // lastmod signal in the whole file.
  for (const product of products) {
    entries.push({
      url: absoluteUrl(`/product/${product.slug}`),
      lastModified: toDate(product.updatedAt, now),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  // Notices, dated by the Notice Date the admin sets.
  for (const notice of notices) {
    entries.push({
      url: absoluteUrl(`/notices/${notice.id}`),
      lastModified: toDate(notice.date, now),
      changeFrequency: 'monthly',
      priority: 0.3,
    });
  }

  /* No blog posts. The storefront has no /blogs pages yet, so every entry here
     was a URL that 404s. The loop also read `slug`, `updatedAt` and
     `publishedAt`, none of which the articles API has (it sends
     `createDateTime` / `updateDateTime` and no slug) — harmless while there
     were no articles, and a build-breaking `new Date(undefined)` the day the
     first one was published. Add posts back alongside the pages that serve
     them. */

  return entries;
}

/* A Date from an API value, or `fallback` when the value is missing or does not
   parse. The sitemap is built at deploy time, so one malformed date anywhere in
   the catalogue would otherwise fail the whole deploy rather than one <lastmod>. */
function toDate(value, fallback) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : fallback;
}
