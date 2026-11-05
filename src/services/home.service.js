/**
 * Medicamaru — homepage service.
 *
 * One call assembles every homepage rail. Deliberately a single request so
 * the homepage never fans out into an API request waterfall (brief §8).
 */

import { adapter } from './adapters';
import { logError, isUnavailable } from '@/lib/api/errors';

const EMPTY_HOME = {
  ranked: [],
  categorySections: [],
  featured: [],
  newArrivals: [],
  onSale: [],
  seasonal: [],
  categories: [],
  symptoms: [],
  blogs: [],
  banners: { notice: [], carousel: [], left: [], right: [], promo: [], homepageLine: [] },
};

export async function getHomeData() {
  try {
    const data = await adapter.getHome();
    return {
      ...EMPTY_HOME,
      ...data,
      // Merge rather than replace, so a backend that omits a placement does
      // not leave a component reading `undefined`.
      banners: { ...EMPTY_HOME.banners, ...(data?.banners ?? {}) },
    };
  } catch (error) {
    logError(error, { service: 'home.getHomeData' });
    // Individual rails already degrade on their own inside the adapter, so
    // reaching this catch means the homepage has no core data at all. That
    // is the blank-page case: the render would "succeed" with every section
    // empty, and `revalidate = 300` would then serve that blank copy to
    // everyone for five minutes. Failing keeps the last good page in place.
    if (isUnavailable(error)) throw error;
    return EMPTY_HOME;
  }
}

/**
 * FAQs for a CMS page. Secondary content, so a failure degrades to no FAQ
 * section rather than failing the page around it.
 *
 * @param {string} [pageSlug]
 * @returns {Promise<import('@/lib/types').Faq[]>}
 */
/**
 * Points credited on registration, as configured in Admin → Settings.
 *
 * `null` means "do not advertise a figure" — the value is unset, zero, or
 * the backend could not be reached. Callers must treat null as "say nothing"
 * rather than substituting a default: a number that does not match what the
 * backend will credit is 景品表示法's 有利誤認, and a stale hardcoded
 * fallback is exactly how that happens.
 */
export async function getRegistrationPoints() {
  try {
    return await adapter.getRegistrationPoints();
  } catch (error) {
    logError(error, { service: 'home.getRegistrationPoints' });
    return null;
  }
}

/**
 * Every popup that is live right now (Admin → Popups).
 *
 * Always an array. A popup is an interruption the site can do without, so a
 * backend failure degrades to "no popups" rather than propagating — the same
 * bargain getRegistrationPoints makes, and for the same reason: this renders
 * in the root layout and must not be able to take the shell down.
 */
export async function listPopups() {
  try {
    return await adapter.listPopups();
  } catch (error) {
    logError(error, { service: 'home.listPopups' });
    return [];
  }
}

export async function listFaqs(pageSlug = 'home') {
  try {
    return await adapter.getFaqs(pageSlug);
  } catch (error) {
    logError(error, { service: 'home.listFaqs', pageSlug });
    return [];
  }
}

/**
 * The /faq page's headings and their FAQs (Admin → FAQ Groups).
 *
 * Unlike listFaqs, these ARE the page, so an outage is rethrown rather than
 * degraded: revalidation then fails and the last good FAQ page stays cached,
 * instead of an empty one replacing it for ten minutes.
 *
 * @returns {Promise<import('@/lib/types').FaqGroup[]>}
 */
export async function listFaqGroups() {
  try {
    return await adapter.getFaqGroups();
  } catch (error) {
    if (isUnavailable(error)) throw error;
    logError(error, { service: 'home.listFaqGroups' });
    return [];
  }
}

export async function listBlogs(options) {
  try {
    return await adapter.getBlogs(options);
  } catch (error) {
    logError(error, { service: 'home.listBlogs' });
    return { items: [], page: 1, perPage: 12, total: 0, totalPages: 1 };
  }
}

export async function getBlog(slug) {
  try {
    return await adapter.getBlog(slug);
  } catch (error) {
    logError(error, { service: 'home.getBlog', slug });
    return null;
  }
}
