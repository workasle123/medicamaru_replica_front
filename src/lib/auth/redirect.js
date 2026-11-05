import { SITE } from '@/constants/site';

/**
 * Redirect helpers shared by the auth Route Handlers.
 *
 * `publicOrigin` lived inside `register/verify/route.js` until a second
 * handler needed it. It is extracted rather than copied deliberately: it
 * encodes a non-obvious property of this deployment, and two copies that
 * drift would reintroduce a bug that was expensive to find the first time.
 */

/**
 * The origin to send the browser back to.
 *
 * Relative redirects are not allowed from a Route Handler, so every target
 * has to be absolute — and `request.nextUrl.origin` IS NOT THE PUBLIC ONE.
 * The app runs behind a reverse proxy on Hostinger, where that resolves to
 * the address Node is bound to: a customer who clicked the link in their
 * email was sent to `0.0.0.0:3000/my-account?verified=1` and got
 * ERR_ADDRESS_INVALID — after their address had been confirmed, so the
 * verification worked and the page they were shown said otherwise.
 *
 * The forwarded headers carry the host the customer actually typed, so they
 * come first. NEXT_PUBLIC_SITE_URL is the fallback for a proxy that sends
 * neither, and `nextUrl.origin` is kept last for local development, where
 * there is no proxy and it is correct.
 *
 * @param {Request & {nextUrl: URL}} request
 * @returns {string}
 */
export function publicOrigin(request) {
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const forwardedProto = request.headers.get('x-forwarded-proto');

  /* A bind address is not somewhere a browser can go. Seeing one means the
     header is the proxy's internal view, not the customer's. */
  const unusable = (host) =>
    !host || host.startsWith('0.0.0.0') || host.startsWith('[::]');

  if (!unusable(forwardedHost)) {
    const proto = forwardedProto || (forwardedHost.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${forwardedHost}`;
  }

  /* Set on the live deployment; the placeholder default is no use here. */
  if (SITE.url && !SITE.url.includes('medicamaru.example')) return SITE.url;

  return request.nextUrl.origin;
}

/**
 * Only allow same-origin relative paths, so a `?to=` or `?next=` carried in a
 * URL cannot become an open redirect. `//evil.test` is rejected as well as
 * `https://evil.test`: a protocol-relative URL is absolute to a browser.
 *
 * @param {unknown} target
 * @param {string} fallback
 * @returns {string}
 */
export function safePath(target, fallback = '/login') {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) {
    return fallback;
  }
  return target;
}
