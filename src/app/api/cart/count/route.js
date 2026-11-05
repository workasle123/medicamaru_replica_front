import { NextResponse } from 'next/server';

import { getCartCount } from '@/services/cart.service';

/**
 * Cart line count, for the header badge.
 *
 * This exists so the header can stay a Server Component on statically
 * rendered pages. Reading the cart cookie directly in the root layout would
 * opt EVERY route into dynamic rendering — including the product pages,
 * which must remain prerendered static HTML for SEO and LCP.
 *
 * The badge is not indexable content, so fetching it after hydration costs
 * nothing that matters.
 *
 * The better long-term fix is Next 16's `cacheComponents`, which allows a
 * static shell with a dynamic hole for exactly this case. Tracked for
 * Phase 11.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const count = await getCartCount();

  return NextResponse.json(
    { count },
    // Per-visitor and live: never cache, never share.
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}
