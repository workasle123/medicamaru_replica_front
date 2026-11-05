import 'server-only';

import { authAdapter } from './adapters';
import { getSessionToken, getCustomerId } from '@/lib/auth/session';
import { logError, toUserMessage } from '@/lib/api/errors';

/**
 * Medicamaru — account service.
 *
 * Server-only. Every function reads the session token from the httpOnly
 * cookie itself, so no caller ever handles a token — which means a token
 * cannot accidentally be passed to a Client Component as a prop.
 */

export async function login(credentials) {
  return authAdapter.login(credentials);
}

export async function register(details) {
  return authAdapter.register(details);
}

/**
 * Finish a registration for an email that has guest orders, from the link the
 * backend emailed. On success the result has a token, exactly like register.
 */
export async function confirmRegistration(input) {
  return authAdapter.confirmRegistration(input);
}

/**
 * Set a new password from the reset email's link.
 * @param {{token: string, password: string, passwordConfirm: string}} input
 */
export async function resetPassword(input) {
  return authAdapter.resetPassword(input);
}

export async function requestPasswordReset(email) {
  try {
    return await authAdapter.requestPasswordReset(email);
  } catch (error) {
    logError(error, { service: 'auth.requestPasswordReset' });
    // Always report success — whether an address is registered must not be
    // observable, and a failure here should not tell the user otherwise.
    return { ok: true };
  }
}

/**
 * The current customer, or null when signed out.
 * @returns {Promise<import('@/lib/types').Customer|null>}
 */
export async function getCurrentCustomer() {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    return await authAdapter.getCustomer(token);
  } catch (error) {
    logError(error, { service: 'auth.getCurrentCustomer' });
    // An expired or invalid token reads as signed out rather than an error.
    return null;
  }
}

export async function getAddresses() {
  const token = await getSessionToken();
  if (!token) return [];
  try {
    return await authAdapter.getAddresses(token);
  } catch (error) {
    logError(error, { service: 'auth.getAddresses' });
    return [];
  }
}

/**
 * The signed-in customer's referral code and the people around it.
 *
 * Falls back to an empty shape rather than null, so the page can render its
 * "nothing yet" state instead of an error boundary when the endpoint is
 * unreachable — the code itself also arrives on the customer profile, so the
 * panel is not useless without this call.
 *
 * @returns {Promise<{code: string|null, referred: object[], referredBy: object|null}>}
 */
export async function getReferrals() {
  const token = await getSessionToken();
  if (!token) return { code: null, referred: [], referredBy: null };
  try {
    return await authAdapter.getReferrals(token);
  } catch (error) {
    logError(error, { service: 'auth.getReferrals' });
    return { code: null, referred: [], referredBy: null };
  }
}

export async function getOrders() {
  const token = await getSessionToken();
  if (!token) return [];
  try {
    return await authAdapter.getOrders(token);
  } catch (error) {
    logError(error, { service: 'auth.getOrders' });
    return [];
  }
}

export async function getOrder(orderId) {
  const token = await getSessionToken();
  if (!token) return null;
  /* The detail endpoint takes the customer id as a path segment and checks the
     order belongs to it, so this is not optional — without it the request 403s. */
  const customerId = await getCustomerId();
  try {
    return await authAdapter.getOrder(token, orderId, customerId);
  } catch (error) {
    logError(error, { service: 'auth.getOrder', orderId });
    return null;
  }
}

/**
 * The points wallet — balance and history.
 *
 * Signed-in only; an empty wallet and a signed-out visitor both come back as
 * a zero balance with no entries, which is what the account page renders
 * either way.
 */
/**
 * Save the member's own details.
 *
 * Returns `{ok:false, error}` rather than throwing, so the form can keep what
 * the customer typed and show them why — a long form cleared by an error is
 * how you lose the edit entirely.
 */
export async function updateProfile(input) {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: 'ログインの有効期限が切れました。' };
  try {
    return await authAdapter.updateProfile(token, input);
  } catch (error) {
    logError(error, { service: 'auth.updateProfile' });
    return { ok: false, error: toUserMessage(error) };
  }
}

/** Change the password. Same contract; the backend checks the old one. */
export async function changePassword(input) {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: 'ログインの有効期限が切れました。' };
  try {
    return await authAdapter.changePassword(token, input);
  } catch (error) {
    logError(error, { service: 'auth.changePassword' });
    return { ok: false, error: toUserMessage(error) };
  }
}

/**
 * Confirm an address from the emailed link.
 *
 * Returns a session, like login: holding the token proves control of the
 * inbox, so there is nothing left to ask for.
 *
 * @param {string} token
 * @param {{sessionId?: string|null}} [options]
 *   `sessionId` is the guest cart id. Passing it is what carries a cart built
 *   before registering into the account — the same merge login performs.
 */
export async function verifyEmail(token, options = {}) {
  try {
    return await authAdapter.verifyEmail(token, options);
  } catch (error) {
    logError(error, { service: 'auth.verifyEmail' });
    return { ok: false, reason: 'invalid' };
  }
}

/**
 * Ask for a fresh link.
 *
 * Always reports success. The backend deliberately answers the same whether
 * or not the address is on file, so promising anything more specific here
 * would be inventing a distinction it refused to make.
 */
export async function resendVerification(email) {
  try {
    await authAdapter.resendVerification(email);
  } catch (error) {
    logError(error, { service: 'auth.resendVerification' });
  }
  return { ok: true };
}

export async function getPoints() {
  const token = await getSessionToken();
  if (!token) return { balance: 0, entries: [] };
  try {
    return await authAdapter.getPoints(token);
  } catch (error) {
    logError(error, { service: 'auth.getPoints' });
    return { balance: 0, entries: [] };
  }
}

export async function getWishlist() {
  const token = await getSessionToken();
  if (!token) return [];
  try {
    return await authAdapter.getWishlist(token);
  } catch (error) {
    logError(error, { service: 'auth.getWishlist' });
    return [];
  }
}

/**
 * Wishlist add/remove.
 *
 * Signed-in only — the backend attributes the row to
 * `request()->user()->customer_id`, so there is nothing to attach an anonymous
 * save to. Returns `{ ok: false, requiresLogin: true }` rather than throwing so
 * the caller can send the visitor to /login instead of showing an error.
 *
 * @param {string|number} productId
 * @param {string|number} variantId
 */
export async function addToWishlist(productId, variantId) {
  const token = await getSessionToken();
  if (!token) return { ok: false, requiresLogin: true };

  try {
    return await authAdapter.addToWishlist(token, productId, variantId);
  } catch (error) {
    logError(error, { service: 'auth.addToWishlist', productId, variantId });
    return { ok: false, error: 'お気に入りに追加できませんでした。' };
  }
}

export async function removeFromWishlist(productId, variantId) {
  const token = await getSessionToken();
  if (!token) return { ok: false, requiresLogin: true };

  try {
    return await authAdapter.removeFromWishlist(token, productId, variantId);
  } catch (error) {
    logError(error, { service: 'auth.removeFromWishlist', productId, variantId });
    return { ok: false, error: 'お気に入りから削除できませんでした。' };
  }
}

/**
 * Post or edit a review of a product.
 *
 * Signed-in only, like the wishlist: the backend attributes the row to
 * request()->user()->customer_id. Returns `{ ok }` rather than throwing,
 * because the caller is a Server Action that has to put a message on a form.
 *
 * ONE REVIEW PER CUSTOMER PER PRODUCT. The endpoint upserts, so a second
 * submission replaces the first rather than adding a duplicate — and an edit
 * sends the row back to status 0 for re-moderation, since the approved copy
 * was approved on its old text.
 *
 * @param {{productId: string|number, rating: number, comment: string,
 *          nickname?: string, photo?: File|null}} input
 */
export async function submitReview(input) {
  const token = await getSessionToken();
  if (!token) return { ok: false, requiresLogin: true };

  try {
    return await authAdapter.submitReview(token, input);
  } catch (error) {
    logError(error, { service: 'auth.submitReview', productId: input?.productId });
    return { ok: false, error: toUserMessage(error) };
  }
}

/**
 * Whether the signed-in customer may review this product.
 *
 * Resolves the three things the form needs in one place: is anyone signed in,
 * have they ordered this product, and do they already have a nickname (which
 * decides whether the form has to ask for one).
 *
 * `false` for a guest rather than an error — not being signed in is an
 * ordinary state for a product page, which is public.
 *
 * @param {string|number} productId
 */
export async function getReviewEligibility(productId) {
  const token = await getSessionToken();
  if (!token) return { signedIn: false, purchased: false, nickname: null };

  try {
    const customer = await authAdapter.getCustomer(token);
    /* `customerId` is the CUS-style string the purchase check wants — NOT
       `customer.id`, which is the numeric primary key and would match no
       order. The session cookie holds the same string, so it stands in when
       the profile call came back without one. */
    const customerId = customer?.customerId ?? (await getCustomerId());
    if (!customerId) return { signedIn: true, purchased: false, nickname: null };

    const purchased = await authAdapter.hasPurchasedProduct(token, customerId, productId);

    return { signedIn: true, purchased, nickname: customer?.nickname ?? null };
  } catch (error) {
    logError(error, { service: 'auth.getReviewEligibility', productId });
    /* Signed in, but we could not establish the rest. The form stays hidden:
       offering it and then having the post refused is worse than not offering
       it, and the customer can try again. */
    return { signedIn: true, purchased: false, nickname: null };
  }
}

/**
 * Address book writes.
 *
 * Each reads the session token itself, so a caller never handles one, and each
 * returns `{ ok }` rather than throwing — these are called from Server Actions,
 * where an uncaught throw becomes a full error page instead of a message beside
 * the form the customer was filling in.
 */
export async function createAddress(input) {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: 'ログインが必要です。' };
  try {
    await authAdapter.addAddress(token, input);
    return { ok: true };
  } catch (error) {
    logError(error, { service: 'auth.createAddress' });
    return { ok: false, error: 'お届け先を保存できませんでした。時間をおいてお試しください。' };
  }
}

export async function updateAddress(id, input) {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: 'ログインが必要です。' };
  try {
    await authAdapter.updateAddress(token, id, input);
    return { ok: true };
  } catch (error) {
    logError(error, { service: 'auth.updateAddress' });
    return { ok: false, error: 'お届け先を更新できませんでした。時間をおいてお試しください。' };
  }
}

export async function deleteAddress(id) {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: 'ログインが必要です。' };
  try {
    await authAdapter.deleteAddress(token, id);
    return { ok: true };
  } catch (error) {
    logError(error, { service: 'auth.deleteAddress' });
    return { ok: false, error: 'お届け先を削除できませんでした。時間をおいてお試しください。' };
  }
}
