/**
 * Medicamaru — campaigns (キャンペーン, Admin → Banners with 「Show on Campaign
 * Page」 ticked).
 *
 * A campaign is not a separate record. It is a `banner_details` row read for
 * its offer fields — coupon code, date window, minimum spend, discount, terms
 * — rather than for its artwork. The same row can be a carousel slide and a
 * campaign at once, and several are.
 *
 * One list call serves the whole page: eight rows, each under a kilobyte, so
 * there is nothing to paginate and no detail endpoint to want.
 */

import { adapter } from './adapters';
import { logError, isUnavailable } from '@/lib/api/errors';

/**
 * Every live campaign, soonest to finish first.
 *
 * Rethrows an outage rather than returning [], following notices.service: an
 * empty array here would render 「現在、実施中のキャンペーンはありません」 and that
 * page would then be cached in place of the real one for the whole revalidate
 * window. A campaign page that wrongly says there are no campaigns is worse
 * than one that errors, because nobody reports it.
 *
 * @returns {Promise<import('@/lib/types').Campaign[]>}
 */
export async function listCampaigns() {
  try {
    return await adapter.getCampaigns();
  } catch (error) {
    logError(error, { service: 'campaigns.listCampaigns' });
    if (isUnavailable(error)) throw error;
    return [];
  }
}
