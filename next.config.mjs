import { createHash } from 'node:crypto';
import path from 'node:path';

/**
 * The local backend runs under XAMPP at http://localhost/adminpanel/public.
 * Next refuses to optimise images from a host that resolves to a private IP,
 * because in production that is an SSRF vector — the optimiser would fetch
 * whatever the server can reach on its own loopback.
 *
 * That reasoning does not apply on a developer's machine, but it very much
 * does on a deployed server, so both the localhost pattern and the opt-out
 * are switched off outside development rather than merely discouraged.
 */
const isDev = process.env.NODE_ENV === 'development';

/**
 * The canonical origin, from NEXT_PUBLIC_SITE_URL — e.g. https://okusuriraku.shop.
 * Null when unset or malformed, which switches the www redirect below off
 * rather than failing the build over a typo in an environment variable.
 */
const canonicalUrl = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '');
  } catch {
    return null;
  }
})();

/**
 * The backend host, as an image remotePattern — development only.
 *
 * Empty in production and whenever API_BASE_URL is localhost (already covered
 * by its own entry) or unset. See the remotePatterns block for why it exists.
 */
const devApiHostPattern = (() => {
  if (!isDev) return [];
  try {
    const url = new URL(process.env.API_BASE_URL ?? '');
    if (url.hostname === 'localhost' || !/^https?:$/.test(url.protocol)) return [];
    return [
      {
        protocol: url.protocol.slice(0, -1),
        hostname: url.hostname,
        pathname: '/**',
      },
    ];
  } catch {
    /* Unset or malformed. Not an error worth failing a build over — the
       localhost entry above still covers the ordinary case. */
    return [];
  }
})();

/**
 * CSS Module class names in the Turbopack format, for the webpack build.
 *
 * `next dev` runs on Turbopack, which names a class `.action` in
 * Header.module.css as `Header-module__<hash>__action`. `next build --webpack`
 * (webpack is required on Hostinger, see package.json) would otherwise name
 * it `Header_action__<hash>`.
 *
 * The theme layers in src/styles/themerefresh.css and themehome.css select
 * components by those names — `[class*="Header-module"][class*="__action"]`,
 * over 300 rules. With webpack's default names, none of them matched anything
 * on live: the :root colour tokens applied, but every component-level rule
 * did not, so production looked half-themed while localhost looked right.
 *
 * Emitting the same format in both bundlers keeps what a designer sees in
 * localhost DevTools true on the deployed site.
 */
function turbopackStyleLocalIdent(context, _localIdentName, localName) {
  const relativePath = path
    .relative(context.rootContext, context.resourcePath)
    .replace(/\\+/g, '/');
  // Header.module.css -> Header-module
  const stem = path
    .basename(context.resourcePath)
    .replace(/\.(css|scss|sass)$/, '')
    .replace(/\./g, '-');
  // One hash per file (as Turbopack does); the local name keeps it unique.
  const hash = createHash('sha1').update(relativePath).digest('hex').slice(0, 8);

  return `${stem}__${hash}__${localName}`
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^(\d|--|-\d)/, '__$1');
}

/** Swap Next's getLocalIdent on every css-loader that builds CSS Modules. */
function applyTurbopackStyleCssModuleNames(rules) {
  let patched = 0;
  for (const rule of rules ?? []) {
    if (!rule || typeof rule !== 'object') continue;
    patched += applyTurbopackStyleCssModuleNames(rule.oneOf);
    patched += applyTurbopackStyleCssModuleNames(rule.rules);

    const uses = Array.isArray(rule.use) ? rule.use : rule.use ? [rule.use] : [];
    for (const use of uses) {
      const modules = use?.options?.modules;
      if (
        typeof use?.loader === 'string' &&
        /[\\/]css-loader[\\/]/.test(use.loader) &&
        modules &&
        typeof modules.getLocalIdent === 'function'
      ) {
        modules.getLocalIdent = turbopackStyleLocalIdent;
        patched += 1;
      }
    }
  }
  return patched;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  /**
   * Webpack build only (`next build --webpack`). See turbopackStyleLocalIdent.
   *
   * Fails the build if Next's css-loader can no longer be found, because a
   * Next upgrade that changes its internals would otherwise silently bring
   * the half-themed live site back.
   */
  webpack(config, { nextRuntime }) {
    const patched = applyTurbopackStyleCssModuleNames(config.module?.rules);
    if (patched === 0 && nextRuntime !== 'edge') {
      throw new Error(
        'next.config.mjs: could not find the CSS Modules css-loader to apply ' +
          'Turbopack-style class names. The theme layers in src/styles/ depend ' +
          'on them; see turbopackStyleLocalIdent.'
      );
    }
    return config;
  },

  /**
   * Required now that a webpack() hook exists: without it, Next 16 refuses to
   * start a plain `next dev` (Turbopack) for fear the webpack config was
   * meant to apply. Turbopack needs nothing here; it already emits these names.
   */
  turbopack: {},

  /**
   * Opening the dev server from another device on the LAN — a phone at
   * http://192.168.1.14:3000 — requires listing that origin here.
   *
   * Next blocks cross-origin requests to `/_next/*` dev resources by default.
   * The failure is deceptive rather than obvious: `/_next/image` and
   * `/_next/static/media` are explicitly exempt, so the HTML renders and every
   * image loads and the page looks completely correct — but all 17 JS chunks
   * return 403, React never hydrates, and nothing client-side runs. The
   * carousel stops auto-advancing, rail arrows do nothing, search suggestions
   * never open. The carousel is only the most visible symptom, being the one
   * thing on the page expected to move on its own.
   *
   * Matched by splitting the host on "." and comparing segments, so a numeric
   * glob survives a DHCP lease that moves. Private ranges only — a public host
   * must never be able to pull dev resources off this machine.
   *
   * `next dev` only: a production build has no dev resources to block, so a
   * deployed site never needed this.
   */
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],

  /**
   * Static generation throttling.
   *
   * The catalogue prerenders ~3,100 product pages, each of which is a PHP
   * request against the backend. Next's default fan-out (15 workers, high
   * per-worker concurrency) saturates Apache faster than it can serve, and
   * requests start exceeding the client timeout — the build then fails on a
   * page that is perfectly healthy when requested on its own.
   *
   * Apache's mpm_winnt is configured with the standard ThreadsPerChild 150
   * and still logged AH00326 "ran out of threads", so the default fan-out is
   * putting hundreds of requests in flight at once. These numbers keep it to
   * roughly workers x concurrency in flight — single digits — which trades
   * build time for a build that actually completes.
   *
   * Raise them once the backend sits behind something sturdier than XAMPP.
   */
  experimental: {
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 500,
    staticGenerationRetryCount: 2,
  },

  // NOTE: `cacheComponents: true` was trialled here and reverted.
  // It is mutually exclusive with the `export const revalidate` and
  // `export const dynamic` route-segment config this app uses, and failed to
  // compile across all 19 route files. Adopting it means migrating every
  // route to `use cache` + `cacheLife` — worth doing (it would let the header
  // cart badge render server-side without losing prerendering), but it is a
  // deliberate refactor, not a config flag. See docs/PHASE-11-SEO-CONTENT.md.

  images: {
    /* WebP only. AVIF was listed first, which makes the optimiser answer the
       SAME URL with AVIF or WebP depending on the browser's Accept header.
       Hostinger's CDN caches /_next/image responses without honouring
       `Vary: Accept` — measured on okusuriraku.shop: a WebP-only request was
       served a cached AVIF. A browser without AVIF support (iOS 15 and
       older) then gets an image it cannot decode. With one format, whatever
       the CDN caches works everywhere. It is also far cheaper to encode on
       shared hosting: 0.2s per image against 0.6-0.7s for AVIF. */
    formats: ['image/webp'],
    /* Open in the browser instead of downloading. Next defaults this to
       `attachment`, so "open image in new tab" on any product photo saved a
       file rather than showing it — medicine.shop and every other shop show
       the picture, and a download is a startling thing for a right-click to do.

       That default exists because serving user-uploaded files inline is how a
       stored XSS lands: an attacker uploads an SVG or HTML file, the optimiser
       hands it back inline, the browser executes it. Neither applies here.
       `dangerouslyAllowSVG` is off, so SVG never passes through the optimiser
       at all; everything it does serve is re-encoded raster, and it already
       sends X-Content-Type-Options: nosniff. If SVG is ever enabled, this
       must go back to `attachment`. */
    contentDispositionType: 'inline',
    // Sized for the actual grid: 2-up at 390px through 5-up at 1280px.
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [64, 96, 128, 160, 240, 320, 384],
    remotePatterns: [
      // Placeholder host used by the mock adapter. Remove once the backend
      // replica serves real product media.
      { protocol: 'https', hostname: 'placehold.co' },
      // Live product/category media, served from Laravel's public storage disk.
      { protocol: 'https', hostname: 'adminpanel.okusuriraku.shop', pathname: '/storage/**' },
      // The same backend running locally under XAMPP. Development only — the
      // optimiser refuses any host not listed here, so without this every
      // product image 400s when API_BASE_URL points at localhost.
      ...(isDev
        ? [{ protocol: 'http', hostname: 'localhost', pathname: '/adminpanel/public/storage/**' }]
        : []),
      /* Whatever host API_BASE_URL names, when it is not localhost.
         Testing on a real phone over the LAN means pointing API_BASE_URL at
         this machine's address (http://192.168.1.x/adminpanel/public) — the
         phone cannot resolve "localhost" to anything but itself. The images
         then come from that address too, and the optimiser rejects any host
         not listed here, so every optimised image 400s and the page looks
         broken in a way that has nothing to do with what is being tested.
         Derived rather than hardcoded, because a DHCP lease moves. */
      ...devApiHostPattern,
    ],
    // Required alongside the pattern above: localhost resolves to ::1 and
    // 127.0.0.1, which the optimiser blocks outright. Never enabled in a
    // deployed build — see the note at the top of this file.
    ...(isDev ? { dangerouslyAllowLocalIP: true } : {}),

    /* DEVELOPMENT ONLY: skip the image optimiser.

       The dev optimiser cannot cope with the number of images this site puts
       on one page. Measured on the homepage, which asks for 105 at once: a
       single request answered while the server was idle returned in 0.166s,
       and the same request under that load returned 504 after 12.5s — after
       which the queue stopped draining entirely and ~100 images sat pending
       indefinitely. The page simply never finished loading its images, with
       no console error and no broken-image icon to explain why, because the
       requests were neither failing nor completing.

       It is not sharp (0.35.5, native win32-x64, loads fine) and it is not
       the backend: Apache serves the same files in about 10ms each.

       Nothing of value is lost locally. Served direct, a local image arrives
       in ~10ms, and production image delivery is not something dev can
       represent anyway — on live these come from the CDN, pre-cached, and
       never touch this code path on a warm request.

       To exercise the optimiser deliberately — checking srcset output, or a
       remotePatterns change — comment this line out and reload. Expect the
       heavier pages to crawl while you do. */
    ...(isDev ? { unoptimized: true } : {}),
  },

  /**
   * www.<canonical host> -> the canonical host, permanently.
   *
   * Hostinger serves the site on both names; without this every page exists
   * twice as far as a search engine is concerned. It also runs BEFORE the
   * passcode in src/proxy.js (next.config redirects precede Proxy), so a
   * visitor who types www is asked for the passcode once, on the right host,
   * instead of once per hostname — Basic auth is remembered per origin.
   *
   * Derived from NEXT_PUBLIC_SITE_URL rather than hard-coded, so Vercel's
   * address, the temporary Hostinger domain and localhost are unaffected.
   */
  async redirects() {
    if (!canonicalUrl || canonicalUrl.hostname.startsWith('www.')) return [];
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: `www.${canonicalUrl.hostname}` }],
        destination: `${canonicalUrl.origin}/:path*`,
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
