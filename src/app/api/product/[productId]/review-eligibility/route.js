import { NextResponse } from 'next/server';

import { getReviewEligibility } from '@/services/auth.service';

/**
 * May the visitor review this product?
 *
 * This exists because the product pages are PRERENDERED STATIC HTML — all
 * ~3,000 of them — and reading the session cookie during their render would
 * opt every one into dynamic rendering. That would cost the thing those pages
 * exist for: being fast and indexable. Same reason /api/cart/count and
 * /api/cart/product-units exist.
 *
 * So the page renders the reviews it can render on the server, and the form
 * asks this after hydration.
 *
 * Returns three facts rather than one verdict, because each produces different
 * words on screen: a guest is invited to sign in, a signed-in customer who has
 * not ordered the product is told what the condition is, and a customer with
 * no nickname has to be asked for one before their review can be attributed.
 */
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { productId } = await params;

  if (!productId) {
    return NextResponse.json(
      { error: 'productId is required' },
      { status: 400, headers: { 'Cache-Control': 'no-store, private' } }
    );
  }

  const eligibility = await getReviewEligibility(productId);

  return NextResponse.json(
    eligibility,
    // Per-visitor and live: never cache, never share.
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}
