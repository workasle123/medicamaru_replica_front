/**
 * Medicamaru — the shape of a product URL.
 *
 * `/product/beauty-grace-ex-3295`. The id is the load-bearing half and the
 * name is decoration, and that split is the whole design:
 *
 *   · the route reads the id off the end and asks the backend for it, so no
 *     name→id lookup is needed on any request;
 *   · products.slug is safe to edit in the admin, because changing it
 *     re-points the pretty half and the old address still resolves — it
 *     redirects rather than 404ing;
 *   · `/product/3295`, the form every URL indexed before the slug column
 *     existed uses, still parses and redirects to the current spelling.
 *
 * No imports, on purpose: these two functions decide what is reachable on the
 * site, so they are kept somewhere they can be run and checked on their own
 * rather than only through a page that needs a database behind it.
 */

/**
 * Anything outside a-z0-9 becomes a hyphen.
 *
 * Deliberately narrower than Laravel's Str::slug, which writes the column.
 * This runs over whatever came back from the API — including a slug an admin
 * typed by hand — and a URL must not be able to carry a space, a slash or a
 * Japanese character whatever is stored. Over an already-clean slug it is a
 * no-op.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * A product row's URL segment.
 *
 * Falls back through the stored slug, the English name, and finally the bare
 * id — which is what a product named only in Japanese gets, and which still
 * resolves because the route only ever needs the trailing number.
 *
 * @param {{id?: string|number, slug?: string, product_name_english?: string}} p
 * @returns {string}
 */
export function productSlug(p) {
  const id = String(p?.id ?? '');
  if (!id) return '';

  const name = slugify(p?.slug) || slugify(p?.product_name_english);
  return name ? `${name}-${id}` : id;
}

/**
 * The id out of `beauty-grace-ex-3295`, or out of a bare `3295`.
 *
 * The LAST group of digits wins, not the first, so a name that itself ends in
 * a number reads correctly — `melmet-1000-sr-3293` is product 3293, not 1000.
 * A segment with no trailing digits returns null, and the caller treats that
 * as not-found rather than guessing.
 *
 * @param {unknown} segment
 * @returns {string|null}
 */
export function productIdFromSlug(segment) {
  const match = /(?:^|-)(\d+)$/.exec(String(segment ?? '').trim());
  return match ? match[1] : null;
}
