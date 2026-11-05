import { NextResponse } from 'next/server';

import { getCart } from '@/services/cart.service';

/**
 * What the cart already holds of one product.
 *
 * Two things, from one request:
 *
 *   units — the total in BASE UNITS across every variant of the product. The
 *     purchase limit is a limit on the product, not on a pack size: 180
 *     tablets is 180 tablets whether they arrive as six 30s or three 60s.
 *
 *   lines — the cart row for each variant, so a pack already in the cart can
 *     show its quantity and adjust it in place instead of offering to add it
 *     again. `id` is the cart ROW id, which is what the update and remove
 *     endpoints address.
 *
 * The product page cannot read the cart cookie itself without opting all 3,104
 * prerendered product pages into dynamic rendering — the same reason
 * /api/cart/count exists. So the page stays static and asks for this after
 * hydration.
 *
 * Scoped to one product on purpose. The page has no business knowing the rest
 * of the cart, and a smaller payload is a smaller thing to get wrong.
 */
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const productId = request.nextUrl.searchParams.get('productId');

  if (!productId) {
    return NextResponse.json(
      { error: 'productId is required' },
      { status: 400, headers: { 'Cache-Control': 'no-store, private' } }
    );
  }

  let units = 0;
  let lines = [];

  try {
    const cart = await getCart();

    const mine = (cart?.lines ?? []).filter(
      (line) => String(line.productId) === String(productId)
    );

    /* quantity counts packs; unitsPerVariant converts a line to the units the
       cap is written in — the same conversion the cart page makes. */
    units = mine.reduce(
      (sum, line) => sum + line.quantity * (line.unitsPerVariant || 1),
      0
    );

    lines = mine.map((line) => ({
      id: line.id,
      variantId: String(line.variantId),
      quantity: line.quantity,
      unitsPerVariant: line.unitsPerVariant || 1,
    }));
  } catch {
    /* A cart that cannot be read is not a reason to break the product page.
       Empty means "nothing known", every pack offers to be added, and the
       quantity being added is still checked on its own. */
    units = 0;
    lines = [];
  }

  return NextResponse.json(
    { units, lines },
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}
