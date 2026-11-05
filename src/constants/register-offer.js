/**
 * How the new-member popup BEHAVES. What it promises is not here.
 *
 * The figure used to live in this file, as a constant with a warning that it
 * had to be kept in step with `registration_points` in Admin → Settings —
 * the value UpdateReferralInfo actually credits when an account is created.
 * Two numbers, one of them in a deploy artefact, and nothing to make them
 * agree. A visitor promised 500 and credited 200 has been misled, which is
 * 景品表示法's 有利誤認, and on a pharmacy site that is worth getting right.
 *
 * The popup now reads the setting at render (RegisterPopupMount), so the
 * promise and the credit are the same row. Changing the offer is an admin
 * edit, not a release. Everything below is timing and placement, which the
 * backend has no opinion about.
 */

/** How long after arriving the popup appears, in milliseconds. */
export const DELAY_MS = 4500;

/**
 * How long a dismissal is respected, in days.
 *
 * Not forever: an offer worth interrupting someone for is worth asking about
 * again on a later visit. Not per-session either — that would re-interrupt the
 * same person every time they came back, which is how a promotion turns into a
 * reason to leave.
 */
export const DISMISS_DAYS = 30;

/** localStorage key holding the dismissal timestamp. */
export const STORAGE_KEY = 'medicamaru:register-popup-dismissed';

/**
 * Routes the popup must never interrupt.
 *
 * Everything from the cart onward is someone in the middle of paying, and a
 * modal over a checkout form costs more in abandoned carts than it wins in
 * sign-ups. /register and /login are where this offer already leads, so
 * interrupting them with an invitation to go there is absurd; /my-account is
 * a customer who has already registered and collected the points.
 */
export const BLOCKED_PATHS = ['/cart', '/checkout', '/my-account', '/login', '/register'];
