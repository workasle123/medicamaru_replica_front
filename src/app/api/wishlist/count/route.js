import { NextResponse } from 'next/server';

import { getWishlist } from '@/services/auth.service';

/**
 * Saved-product count, for the header badge.
 *
 * The sibling of /api/cart/count and there for the same reason: the header
 * must stay a Server Component on statically rendered pages, and reading the
 * session cookie in the root layout would opt EVERY route into dynamic
 * rendering — product pages included, which must remain prerendered for SEO
 * and LCP.
 *
 * PRODUCTS, not rows. The endpoint groups by product, so a customer who saved
 * two pack sizes of the same medicine has one favourite, which is also what
 * the page shows them. Counting rows would make the badge disagree with the
 * list it points at.
 *
 * Zero for a signed-out visitor: the wishlist is attributed to a customer
 * server-side, so there is nothing anonymous to count. getWishlist already
 * returns [] without a token.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const items = await getWishlist();

  return NextResponse.json(
    { count: items.length },
    // Per-visitor and live: never cache, never share.
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}
