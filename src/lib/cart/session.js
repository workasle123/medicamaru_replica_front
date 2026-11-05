import 'server-only';

import { cookies } from 'next/headers';

/**
 * Medicamaru — cart session.
 *
 * A guest cart is identified by an opaque id in a cookie, mirroring the
 * source platform's `cart_session` cookie (Phase 0 §2.3). Guests can build a
 * cart without an account; merging a guest cart into a customer's cart on
 * login is a backend concern and is not implemented here.
 *
 * The cart id is NOT httpOnly-sensitive in the way a session token is, but it
 * is still httpOnly: nothing client-side needs to read it, and keeping it out
 * of JavaScript removes a whole class of tampering.
 */

const CART_COOKIE = 'medicamaru_cart';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** @returns {Promise<string|null>} */
export async function getCartId() {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/**
 * Read the cart id, creating one if this is the visitor's first item.
 * @returns {Promise<string>}
 */
export async function ensureCartId() {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  return id;
}

export async function clearCartId() {
  const store = await cookies();
  store.delete(CART_COOKIE);
}
