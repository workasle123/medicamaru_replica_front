/**
 * Medicamaru — navigation structure.
 *
 * Deliberately shallow. okusuritsuhan's header exposes 257 links, which is
 * paralysing on mobile and a crawl-budget sink; we surface a curated set and
 * let the category index page carry the long tail.
 */

import { GUIDE_PATH } from '@/content/guide/medicine-guide';

/**
 * Primary desktop navigation.
 *
 * `dropdown: 'categories'` makes the item reveal the full category tree on
 * hover/focus instead of sending people to an index page to browse — the
 * homepage already carries that grid, so the click-through was redundant.
 */
import { JAPAN_POST_TRACKING } from '@/lib/tracking';

export const MAIN_NAV = [
  { href: '/category', label: 'カテゴリーから探す', dropdown: 'categories' },
  { href: '/symptom', label: '症状から探す' },
  /* Between browsing and reading: a campaign is a reason to buy, so it sits
     with the two browse routes rather than with the help links. */
  { href: '/campaign', label: 'キャンペーン' },
  { href: '/faq', label: 'よくあるご質問' },
  { href: '/contact', label: 'お問い合わせ' },
];

/** Mobile bottom tab bar — thumb-reachable, max 5 items. */
export const MOBILE_TABS = [
  { href: '/', label: 'ホーム', icon: 'home' },
  { href: '/category', label: 'カテゴリー', icon: 'grid' },
  { href: '/search', label: '検索', icon: 'search' },
  { href: '/cart', label: 'カート', icon: 'cart', badge: 'cart' },
  { href: '/my-account', label: 'マイページ', icon: 'user' },
];

/**
 * Footer columns. Four link groups beside the brand block, each with an icon
 * that labels the group at a glance rather than decorating it.
 *
 * The categories column is NOT here: it is fetched live in the footer so a
 * category added in the admin panel appears without a code change.
 */
export const FOOTER_NAV = [
  {
    heading: 'ご利用ガイド',
    icon: 'guide',
    links: [
      /* The long-form guide: what medicines are, how to read a product page,
         and the order flow end to end. First in the column because it is the
         one entry that answers a first-time visitor's questions in order —
         the pages below it answer one question each.
         Japanese slug, percent-encoded at its source so the footer and the
         canonical tag cannot point at different URLs. */
      { href: GUIDE_PATH, label: 'お薬ガイド' },
      { href: '/about-personal-import', label: '個人輸入について' },
      /* Next to 個人輸入について on purpose: the two are read together, and a
         personal-import shop that explains 薬機法 is answering the question a
         cautious customer already has. */
      { href: '/pharmaceutical-law', label: '薬機法について' },
      { href: '/faq', label: 'よくあるご質問' },
      { href: '/symptom', label: '症状から探す' },
      { href: '/campaign', label: 'キャンペーン・クーポン' },
      /* 全商品 (/products) removed 2026-09-25. The page never listed anything:
         its listing call needs a category id it was never given, so it was an
         empty result behind a link promising the whole catalogue. Browsing is
         カテゴリーから探す and 症状から探す, both of which work. */
      { href: '/contact', label: 'お問い合わせ' },
    ],
  },
  {
    heading: 'サイト情報',
    icon: 'info',
    links: [
      { href: '/about', label: '特定商取引法表記' },
      { href: '/editorial-policy', label: '編集方針' },
      { href: '/terms', label: '利用規約' },
      { href: '/privacy', label: 'プライバシーポリシー' },
    ],
  },
  {
    heading: 'サポート',
    icon: 'support',
    links: [
      { href: '/login', label: 'ログイン' },
      { href: '/register', label: '新規会員登録' },
      { href: '/my-account/orders', label: '注文履歴' },
      /* Japan Post's own tracking page. External, and marked as such so the
         footer renders a real <a> — a next/link to an absolute URL works, but
         it would not get the new tab or the rel. No number to prefill here:
         the footer has no order in context. */
      { href: JAPAN_POST_TRACKING, label: '配送状況の確認', external: true },
      { href: '/wishlist', label: 'お気に入り' },
      { href: '/cart', label: 'カート' },
    ],
  },
];

/**
 * Social accounts.
 *
 * Each renders ONLY when its url is filled in, so the row grows as accounts are
 * opened rather than shipping dead icons.
 *
 * Read from the environment, not hardcoded: adding an account is then a config
 * change on the server rather than a code change and a deploy. LINE uses the
 * same variable as the homepage banner, so that URL lives in exactly one place.
 *
 * The footer is a Server Component, so these never reach the browser bundle and
 * need no NEXT_PUBLIC_ prefix.
 */
export const SOCIAL_LINKS = [
  { key: 'line', label: 'LINE', url: process.env.LINE_ACCOUNT_URL || '' },
  { key: 'x', label: 'X', url: process.env.SOCIAL_X_URL || '' },
  { key: 'instagram', label: 'Instagram', url: process.env.SOCIAL_INSTAGRAM_URL || '' },
  { key: 'facebook', label: 'Facebook', url: process.env.SOCIAL_FACEBOOK_URL || '' },
  { key: 'youtube', label: 'YouTube', url: process.env.SOCIAL_YOUTUBE_URL || '' },
];
