/**
 * A client-side "the cart changed" signal.
 *
 * The header badge fetches its number from /api/cart/count after hydration,
 * because reading the cart cookie during server render would opt every route
 * into dynamic rendering and cost us the prerendered product pages. That
 * leaves it needing to be told when to look again.
 *
 * Navigation alone is not enough to tell it. Adding from a product page ends
 * in `redirect(`${returnTo}?added=1`)` — the same pathname it started on — so
 * a badge keyed on the pathname never re-runs. The second add does not even
 * change the query string, since it is already `?added=1`.
 *
 * So the components that mutate the cart say so explicitly. A DOM event
 * rather than a context: the badge lives in the root layout and the forms
 * live several trees away, and threading a provider between them to carry one
 * integer would be a lot of plumbing for a number that is already only a
 * fetch away.
 */

export const CART_CHANGED = 'medicamaru:cart-changed';

/**
 * Tell the header its number is stale.
 *
 * Call it AFTER the mutation has landed server-side, not when the form is
 * submitted: /api/cart/count reads the same cart the Server Action is still
 * writing, and asking too early just caches the old answer. The callers pass
 * the same delay they already use to re-read their own state.
 */
export function notifyCartChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CART_CHANGED));
}
