import 'server-only';

import { apiFetch } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logError } from '@/lib/api/errors';

/**
 * Medicamaru — admin-authored SEO metadata.
 *
 * Titles, descriptions and keywords are written per product, per category and
 * per subcategory in the admin panel. Nothing used to read them: the endpoints
 * were declared in `endpoints.js` and never called, so every page fell back to
 * a frontend-generated title and 3,102 product metas went unused.
 *
 * These endpoints answer with a BARE `{status, data:{…}}` body rather than the
 * `{message, code, results}` envelope the rest of the API uses, so the shared
 * `unwrap` helper does not apply here.
 *
 * Every lookup degrades to null rather than throwing. Metadata is decoration:
 * a page must never fail to render because its title lookup did, and the
 * caller already has a generated fallback for exactly that case.
 *
 * Cached for a long TTL. Meta copy changes when someone edits it in the admin
 * panel — rarely — and this is one extra request per page on top of the page's
 * own data, so it is not something to re-fetch eagerly.
 */

/* One hour, matching the adapter's `categories` tier: meta copy changes only
   when an editor edits it. */
const SEO_TTL = 60 * 60;

/**
 * Brand markers that mean a title is already complete.
 *
 * The root layout appends 「｜お薬らく」 to every title, so a meta_title that
 * already ends in a brand would double it. But only 18 of the 3,176 admin
 * titles carry one — the ED category's 「…通販｜お薬らく」 does, while most
 * read 「シルデナフィル」 or 「ビューティ グレース EX | …サプリ 通販」 and do not.
 * Blanket-treating them as complete would strip the site name from ~3,158
 * pages, so the suffix is added unless the title already brands itself.
 *
 * The other platform's names are included deliberately: a title ending
 * 「| お薬ショップ」 is still self-branded, and appending our name to it would
 * read 「…| お薬ショップ｜お薬らく」, which is worse than either alone.
 */
const BRAND_MARKERS = /メディカ|お薬らく|Medicamaru|お薬ショップ|メディスン|オクスリ/i;

/**
 * Does this admin title already brand itself?
 *
 * Exported because product meta arrives on the product row rather than through
 * this service, and that page needs the same test.
 *
 * @param {string} [title]
 */
export function hasOwnBrand(title) {
  return Boolean(title && BRAND_MARKERS.test(title));
}

/** Empty strings are what the API returns for "not set" — treat them as absent. */
function clean(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text === '' ? undefined : text;
}

function shape(raw) {
  const data = raw?.data ?? raw?.results?.data ?? raw;
  if (!data) return null;

  const title = clean(data.meta_title);
  const description = clean(data.meta_description);
  // Singular on subcategories, plural everywhere else.
  const keywords = clean(data.meta_keywords ?? data.meta_keyword);

  // Nothing usable — let the caller keep its generated copy.
  if (!title && !description && !keywords) return null;

  return {
    title,
    description,
    keywords,
    /* True when the title brands itself and must bypass the layout's title
       template. Callers pass this straight to buildMetadata's titleIsComplete. */
    titleIsComplete: hasOwnBrand(title),
  };
}

async function fetchSeo(path, context) {
  try {
    return shape(await apiFetch(path, { revalidate: SEO_TTL, tags: ['seo'] }));
  } catch (error) {
    logError(error, { service: 'seo', ...context });
    return null;
  }
}

/**
 * @param {string} slug  the category SLUG — the endpoint returns empty strings
 *   when given a numeric id.
 */
export function getCategorySeo(slug) {
  if (!slug) return Promise.resolve(null);
  return fetchSeo(endpoints.categorySeo(slug), { kind: 'category', slug });
}

/** @param {string} slug */
export function getSubcategorySeo(slug) {
  if (!slug) return Promise.resolve(null);
  return fetchSeo(endpoints.subcategorySeo(slug), { kind: 'subcategory', slug });
}

/** @param {string|number} productId */
export function getProductSeo(productId) {
  if (!productId) return Promise.resolve(null);
  return fetchSeo(endpoints.productSeo(productId), { kind: 'product', productId });
}
