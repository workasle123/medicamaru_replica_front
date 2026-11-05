import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/auth/session';
import { getCurrentCustomer, getAddresses } from '@/services/auth.service';

/**
 * Whether this visitor is signed in, and where they have their orders sent.
 *
 * Exists for the same reason /api/cart/count does: the header is a Server
 * Component, and reading the session cookie inside it would opt EVERY route
 * into dynamic rendering — including the product and category pages, which have
 * to stay prerendered for SEO and LCP. So the header renders without knowing,
 * and this fills in the two pieces afterwards.
 *
 * A signed-out visitor costs ZERO backend calls: no session cookie means the
 * answer is known here without asking Laravel anything. That matters because
 * most traffic on a public shop is signed out, and this runs on every page.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json(
      { signedIn: false, name: null, address: null },
      { headers: { 'Cache-Control': 'no-store, private' } }
    );
  }

  /* Both in parallel. The customer call is what decides signed-in state — a
     cookie can outlive its token, and showing マイページ to someone whose session
     has expired sends them to an error page instead of a login form. */
  const [customer, addresses] = await Promise.all([
    getCurrentCustomer(),
    getAddresses(),
  ]);

  if (!customer) {
    return NextResponse.json(
      { signedIn: false, name: null, address: null },
      { headers: { 'Cache-Control': 'no-store, private' } }
    );
  }

  const preferred = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  return NextResponse.json(
    {
      signedIn: true,
      name: customer.name ?? null,
      /* Only what the header shows. The rest of the address is nobody's business
         in a response that exists to render one line of text. */
      address: preferred
        ? {
            label: preferred.label,
            postalCode: preferred.postalCode,
            prefecture: preferred.prefecture,
            city: preferred.city,
          }
        : null,
    },
    { headers: { 'Cache-Control': 'no-store, private' } }
  );
}
