/**
 * Medicamaru — catalogue query parsing and URL building.
 *
 * One module owns the translation between URL search params and the internal
 * ProductQuery shape, so every listing surface (category, search, symptom,
 * offers) behaves identically and filters compose predictably.
 *
 * Parameter names are readable and shareable by design — deliberately not the
 * reference sites' cryptic `AMI`/`ASI`/`DON` scheme, which cannot be
 * understood, edited or linked by a human.
 */

import { SORT_OPTIONS, PER_PAGE_OPTIONS, DEFAULT_PER_PAGE } from '@/constants/site';

const VALID_SORTS = SORT_OPTIONS.map((o) => o.key);

/**
 * Parse Next.js searchParams into a validated ProductQuery.
 * Invalid values fall back to defaults rather than throwing — a hand-edited
 * URL should never produce an error page.
 *
 * @param {Record<string, string|string[]|undefined>} searchParams
 * @returns {import('@/lib/types').ProductQuery}
 */
export function parseProductQuery(searchParams = {}) {
  const get = (key) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const getAll = (key) => {
    const v = searchParams[key];
    if (v === undefined) return undefined;
    return Array.isArray(v) ? v : [v];
  };

  const toInt = (value, fallback) => {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const sort = get('sort');
  const perPage = toInt(get('per_page'), DEFAULT_PER_PAGE);

  return {
    q: get('q')?.trim() || undefined,
    category: get('category') || undefined,
    symptom: get('symptom') || undefined,
    tags: getAll('tag'),
    inStock: get('in_stock') === '1',
    minPrice: get('min_price') ? toInt(get('min_price'), undefined) : undefined,
    maxPrice: get('max_price') ? toInt(get('max_price'), undefined) : undefined,
    sort: VALID_SORTS.includes(sort) ? sort : 'recommended',
    page: toInt(get('page'), 1),
    perPage: PER_PAGE_OPTIONS.includes(perPage) ? perPage : DEFAULT_PER_PAGE,
  };
}

/**
 * Build a URL for a listing page, merging patch values over the current
 * query. Any change other than paging resets to page 1 — landing on page 4 of
 * a freshly filtered result set is a classic and disorienting bug.
 *
 * @param {string} basePath
 * @param {import('@/lib/types').ProductQuery} current
 * @param {Partial<import('@/lib/types').ProductQuery>} patch
 * @returns {string}
 */
export function buildListingUrl(basePath, current, patch = {}) {
  const next = { ...current, ...patch };
  if (!('page' in patch)) next.page = 1;

  const sp = new URLSearchParams();

  if (next.q) sp.set('q', next.q);
  // category and symptom live in the path on their own pages, so they are
  // only emitted as params when the caller explicitly keeps them.
  if (next.category && patch.keepCategoryParam) sp.set('category', next.category);
  if (next.symptom && patch.keepSymptomParam) sp.set('symptom', next.symptom);
  next.tags?.forEach((t) => sp.append('tag', t));
  if (next.inStock) sp.set('in_stock', '1');
  if (next.minPrice) sp.set('min_price', String(next.minPrice));
  if (next.maxPrice) sp.set('max_price', String(next.maxPrice));
  if (next.sort && next.sort !== 'recommended') sp.set('sort', next.sort);
  if (next.perPage && next.perPage !== DEFAULT_PER_PAGE) sp.set('per_page', String(next.perPage));
  if (next.page && next.page > 1) sp.set('page', String(next.page));

  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Does this query narrow the result set beyond a plain listing?
 *
 * Drives the indexing decision: a clean category page is indexable, but an
 * arbitrary filter combination is not. okusuritsuhan self-canonicalises every
 * facet URL with no robots directive, which is an open duplicate-content
 * surface — we avoid that (see Phase 11).
 *
 * @param {import('@/lib/types').ProductQuery} query
 */
export function isFiltered(query) {
  return Boolean(
    query.q ||
      query.tags?.length ||
      query.inStock ||
      query.minPrice ||
      query.maxPrice ||
      (query.sort && query.sort !== 'recommended') ||
      (query.perPage && query.perPage !== DEFAULT_PER_PAGE)
  );
}

/** Human-readable summary of the active filters, for the results header. */
export function describeQuery(query) {
  const parts = [];
  if (query.q) parts.push(`「${query.q}」`);
  if (query.inStock) parts.push('在庫あり');
  if (query.tags?.length) parts.push(query.tags.join('・'));
  if (query.minPrice || query.maxPrice) {
    const lo = query.minPrice ? `${query.minPrice.toLocaleString('ja-JP')}円` : '';
    const hi = query.maxPrice ? `${query.maxPrice.toLocaleString('ja-JP')}円` : '';
    parts.push(lo && hi ? `${lo}〜${hi}` : lo ? `${lo}以上` : `${hi}以下`);
  }
  return parts.join(' / ');
}
