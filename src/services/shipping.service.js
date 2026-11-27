/**
 * Shipping service.
 *
 * Just the free-shipping threshold for now, which the 送料 row of the
 * 特定商取引法に基づく表示 on /about prints as 「5,000円以上のご注文で送料無料」.
 * The number is NOT a setting: it is `offer_value_min` on the live offer row
 * whose `discount_type` is `free_shipping`. Change it in the admin and the
 * page follows.
 */

import { adapter } from './adapters';
import { logError } from '@/lib/api/errors';

/**
 * The spend that earns free shipping, or null when no offer is running.
 *
 * Null is the honest answer for "no offer": the 送料 row then states the
 * postage alone rather than 「0円以上で送料無料」. Failures resolve to null for
 * the same reason — a missing threshold must never be the thing that takes
 * the page down.
 *
 * @returns {Promise<number|null>}
 */
export async function getFreeShippingThreshold() {
  try {
    const threshold = await adapter.getFreeShippingThreshold();
    return typeof threshold === 'number' && threshold > 0 ? threshold : null;
  } catch (error) {
    logError(error, { service: 'shipping.getFreeShippingThreshold' });
    return null;
  }
}
