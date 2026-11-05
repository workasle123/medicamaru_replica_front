/**
 * Medicamaru — newsletter service.
 *
 * Sign-ups land in the admin panel's `subscribers` table (Admin → Newsletter),
 * which also sends the welcome email.
 */

import { adapter } from './adapters';

/**
 * @param {string} email  already checked for shape by the caller
 * @returns {Promise<{ok: true} | {ok: false, alreadySubscribed: true}>}
 *   Throws when the backend cannot be reached or fails.
 */
export async function subscribe(email) {
  return adapter.subscribe(email);
}
