import { absoluteUrl, ALLOW_INDEXING } from '@/lib/seo';

/**
 * robots.txt
 *
 * Disallow rules mirror the pages that emit `noindex` — commerce funnel,
 * account area, and internal search. Keeping the two in step matters: a page
 * blocked in robots.txt can still be indexed from external links, because the
 * crawler is forbidden from fetching it and therefore never sees the noindex
 * tag. Belt and braces here is deliberate, not redundant.
 *
 * Filtered catalogue URLs are NOT disallowed. They are `noindex, follow`, so
 * crawlers should still be able to fetch them and follow the product links
 * they contain — blocking them would waste that internal linking.
 */
export default function robots() {
  /* A deployment that is not cleared for indexing blocks everything, and offers
     no sitemap — pointing crawlers at a list of URLs they are told not to fetch
     is at best noise and at worst an invitation.

     The meta tag alone is not enough in the other direction either: a crawler
     that reaches a page from an external link will index it on that basis, so
     both this and the tag are needed. */
  if (!ALLOW_INDEXING) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/cart',
          '/checkout',
          '/my-account',
          '/wishlist',
          '/login',
          '/register',
          '/forgot-password',
          /* Was missing. It is noIndex like every other auth page, and it
             carries a single-use token from the reset email in its URL — the
             one page here whose address is worth keeping out of an index for
             more than tidiness. */
          '/reset-password',
          '/search',
          '/api/',
          /* Six sort orders multiply every category, subcategory and symptom
             listing by six, and each of those URLs is a server-rendered
             request against a database capped at 100 concurrent connections.
             A sorted view contains exactly the same products as the default
             one, so nothing is reachable only through it.

             `page=` and `tag=` are deliberately NOT blocked: those reach
             products the first page does not. */
          '/*sort=',
          /* WordPress's own plumbing, proxied under /column. The articles are
             the point; the login form and the XML-RPC endpoint are not, and
             both attract bots that have no business here. */
          '/column/wp-admin/',
          '/column/wp-login.php',
          '/column/xmlrpc.php',
        ],
        /* Google ignores this; Bing, Yandex and most of the long tail honour
           it. Catalogue pages are server-rendered on every request, and the
           database behind them allows 100 connections at once — two seconds
           between hits costs nothing and removes a whole class of bad
           afternoon. */
        crawlDelay: 2,
      },
    ],
    /* Two sitemaps: ours, and WordPress's own, which it generates for the
       articles we proxy. The コラム lives on this domain as far as a crawler is
       concerned, so its sitemap has to be discoverable from this robots.txt —
       nothing else links to it. Listed only when one is actually configured. */
    sitemap: process.env.COLUMN_ORIGIN
      ? [absoluteUrl('/sitemap.xml'), absoluteUrl('/column/wp-sitemap.xml')]
      : absoluteUrl('/sitemap.xml'),
  };
}
