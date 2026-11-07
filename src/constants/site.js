/**
 * Medicamaru — site-wide constants.
 * Centralised so brand copy, nav and SEO defaults are never hardcoded in
 * components.
 */

export const SITE = {
  name: 'お薬らく',
  nameEn: 'お薬らく',
  tagline: '海外医薬品・ジェネリック医薬品の個人輸入通販',
  description:
    'お薬らくは、海外医薬品・ジェネリック医薬品・サプリメントの個人輸入をサポートする通販サイトです。症状から探せる検索と、わかりやすい商品情報で、はじめての方も安心してご利用いただけます。',
  locale: 'ja_JP',
  lang: 'ja',
  // Domain is not final — see docs/DECISIONS.md Q6. Override with NEXT_PUBLIC_SITE_URL.
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://medicamaru.example',
  currency: 'JPY',
  country: 'JP',
};

/**
 * Shipping, for MOCK MODE ONLY.
 *
 * Nothing in the live path reads flatRate or freeThreshold: postage comes from
 * the backend's `shipping_rules` bands and the free-shipping threshold from
 * the 送料無料 offer in the admin, both arriving on the cart payload. These
 * exist so the mock adapter can produce a believable cart.
 *
 * Kept equal to what live actually charges — ¥782 below the threshold, free at
 * ¥5,000 — because a fixture that disagrees with production teaches the wrong
 * numbers to whoever is reading the UI in mock mode. They were ¥780 and
 * ¥10,000, matching neither.
 */
export const SHIPPING = {
  flatRate: 782,
  freeThreshold: 5000,
  estimateLabel: '通常10〜14日で発送予定',
};

/**
 * The operator, for documents that have to name a seller — currently the
 * printable order statement.
 *
 * Most of these facts are also stated on /about under 事業者情報, which remains
 * the editorial source for that page (src/content/legal/about.js says it is
 * edited only there). This is the structured copy, for templates that need the
 * fields individually rather than as rendered prose. Change one and check the
 * other.
 *
 * `phone` is the exception: it was removed from /about on 2026-10-08 and is
 * still printed on the order statement, which is a private document sent to
 * the customer rather than a public listing. If it should come off that too,
 * it is the only place left that reads this field.
 */
export const OPERATOR = {
  name: 'SENSE PHARMACEUTICALS',
  representative: 'Dr. Brajesh Bharadwaj',
  address: '44, Regal Building, New Delhi-110001',
  phone: '+91 7357 374 396',
  email: 'info@medicamaru.com',
  supportHours: '10:00〜18:00',
};

/**
 * Sort options. Adapted from okusuritsuhan's 7-option set, with readable
 * keys instead of their cryptic `DON=priceLowToHigh` scheme.
 */
export const SORT_OPTIONS = [
  { key: 'recommended', label: 'おすすめ順' },
  { key: 'price_asc', label: '価格が安い順' },
  { key: 'price_desc', label: '価格が高い順' },
  { key: 'rating_desc', label: 'レビュー評価が高い順' },
  { key: 'popular', label: '人気順' },
  { key: 'newest', label: '新着順' },
];

export const PER_PAGE_OPTIONS = [20, 50, 100];
export const DEFAULT_PER_PAGE = 20;

/**
 * Trust signals. In this market payment and safety reassurance is primary
 * content, not decoration — cocoro-kusuri gives payment methods their own
 * top-level nav, and net-kusuri/osakadou both run dedicated safety blocks.
 */
export const TRUST_POINTS = [
  { icon: 'shield', title: '正規品保証', body: '取扱商品はすべて正規品です。' },
  { icon: 'lock', title: '安心のSSL通信', body: '個人情報は暗号化して送信されます。' },
  { icon: 'package', title: '匿名配送', body: '中身のわからない梱包でお届けします。' },
  { icon: 'support', title: '購入前後のサポート', body: 'ご不明な点はお問い合わせください。' },
];
