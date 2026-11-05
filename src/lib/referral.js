import { SITE } from '@/constants/site';

/**
 * The invitation URL for a referral code.
 *
 * Built here rather than taken from the API. /customer/my-referrals returns a
 * `referral_link`, but it is composed with Laravel's `url()`, so it resolves
 * against whatever host answered the request — the admin panel. A customer
 * would be handed https://adminpanel.medicamaru.com/register?ref=XXXX, which
 * is not a page that exists there.
 *
 * `ref` is the query key because that is the one the backend already published
 * in that field; changing it would break any link already shared.
 *
 * @param {string|null|undefined} code
 * @returns {string|null} null when there is no code to build from
 */
export function referralLink(code) {
  if (!code) return null;
  return `${SITE.url.replace(/\/$/, '')}/register?ref=${encodeURIComponent(code)}`;
}

/** The query key carrying a referral code into /register. */
export const REFERRAL_PARAM = 'ref';
