/**
 * A client-side "the wishlist changed" signal.
 *
 * The same arrangement as cart-events, and for the same reason: the header
 * badge reads its number from /api/wishlist/count after hydration, because
 * reading the session cookie during server render would opt every route into
 * dynamic rendering and cost us the prerendered product pages.
 *
 * Navigation alone is not enough to tell it. Moving a favourite into the cart
 * ends in `redirect('/wishlist?added=1')` — the same pathname it started on,
 * and after the first one the query string does not change either. So the
 * component that removes the row says so explicitly.
 *
 * Adding from a product page is the one case that needs no event: that action
 * redirects to /wishlist, and a changed pathname already makes the badge look
 * again.
 */

export const WISHLIST_CHANGED = 'medicamaru:wishlist-changed';

/**
 * Tell the header its number is stale.
 *
 * Call it AFTER the write has landed, not when the form is submitted:
 * /api/wishlist/count reads the same rows the Server Action is still deleting,
 * and asking too early just reads the old answer back.
 */
export function notifyWishlistChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(WISHLIST_CHANGED));
}
