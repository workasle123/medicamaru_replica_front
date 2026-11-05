/**
 * Medicamaru — product service.
 *
 * The only module pages should import for catalogue data. Wraps the active
 * adapter, normalises failures, and never lets a data error crash a page that
 * could still render something useful.
 */

import { adapter } from './adapters';
import { logError, isUnavailable } from '@/lib/api/errors';
import { DEFAULT_PER_PAGE } from '@/constants/site';

/** Empty paginated result — used as the safe fallback for listing failures. */
const EMPTY_PAGE = { items: [], page: 1, perPage: DEFAULT_PER_PAGE, total: 0, totalPages: 1 };

/**
 * The best-selling few, for a side-column ranking. Decoration beside a page's
 * own content, so any failure is an empty list rather than a failed page.
 *
 * @param {number} [limit]
 * @returns {Promise<import('@/lib/types').ProductSummary[]>}
 */
export async function listRankedProducts(limit = 5) {
  try {
    return await adapter.getRankedProducts(limit);
  } catch (error) {
    logError(error, { service: 'products.listRankedProducts' });
    return [];
  }
}

/**
 * @param {import('@/lib/types').ProductQuery} [query]
 * @returns {Promise<import('@/lib/types').Paginated>}
 */
export async function listProducts(query = {}) {
  try {
    return await adapter.getProducts(query);
  } catch (error) {
    logError(error, { service: 'products.listProducts', query });
    // Products are the whole point of a listing page. If the backend is
    // unreachable we do not know whether the results are empty, and
    // "0件" is a claim — one that gets cached, and that tells search
    // engines the category is bare. Fail instead and keep the last good copy.
    if (isUnavailable(error)) throw error;
    return { ...EMPTY_PAGE, perPage: query.perPage ?? DEFAULT_PER_PAGE };
  }
}

/**
 * Returns null when the product genuinely does not exist, so the page can
 * call notFound() and produce a proper 404.
 *
 * A backend that is merely unreachable must NOT come back as null: that
 * turns a temporary outage into a 404, and a 404 tells search engines to
 * deindex the product. Losing rankings on every SKU because the API blipped
 * is not recoverable by fixing the API.
 *
 * @param {string} slug
 * @returns {Promise<import('@/lib/types').Product|null>}
 */
export async function getProduct(slug) {
  try {
    return await adapter.getProduct(slug);
  } catch (error) {
    logError(error, { service: 'products.getProduct', slug });
    if (isUnavailable(error)) throw error;
    return null;
  }
}

/**
 * Moderated reviews for one product.
 *
 * Returns [] on failure rather than rethrowing, unlike getProduct. A product
 * page whose reviews could not be loaded is still a useful page; one that
 * renders an error boundary because of them is not.
 *
 * Takes the numeric product id, not the slug — the endpoint is
 * /product/{id}/reviews and the page already has the id.
 *
 * Returns the rows AND the aggregate, because the product detail endpoint
 * sends no rating of its own — see the adapter.
 *
 * @param {string|number} productId
 * @returns {Promise<{items: import('@/lib/types').ProductReview[], average: number, count: number}>}
 */
export async function getProductReviews(productId) {
  try {
    return await adapter.getProductReviews(productId);
  } catch (error) {
    logError(error, { service: 'products.getProductReviews', productId });
    return { items: [], average: 0, count: 0 };
  }
}

/**
 * @param {string} slug
 * @param {number} [limit]
 * @returns {Promise<import('@/lib/types').ProductSummary[]>}
 */
export async function getRelatedProducts(slug, limit = 6) {
  try {
    return await adapter.getRelatedProducts(slug, limit);
  } catch (error) {
    logError(error, { service: 'products.getRelatedProducts', slug });
    // A missing related-products rail is not worth failing the PDP over.
    return [];
  }
}

/**
 * @param {string} q
 * @param {number} [limit]
 */
export async function getSearchSuggestions(q, limit = 8) {
  try {
    return await adapter.getSearchSuggestions(q, limit);
  } catch (error) {
    logError(error, { service: 'products.getSearchSuggestions', q });
    return [];
  }
}

/** Used by generateStaticParams and sitemap.xml. */
export async function getAllProductSlugs() {
  try {
    return await adapter.getAllProductSlugs();
  } catch (error) {
    logError(error, { service: 'products.getAllProductSlugs' });
    return [];
  }
}
