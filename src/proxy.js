import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

/**
 * Medicamaru — request proxy.
 *
 * Note the filename: `middleware.js` is deprecated in Next 16 and renamed to
 * `proxy.js` (same functionality, different file and export name).
 *
 * Two jobs, in this order:
 *
 *   1. The pre-launch passcode, over the whole site.
 *   2. The account guard, on /my-account and /wishlist only.
 *
 * PRE-LAUNCH PASSCODE
 *
 * HTTP Basic auth — the browser's own username/password prompt, which is what
 * an `.htaccess` AuthType Basic block gives on Apache. It lives here instead
 * because the storefront is served by Vercel: no request ever reaches an
 * Apache server that could read an .htaccess file.
 *
 * Off unless SITE_ACCESS_PASSWORD is set, so turning it on for the live site
 * and off again at launch is an environment change, not a code change. Local
 * dev leaves it unset. SITE_ACCESS_USER is optional; unset, any username is
 * accepted and the password alone is the passcode.
 *
 * Once someone has entered it, the browser repeats the credentials on every
 * same-origin request by itself — page loads, client-side navigations, Server
 * Actions and the /api routes alike — so nothing else in the app needs to know
 * the passcode exists.
 *
 * WHY THE ACCOUNT GUARD LIVES HERE AND NOT IN THE LAYOUT
 *
 * `src/app/my-account/layout.js` called `redirect('/login?next=/my-account')`
 * for a signed-out visitor. That works for a full page load — a plain GET
 * answered 307 to /login — but NOT for a client-side navigation. Clicking the
 * マイページ link sends an RSC request, and `redirect()` from inside a layout
 * answered that with `307 Location: /my-account?_rsc` — pointing back at the
 * same page instead of at the login form. The router followed it, got nothing
 * renderable, and left the site header and footer on screen with an empty
 * middle. "Only header and footer shows" was exactly that.
 *
 * A proxy runs BEFORE any route renders, so both request types get the same
 * real redirect and there is no layout involved to mis-serialise it.
 *
 * This checks only that a session cookie EXISTS. It is a routing decision, not
 * an authorisation one: whether the token is still valid is settled by the
 * backend on every account request, and the layout still refuses to render an
 * account page whose profile fetch comes back empty. A forged cookie gets you a
 * redirect to a page that then fails its own fetch — never data.
 */

const SESSION_COOKIE = 'medicamaru_session';

/* Previously the matcher itself. The matcher now has to cover the whole site
   for the passcode, so the account paths are picked out here instead — with
   the same meaning as the old '/my-account/:path*' pattern: the path itself
   and anything below it. */
const ACCOUNT_PATHS = ['/my-account', '/wishlist'];

export function proxy(request) {
  if (!hasSiteAccess(request)) {
    return new NextResponse('このサイトは現在準備中です。', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Medicamaru", charset="UTF-8"',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  const { pathname } = request.nextUrl;
  const isAccountPath = ACCOUNT_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  return isAccountPath ? guardAccount(request) : NextResponse.next();
}

function hasSiteAccess(request) {
  /* Read per request, not at module scope, so the value is the one the
     running deployment was given rather than whatever existed at build. */
  const password = process.env.SITE_ACCESS_PASSWORD;
  if (!password) return true;

  const [scheme, encoded] = (request.headers.get('authorization') ?? '').split(' ');
  if (scheme?.toLowerCase() !== 'basic' || !encoded) return false;

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator === -1) return false;

  const expectedUser = process.env.SITE_ACCESS_USER;
  const userMatches = !expectedUser || safeEqual(decoded.slice(0, separator), expectedUser);
  const passwordMatches = safeEqual(decoded.slice(separator + 1), password);

  return userMatches && passwordMatches;
}

/* Constant-time comparison. timingSafeEqual needs equal-length inputs, so both
   sides are hashed first — which also stops the length of the real passcode
   leaking through how long a mismatch takes. */
function safeEqual(a, b) {
  const digest = (value) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

function guardAccount(request) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const login = new URL('/login', request.url);
  // Preserve where they were heading, so signing in lands them there rather
  // than dumping them on the account root.
  login.searchParams.set('next', `${pathname}${search}`);

  return NextResponse.redirect(login);
}

export const config = {
  /* Every route except build output, the image optimiser and static image and
     font files. Those carry nothing worth hiding, and skipping them saves a
     proxy run per asset. robots.txt and sitemap.xml stay behind the passcode:
     the sitemap would otherwise hand out the full URL list. */
  matcher: [
    '/((?!_next/static|_next/image|favicon\.ico|.*\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?)$).*)',
  ],
};
