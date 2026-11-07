/**
 * Medicamaru — centralised SEO helpers.
 *
 * METADATA only: titles, canonicals, Open Graph, robots.
 *
 * Structured data moved to `src/schema/` (2026-09-28), one file per page type,
 * built from the graphs the SEO team supplied. The builders that used to live
 * here — organizationJsonLd, productJsonLd, breadcrumbJsonLd, faqJsonLd and the
 * unused articleJsonLd — were replaced wholesale rather than adapted, because
 * the new graphs join their nodes by @id and the old ones were standalone.
 */

import { SITE } from '@/constants/site';

/**
 * Whether this deployment may be indexed by search engines.
 *
 * Opt-IN, and deliberately so. The Vercel preview, every branch deployment and
 * every developer's machine serve the same code as production, and a staging
 * copy that gets indexed competes with the real site for its own keywords and is
 * slow and awkward to get removed afterwards. Defaulting to "allowed" would mean
 * every new environment is a live SEO liability until someone remembers it.
 *
 * So indexing happens only where `NEXT_PUBLIC_ALLOW_INDEXING` is exactly 'true'.
 * The consequence to know about: the production site will NOT be indexed until
 * that variable is set on it. That is one deliberate action at launch, against
 * the alternative of noticing a staging domain in Google months later.
 *
 * Must be NEXT_PUBLIC_ — it is read while rendering metadata, which happens in
 * the client bundle as well as on the server.
 */
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

/**
 * The GA4 measurement ID, or an empty string.
 *
 * Gated exactly like ALLOW_INDEXING above and for the same reason: without it,
 * local dev and every branch build report into the live property, and the
 * numbers that matter arrive mixed with traffic nobody made. A deployment that
 * should be measured sets the variable; everything else simply does not.
 *
 * NEXT_PUBLIC_ because it is read while rendering — and, more importantly here,
 * because it is INLINED AT BUILD TIME. Hostinger builds the zip we upload, so
 * this has to exist in hPanel BEFORE the deploy that should carry it. Setting
 * it afterwards changes nothing until the next build, and the guard in the
 * layout means the script is not merely inert but absent from the bundle.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

/**
 * The Microsoft Clarity project id, or an empty string.
 *
 * Clarity is session recording and heatmaps — it replays what visitors did,
 * so it is the one script here that captures behaviour rather than counts.
 * Masking is left at Clarity's own default in the dashboard; nothing is
 * configured from this side, so there is no code-level promise about what it
 * records. Worth a look before the recordings are relied on, because this
 * site has customers typing addresses and coupon codes into forms.
 *
 * Gated exactly like GA_ID, and INLINED AT BUILD TIME for the same reason:
 * Hostinger builds the zip, so the variable has to exist in hPanel BEFORE the
 * deploy that should carry it. Set afterwards it changes nothing until the
 * next build, and the guard in the layout means the tag is absent from the
 * bundle rather than merely idle.
 */
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || '';

/**
 * Absolute URL for a path. Canonicals and structured data must never be
 * relative.
 * @param {string} path
 */
export function absoluteUrl(path = '/') {
  const base = SITE.url.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Build a Next.js Metadata object with sane, consistent defaults.
 *
 * @param {Object} input
 * @param {string} input.title        Page-specific title (site name is appended)
 * @param {string} input.description
 * @param {string} [input.path]       Canonical path
 * @param {string} [input.image]      OG image URL
 * @param {boolean} [input.noIndex]   Set for facet combos, cart, account
 * @param {'website'|'article'} [input.type]
 * @returns {import('next').Metadata}
 */
export function buildMetadata({
  title,
  description,
  path = '/',
  image,
  noIndex = false,
  type = 'website',
  keywords,
  /* Set when `title` came from the admin panel's meta_title field. Those are
     authored as complete titles and usually already carry a brand — the ED
     category's is 「…海外医薬品通販｜メディカ丸」 — so letting the layout's
     template append the site name again produces 「…｜メディカ丸｜メディカ丸」.
     An absolute title bypasses the template and is used exactly as written,
     which is the whole point of a meta_title field. */
  titleIsComplete = false,
}) {
  const url = absoluteUrl(path);
  const desc = description || SITE.description;
  const ogImage = image || absoluteUrl('/og-default.png');

  // The root layout defines title.template = '%s｜サイト名', so the page title
  // must be the bare page-specific part — appending the site name here too
  // would duplicate it. Open Graph and Twitter do not use the template, so
  // they get the fully composed string.
  const fullTitle = titleIsComplete
    ? title
    : title ? `${title}｜${SITE.name}` : `${SITE.name}｜${SITE.tagline}`;

  return {
    title: titleIsComplete || !title ? { absolute: fullTitle } : title,
    description: desc,
    /* Only ever admin-supplied. Google ignores the keywords meta, but it is
       authored per product in the panel and costs nothing to emit. */
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: url },
    /* The deployment-wide switch wins over the per-page one. Page metadata
       replaces the layout's `robots` rather than merging with it, so without
       this check every page built here would re-assert index:true and quietly
       undo the noindex the layout had set.

       `follow: true` is kept for a page-level noIndex — facet combinations and
       the account area should still pass link equity through to the products
       they link to. A deployment that is not cleared for indexing gets
       nofollow as well, since nothing on it should be crawled at all. */
    robots: !ALLOW_INDEXING
      ? { index: false, follow: false }
      : noIndex
        ? { index: false, follow: true }
        : { index: true, follow: true },
    openGraph: {
      type,
      title: fullTitle,
      description: desc,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      images: [ogImage],
    },
  };
}

/* ==========================================================================
   CMS page metadata — Admin → SEO Pages
   ========================================================================== */

/**
 * Storefront route → the admin's `pages.page_slug`.
 *
 * The two naming schemes were invented independently and do not line up:
 * /contact is `inquiry`, /terms is `terms-of-use`, /privacy is
 * `privacy-policy`, /about is `about-us`, /pharmaceutical-law is
 * `pharmaceuticals-medical-devices-act`. Guessing one from the other is not
 * possible, so the mapping is written out.
 *
 * Only routes listed here can be edited from the admin. The panel also holds
 * rows for `browsinghistory`, `company`, `order-guide`, `product`, `blogs`,
 * `consult-doctor` and `consult-pharmacist` — pages of the OLD site that this
 * storefront has no equivalent of. They are left unmapped rather than pointed
 * at an approximate route, because a title written for a page that no longer
 * exists is not an improvement on the one we have.
 */
export const CMS_PAGE_SLUG = {
  '/': 'home',
  '/cart': 'cart',
  '/login': 'login',
  '/register': 'register',
  '/notices': 'notices',
  '/privacy': 'privacy-policy',
  '/contact': 'inquiry',
  '/faq': 'faq',
  '/terms': 'terms-of-use',
  '/about': 'about-us',
  '/about-personal-import': 'about-personal-imports',
  '/pharmaceutical-law': 'pharmaceuticals-medical-devices-act',
  '/editorial-policy': 'editorial-policy',
};

/**
 * Names this shop used to trade under, in every spelling found in the data.
 *
 * A row still containing one of these is pre-rebrand copy that was never
 * updated, and publishing it would put a competitor-era name in the browser
 * tab and the search result.
 */
const RETIRED_BRANDS = [
  'お薬ショップ',
  'オクスリショップ',
  'メディスンショップ',
  'メディシンショップ',
  '医薬品ショップ',
];

/** Whether a string still carries a retired brand name. */
function isStale(text) {
  return !!text && RETIRED_BRANDS.some((b) => text.includes(b));
}

/**
 * A page's metadata, with Admin → SEO Pages taking precedence.
 *
 * Returns a `generateMetadata` function, so a page wires itself up in one line:
 *
 *   export const generateMetadata = pageMetadata('/faq', {
 *     title: 'よくあるご質問',
 *     description: '…',
 *   });
 *
 * ## The guard, and why it is here
 *
 * As of 2026-10-09, NINETEEN of the twenty-two live rows still carry the old
 * brand — /faq's reads 「よくある質問 … | お薬ショップ」, and so do cart, login,
 * privacy, terms, about and the rest. Only `home` has been rewritten. Wiring
 * this up without a guard would, in one deploy, rename almost every page on
 * the site back to a brand we spent weeks removing, and put it in front of
 * Google at the exact moment indexing was opened.
 *
 * So a stale value is IGNORED, field by field, and the page keeps the copy it
 * declares in its own file. Each field is judged separately because the rows
 * are inconsistent — some have a clean title over a stale description.
 *
 * This is deliberately temporary. Fix a row in the admin and it takes effect
 * within TTL.seo with no code change; the guard then does nothing. It is not a
 * substitute for fixing them, it is what stops them shipping meanwhile.
 *
 * `titleIsComplete` because meta_title is authored as a whole title, brand and
 * all — letting the layout's template append the site name would produce
 * 「…｜メディカ丸｜メディカ丸」.
 *
 * @param {string} route     The storefront path, keyed into CMS_PAGE_SLUG.
 * @param {object} fallback  What buildMetadata receives when the admin has
 *                           nothing usable. `path` defaults to `route`.
 */
export function pageMetadata(route, fallback = {}) {
  return async function generateMetadata() {
    const base = { path: route, ...fallback };
    const pageSlug = CMS_PAGE_SLUG[route];
    if (!pageSlug) return buildMetadata(base);

    const { adapter } = await import('@/services/adapters');
    const remote = await adapter.getPageSeo?.(pageSlug);
    if (!remote) return buildMetadata(base);

    const title = isStale(remote.title) ? '' : remote.title;
    const description = isStale(remote.description) ? '' : remote.description;

    return buildMetadata({
      ...base,
      ...(title ? { title, titleIsComplete: true } : {}),
      ...(description ? { description } : {}),
      ...(remote.keywords && !isStale(remote.keywords) ? { keywords: remote.keywords } : {}),
    });
  };
}
