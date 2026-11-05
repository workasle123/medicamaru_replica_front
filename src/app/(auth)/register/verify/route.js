import { NextResponse } from 'next/server';

import { verifyEmail } from '@/services/auth.service';
import { setSessionToken } from '@/lib/auth/session';
import { publicOrigin } from '@/lib/auth/redirect';
import { getCartId } from '@/lib/cart/session';

/**
 * Where the link in the 「メールアドレスのご確認」 email lands.
 *
 * A ROUTE HANDLER, not a page. There used to be a confirmation screen here
 * saying 「確認が完了しました」 with a link to the login page — a stop telling the
 * customer to do the thing the link had already earned them. Confirming the
 * address is the last step before the account is theirs, so this spends the
 * token, signs them in and puts them on マイページ.
 *
 * A handler rather than a page because a session is a COOKIE, and a Server
 * Component may not set one — only a Route Handler or a Server Action can.
 * Rendering a page that then asked the browser to post back would be the same
 * interstitial in a different costume.
 *
 * Failures go to /login, where the resend form already lives, carrying the
 * reason so it can say which thing went wrong. Nothing needs its own screen.
 */
export const dynamic = 'force-dynamic';

/* `publicOrigin` moved to @/lib/auth/redirect when the session-expired
   handler needed it too — the full explanation of why `nextUrl.origin` is
   wrong behind this proxy lives there.

   The consequence specific to THIS route is worth keeping in view: the token
   is single-use, so when a bad redirect stranded someone the natural reaction
   — clicking the link in the email again — failed for real and landed on
   `/login?verify=invalid`, which is exactly what a broken verification looks
   like from the outside. */

export async function GET(request) {
  const token = request.nextUrl.searchParams.get('token');

  const to = (path) => NextResponse.redirect(new URL(path, publicOrigin(request)));

  if (!token) return to('/login?verify=invalid');

  /* The cart the visitor filled before registering. Handed to the endpoint so
     it is merged into the account here, rather than being stranded under the
     guest id by a sign-in that skipped the login form. */
  const result = await verifyEmail(token, { sessionId: await getCartId() });

  if (!result.ok) {
    /* `expired` and `invalid` mean different things to the reader: one is
       someone who waited and needs a new link, the other is most often a link
       already used, where the account is fine and logging in is the answer. */
    return to(`/login?verify=${result.reason === 'expired' ? 'expired' : 'invalid'}`);
  }

  /* Verified, but the backend is older than this build and issued no session.
     Sending them to log in is correct then — it is the previous behaviour,
     minus the page that only said so. */
  if (!result.token) return to('/login?verify=done');

  await setSessionToken(result.token, result.customer?.id);

  return to('/my-account?verified=1');
}
