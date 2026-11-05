import 'server-only';

import { cookies } from 'next/headers';

/**
 * Medicamaru — session handling.
 *
 * `server-only` at the top is load-bearing: it makes the build fail if this
 * module is ever imported into a Client Component, which would leak the
 * session token into the browser bundle.
 *
 * The session token lives in an httpOnly cookie. It is never readable from
 * JavaScript, never placed in localStorage, and never passed to the client
 * as a prop.
 *
 * ⚠️ PROVISIONAL. The real token format, lifetime and refresh semantics come
 * from the backend replica (Laravel Sanctum is the proposal in Phase 0 §7.3).
 * The cookie mechanics below are sound; what a token *is* may change.
 */

const SESSION_COOKIE = 'medicamaru_session';
/**
 * The customer's own identifier, stored beside the token.
 *
 * The cart endpoints key on `customer_id` rather than on the bearer token: a
 * signed-in cart is looked up by it, and it is what the guest cart is merged
 * into at login. Without it every signed-in cart call would fall back to the
 * guest `session_id` and read the wrong cart.
 *
 * This is not a credential — it is the same value the backend returns in a
 * login response — but it is httpOnly for the same reason the cart id is:
 * nothing client-side needs to read it.
 */
const CUSTOMER_COOKIE = 'medicamaru_customer';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const COOKIE_OPTIONS = {
  httpOnly: true,
  // Secure in production only, so local http development still works.
  secure: process.env.NODE_ENV === 'production',
  // 'lax' keeps the session on normal top-level navigations from other
  // sites, while blocking it on cross-site POSTs — the CSRF-relevant case.
  sameSite: 'lax',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
};

/** @returns {Promise<string|null>} */
export async function getSessionToken() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/** @returns {Promise<string|null>} */
export async function getCustomerId() {
  const store = await cookies();
  return store.get(CUSTOMER_COOKIE)?.value ?? null;
}

/**
 * @param {string} token
 * @param {string} [customerId]
 */
export async function setSessionToken(token, customerId) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, COOKIE_OPTIONS);
  if (customerId) store.set(CUSTOMER_COOKIE, String(customerId), COOKIE_OPTIONS);
}

export async function clearSessionToken() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(CUSTOMER_COOKIE);
}

/** @returns {Promise<boolean>} */
export async function isAuthenticated() {
  return Boolean(await getSessionToken());
}
