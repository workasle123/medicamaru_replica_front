import { NextResponse } from 'next/server';

import { clearSessionToken } from '@/lib/auth/session';
import { publicOrigin, safePath } from '@/lib/auth/redirect';

/**
 * Clear a session cookie whose token the backend no longer accepts, then send
 * the visitor where they were trying to go.
 *
 * WHY THIS IS A ROUTE HANDLER AND NOT A SERVER ACTION
 *
 * It replaces `signOutExpiredAction`, which did the same work from a form on
 * the account layout. The action was correct and still produced a loop that
 * customers could not escape: its response carries BOTH the Set-Cookie that
 * deletes the session AND the redirect, so if that one response does not
 * reach the browser, the server has signed them out and the browser does not
 * know it. The stale cookie survives, every auth page bounces back to the
 * expired screen, and pressing the button again changes nothing.
 *
 * That is not hypothetical on this host. Responses here abort intermittently
 * — `GET /register?_rsc=… → 200 [FAILED: net::ERR_ABORTED]` was captured on
 * production — and the same transport carries Server Action replies.
 *
 * A GET handler is the robust shape for this. The browser treats the 302 as
 * an ordinary navigation, it is retried by a plain reload, it works with
 * JavaScript disabled, and a link needs no form or client bundle at all.
 *
 * The cart cookie is deliberately left alone: the visitor's basket is still
 * theirs, and this is a session repair, not a sign-out.
 */
export const dynamic = 'force-dynamic';

export async function GET(request) {
  await clearSessionToken();

  /* Where to land afterwards. Someone who clicked 新規登録 wants the register
     form, not the login form — sending everyone to /login would fix the loop
     and still lose their intent. */
  const to = safePath(request.nextUrl.searchParams.get('to'), '/login?next=/my-account');

  const target = new URL(to, publicOrigin(request));

  /* `cleared=1` is a termination guard, not decoration. The auth pages send a
     stale session here; this sends them back. If the delete were ever not to
     take effect, that is a cycle. The marker makes the pages skip the check
     once, so the worst case is one wasted round trip and a login form —
     never a loop. */
  target.searchParams.set('cleared', '1');

  return NextResponse.redirect(target);
}
