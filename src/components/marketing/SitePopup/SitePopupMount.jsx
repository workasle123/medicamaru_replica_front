import { listPopups } from '@/services/home.service';
import SitePopup from './SitePopup';

/**
 * Fetches the live popups and hands them to the client modal.
 *
 * A Server Component in front of a Client one, exactly like
 * RegisterPopupMount: the modal needs state, effects and focus handling, and
 * a Client Component cannot await. This does the awaiting.
 *
 * Renders nothing when there are no popups, which is the normal state of the
 * site — most of the time this costs one cached request and no markup at all.
 *
 * ## How quickly an admin edit reaches a visitor
 *
 * As quickly as the PAGE the popup is standing on refreshes, not the 60s
 * window on the fetch. This is in the root layout, so on a statically
 * revalidated route the list is baked into that route's cached output and
 * cannot update ahead of it — the same trade RegisterPopupMount documents at
 * length, with the same reasoning behind accepting it.
 *
 * The practical consequence for whoever runs a campaign: switching a popup
 * ON appears within a page's own revalidation window, and so does switching
 * it OFF. On the longest-cached content pages that is up to an hour. If a
 * popup must come down NOW, turning it off and redeploying — or waiting out
 * the window — are the two honest answers; there is no cache-busting trick
 * here that would not cost the whole site its prerendering.
 *
 * Do NOT reach for `connection()` or any other dynamic API to shorten it.
 * Opting out of static rendering in the root layout opts the whole site out,
 * which is how this site lost its prerendering once already.
 */
export default async function SitePopupMount() {
  const popups = await listPopups();

  if (!popups.length) return null;

  return <SitePopup popups={popups} />;
}
