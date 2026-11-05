/**
 * Medicamaru — structured data, shared nodes.
 *
 * Every page's schema lives in its own file in this folder and is built from
 * live data. This module holds only what more than one of them needs: the two
 * canonical `@id`s, the brand facts the SEO team owns, and the node builders
 * the per-page graphs assemble.
 *
 * ── The @id contract ────────────────────────────────────────────────────────
 * `#organization` and `#website` are site-wide identities, not per-page nodes.
 * Whichever page declares one, it MUST describe the same entity, because a
 * crawler merges them by id across the whole site. So the definitions live here
 * and the page files reference them — never restate them inline.
 */

import { SITE } from '@/constants/site';

/** Absolute URL for a path. Structured data must never carry a relative one. */
export function abs(path = '/') {
  const base = SITE.url.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/* The trailing slash is deliberate and matches the SEO team's documents: the
   organization and the website are identified by the site ROOT, and
   `https://medicamaru.com/#organization` is the form their graphs reference. */
export const ORG_ID = `${abs('/')}#organization`;
export const WEBSITE_ID = `${abs('/')}#website`;

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BRAND FACTS — owned by the SEO team. Edit here and nowhere else.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Public contact address, published in the Organization node. */
export const ORG_EMAIL = 'info@medicamaru.com';

/** Absolute, and a real file: public/brand/logo.png. */
export const ORG_LOGO = abs('/brand/logo.png');

/* Long-form description. Deliberately the SEO team's wording, which differs in
   its last clause from SITE.description (which feeds the meta tag). */
export const ORG_DESCRIPTION =
  'メディカ丸は、海外医薬品・ジェネリック医薬品・サプリメントの個人輸入をサポートする通販サイトです。症状から探せる検索と、わかりやすい商品情報で、はじめての方にもわかりやすい情報を提供しています。';

/* No ORG_SAME_AS. It listed x.com/medicamaru, an Instagram and a TikTok as
   the profiles proving this is the same entity across the web — a claim
   sameAs makes to Google about accounts the shop controls. Removed at
   Divyanshu's request.

   Before putting it back: every URL has to be an account that exists, is the
   shop's, and links back here. The footer already reads its social links from
   SOCIAL_X_URL and friends, which are still REPLACE_ME, so the handles above
   were never confirmed against anything. Same reasoning as the empty address
   fields below. */

/**
 * Registered address.
 *
 * The SEO team's document left these as `YOUR ACTUAL STREET ADDRESS` and the
 * like. Placeholder text must never reach a crawler, so every field is empty
 * here and `postalAddress()` drops whatever is still blank. Fill them in as the
 * 特定商取引法に基づく表記 page is written — the two have to agree.
 */
export const ORG_ADDRESS = {
  streetAddress: '',
  addressLocality: '',
  addressRegion: '',
  postalCode: '',
};

/** PostalAddress with the blanks dropped. The country is always known. */
function postalAddress() {
  const filled = Object.fromEntries(
    Object.entries(ORG_ADDRESS).filter(([, value]) => value && value.trim())
  );
  return { '@type': 'PostalAddress', ...filled, addressCountry: SITE.country };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NODE BUILDERS
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * The full site identity, as `OnlineStore` — an Organization subtype that says
 * what this site IS, rather than only that an organization exists.
 *
 * Declared on the homepage alone. Google's Organization guidance puts the
 * markup on one page, and restating it site-wide is what creates the
 * conflicting-definition problem the @id contract above describes.
 */
export function organizationNode() {
  return {
    '@type': 'OnlineStore',
    '@id': ORG_ID,
    name: SITE.name,
    alternateName: SITE.nameEn,
    url: abs('/'),
    description: ORG_DESCRIPTION,
    email: ORG_EMAIL,
    image: ORG_LOGO,
    logo: { '@type': 'ImageObject', url: ORG_LOGO, name: `${SITE.name}のロゴ` },
    address: postalAddress(),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: abs('/contact'),
      email: ORG_EMAIL,
      availableLanguage: [SITE.lang],
    },
  };
}

/**
 * The compact restatement product pages use, where the seller has to be
 * nameable without pulling the whole homepage definition in. Same `@id`, so a
 * crawler merges it with the full node rather than reading a second
 * organization.
 */
export function organizationRef() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    alternateName: SITE.nameEn,
    url: abs('/'),
    logo: { '@type': 'ImageObject', url: ORG_LOGO },
  };
}

/** The site itself, with the search box target. Homepage only. */
export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: abs('/'),
    name: SITE.name,
    inLanguage: SITE.lang,
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${abs('/search')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Named reference to the site, for `isPartOf` on an inner page. */
export function websiteRef() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE.name,
    url: abs('/'),
  };
}

/**
 * BreadcrumbList.
 *
 * `crumbs` excludes ホーム — it is prepended here so no page can forget it and
 * so position 1 means the same thing everywhere.
 *
 * @param {{name: string, href?: string}[]} crumbs
 * @param {string} [id]  `@id`, when a page node references the list.
 */
export function breadcrumbList(crumbs = [], id) {
  const all = [{ name: 'ホーム', href: '/' }, ...crumbs];

  return {
    ...(id ? { '@id': id } : {}),
    '@type': 'BreadcrumbList',
    itemListElement: all.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      /* Trimmed: the source documents carry stray leading spaces in several
         names, and a name beginning with a space is published that way. */
      name: String(crumb.name ?? '').trim(),
      ...(crumb.href ? { item: abs(crumb.href) } : {}),
    })),
  };
}

/**
 * FAQPage.
 *
 * Returns null for an empty list, and that guard is what keeps the markup
 * honest: Google requires every question in a FAQPage to be VISIBLE on the
 * page, so this is only ever handed the same array the page renders.
 *
 * @param {{question: string, answer: string}[]} faqs
 * @param {string} [id]
 */
export function faqPage(faqs, id) {
  if (!faqs?.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(id ? { '@id': id } : {}),
    inLanguage: SITE.lang,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

/** Wrap a list of nodes as one `@graph` document, dropping any that are null. */
export function graph(nodes) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean),
  };
}
