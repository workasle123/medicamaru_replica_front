/**
 * Medicamaru — category & symptom service.
 *
 * Two different failure policies here, and the difference is deliberate:
 * whether the caller is decoration or the page itself.
 */

import { adapter } from './adapters';
import { logError, isUnavailable } from '@/lib/api/errors';

/**
 * Every active category — the list for ANY navigation surface.
 *
 * There used to be a `listCategories` beside this that returned only the
 * categories ticked "Show On Home Page" in the admin, and the header and
 * footer used it. That tick is an editorial choice about which rails to
 * feature on the homepage; it is not a statement about what the shop sells.
 * Borrowing it for navigation hid three active categories — ヘアケア,
 * 生活習慣病, 皮膚疾患, 270 products between them — from 「カテゴリーから探す」,
 * the site's main way in.
 *
 * The flagged subset now has exactly one reader, `getHome`, which asks the
 * adapter for it directly. Nothing at this layer wants it.
 *
 * Swallows every failure: this feeds the header on EVERY route, so throwing
 * would take the whole site down over a nav widget. A header without its
 * category menu is degraded but usable — search, cart and direct links work.
 *
 * @returns {Promise<import('@/lib/types').Category[]>}
 */
export async function listAllCategories() {
  try {
    return await adapter.getCategories(true);
  } catch (error) {
    logError(error, { service: 'categories.listAllCategories' });
    return [];
  }
}

/**
 * The same categories with their subcategories attached.
 *
 * Subcategories are one request per category, which is why the adapter's own
 * note says callers should fetch children only for the category being viewed.
 * Three things make it affordable here: there are 11 active categories, not the
 * 39 that note assumes (39 is the DISABLED set — the same off-by-an-enum the
 * admin had); they carry TTL.categories, an hour; and getAllCategorySlugs
 * already fetches the exact same URLs for the sitemap, so Next's fetch cache
 * serves most of them without a round trip rather than doubling the load.
 *
 * Failure is per category, not for the batch: one category whose children do
 * not load gets an empty list and still renders its own link, instead of
 * taking the whole menu down. Same policy as listAllCategories — this is
 * navigation, and degraded navigation beats none.
 *
 * @param {import('@/lib/types').Category[]} [categories]  Fetched when omitted
 * @returns {Promise<import('@/lib/types').Category[]>}
 */
export async function listCategoryTree(categories) {
  const list = Array.isArray(categories) ? categories : await listAllCategories();

  if (list.length === 0) return [];

  try {
    const children = await Promise.all(
      list.map((category) =>
        adapter.getSubcategories(category.id).catch((error) => {
          logError(error, {
            service: 'categories.listCategoryTree',
            category: category.slug,
          });
          return [];
        })
      )
    );

    return list.map((category, i) => ({ ...category, children: children[i] }));
  } catch (error) {
    logError(error, { service: 'categories.listCategoryTree' });
    return list.map((category) => ({ ...category, children: [] }));
  }
}

/**
 * One category, for the category page itself.
 *
 * Unlike listAllCategories, null here means "no such category" and the page
 * turns it into a 404 — so an unreachable backend must throw rather than
 * return null. See getProduct for why a 404 is the expensive mistake.
 *
 * @param {string} slug
 * @returns {Promise<import('@/lib/types').Category|null>}
 */
export async function getCategory(slug) {
  try {
    return await adapter.getCategory(slug);
  } catch (error) {
    logError(error, { service: 'categories.getCategory', slug });
    if (isUnavailable(error)) throw error;
    return null;
  }
}

/** The second browse axis — symptom-led discovery. */
export async function listSymptoms() {
  try {
    return await adapter.getSymptoms();
  } catch (error) {
    logError(error, { service: 'categories.listSymptoms' });
    return [];
  }
}

/**
 * The browse groups shown on /symptom.
 *
 * [] on failure rather than a throw, and the page treats [] as "no groups
 * configured" and shows the flat symptom list. That makes a backend blip
 * degrade to the old page instead of an error — the same trade the symptom
 * list itself makes.
 */
export async function listSymptomGroups() {
  try {
    return await adapter.getSymptomGroups();
  } catch (error) {
    logError(error, { service: 'categories.listSymptomGroups' });
    return [];
  }
}

/**
 * One group, its symptoms and its products.
 *
 * null means the slug is not a group, which is what lets the route fall
 * through to trying it as a symptom before giving up with a 404.
 *
 * @param {string} slug
 * @param {object} [query]
 */
export async function getSymptomGroup(slug, query = {}) {
  try {
    return await adapter.getSymptomGroupProducts(slug, query);
  } catch (error) {
    logError(error, { service: 'categories.getSymptomGroup', slug });
    return null;
  }
}

export async function getAllCategorySlugs() {
  try {
    return await adapter.getAllCategorySlugs();
  } catch (error) {
    logError(error, { service: 'categories.getAllCategorySlugs' });
    return [];
  }
}

/**
 * Most-used product tags, for the footer tag cloud.
 *
 * Falls back to an empty list: a footer that renders without its tags is fine,
 * a footer that throws is not.
 */
export async function listTopTags(limit = 25) {
  try {
    return await adapter.getTopTags(limit);
  } catch (error) {
    logError(error, { service: 'categories.listTopTags' });
    return [];
  }
}
