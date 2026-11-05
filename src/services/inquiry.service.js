/**
 * Medicamaru — contact / inquiry service.
 *
 * Messages land in the admin panel's `inquiry` table (Admin → Inquiry), where
 * staff read them and set a status.
 */

import { adapter } from './adapters';

/**
 * @param {Object} input
 * @param {string} input.name
 * @param {string} input.email
 * @param {string} input.subject    the お問い合わせ種別 the visitor picked
 * @param {string} input.message
 * @param {string} [input.orderId]  folded into the message; the table has no column
 * @returns {Promise<{ok: true}>} Throws when the backend cannot be reached or fails.
 */
export async function submitInquiry(input) {
  return adapter.submitInquiry(input);
}
