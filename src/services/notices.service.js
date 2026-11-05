/**
 * Medicamaru — notices (お知らせ, Admin → Notices).
 *
 * Every function reads the one list endpoint: there are only ever a few dozen
 * active notices, so a single cached list serves the side boxes, /notices and
 * every /notices/[id] alike, and needs no detail endpoint on the backend.
 *
 * Two failure policies, as in categories.service: a side box degrades to
 * nothing, while the notice pages rethrow an outage. Returning [] or null
 * there would render an empty list or a 404, and that page would then be
 * cached for ten minutes in place of the real one.
 */

import { adapter } from './adapters';
import { logError, isUnavailable } from '@/lib/api/errors';

/**
 * The newest few, for a side box. Never throws.
 *
 * @param {number} [limit]
 * @returns {Promise<import('@/lib/types').Notice[]>}
 */
export async function listNotices(limit = 5) {
  try {
    return (await adapter.getNotices()).slice(0, limit);
  } catch (error) {
    logError(error, { service: 'notices.listNotices' });
    return [];
  }
}

/**
 * Every active notice, newest Notice Date first — the /notices page.
 *
 * @returns {Promise<import('@/lib/types').Notice[]>}
 */
export async function listAllNotices() {
  try {
    return await adapter.getNotices();
  } catch (error) {
    if (isUnavailable(error)) throw error;
    logError(error, { service: 'notices.listAllNotices' });
    return [];
  }
}

/**
 * One notice, with its neighbours in list order for the 前へ／次へ links.
 * null when there is no active notice with that id.
 *
 * @param {number} id
 * @returns {Promise<{
 *   notice: import('@/lib/types').Notice,
 *   newer: import('@/lib/types').Notice|null,
 *   older: import('@/lib/types').Notice|null,
 * }|null>}
 */
export async function getNotice(id) {
  const notices = await listAllNotices();
  const index = notices.findIndex((n) => n.id === id);
  if (index === -1) return null;

  return {
    notice: notices[index],
    newer: notices[index - 1] ?? null,
    older: notices[index + 1] ?? null,
  };
}
