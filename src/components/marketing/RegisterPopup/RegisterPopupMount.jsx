import { getRegistrationPoints } from '@/services/home.service';
import RegisterPopup from './RegisterPopup';

/**
 * Decides whether the 新規会員登録キャンペーン popup appears, and with what
 * figure.
 *
 * A Server Component in front of the client modal, so the number is read from
 * Admin → Settings at render rather than typed into the bundle. It used to be
 * a constant with a comment telling whoever found it to keep it in step with
 * the backend; the figure and the credit now come from the same row.
 *
 * ## Nothing to say, nothing shown
 *
 * No points configured, zero, or the backend unreachable all return null, and
 * all three mean the same thing: the popup does not render. There is
 * deliberately no fallback number. A popup that advertises a figure the
 * backend will not credit is 景品表示法's 有利誤認, and a hardcoded default is
 * precisely how a page ends up making that promise — it survives every change
 * made in the admin. Losing a promotional interruption during a backend blip
 * is the cheaper failure by a wide margin.
 *
 * ## How quickly an admin edit reaches a visitor
 *
 * As quickly as the PAGE the popup is standing on refreshes — not the 60s
 * window on the fetch itself. This renders inside the root layout, so on a
 * statically revalidated route it is baked into that route's cached output
 * and cannot update ahead of it. Measured against a local backend, with the
 * setting changed from 200 to 500: /search (dynamic) showed 500 on the next
 * request; the homepage (revalidate = 300) went on showing 200 until its own
 * window turned over.
 *
 * So the propagation window is per route — immediate on dynamic ones, up to
 * the page's own TTL on the rest, which is an hour on the longest content
 * pages. That is the cost of rendering this on the server, and it is worth
 * paying: the alternative is a client fetch on every visit to every page, for
 * a number that changes a few times a year. It is also an enormous
 * improvement on the thing it replaces, where the window was "until someone
 * edits a constant and redeploys".
 *
 * Do NOT reach for `connection()` or any other dynamic API to shorten it.
 * This is in the ROOT LAYOUT: opting out of static rendering here opts the
 * whole site out, which is how the site lost its prerendering once already.
 *
 * ## Why it is split in two
 *
 * The modal needs state, effects, focus handling and the dismissal key, so it
 * has to be a Client Component — and a Client Component cannot await. This
 * wrapper does the awaiting. The layout renders it inside <Suspense> so the
 * fetch never holds up the page: the popup is on a 4.5s timer and has no
 * business being in the critical path of the shell around it.
 */
export default async function RegisterPopupMount() {
  const points = await getRegistrationPoints();
  if (!points) return null;

  return <RegisterPopup points={points} />;
}
