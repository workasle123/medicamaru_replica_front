/**
 * Medicamaru — backend → frontend shape mapping.
 *
 * The live API returns Laravel model rows more or less verbatim: snake_case,
 * numeric strings for money, foreign keys where names would be more useful.
 * Everything above the service layer speaks the types in `lib/types.js`, so
 * this module is the single seam where those two vocabularies meet.
 *
 * Verified against https://adminpanel.medicamaru.com on 2026-08-13.
 */

import { SITE } from '@/constants/site';
import { htmlToText, richTextHtml } from '@/lib/sanitize';
import { productSlug } from '@/lib/product-url';

/** Uploads are served from /storage, verified: /storage/products/*.webp → 200 */
const STORAGE_BASE = (
  process.env.MEDIA_BASE_URL || 'https://adminpanel.medicamaru.com/storage'
).replace(/\/$/, '');

/** `products/foo.webp` → `https://…/storage/products/foo.webp` */
export function mediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${STORAGE_BASE}/${String(path).replace(/^\/+/, '')}`;
}

/**
 * Product description HTML, with its image sources resolved.
 *
 * POST /v2/api/products/description-image stores an upload and hands back a
 * RELATIVE src (`/storage/descriptions/<sha256>.webp`) so the stored HTML does
 * not name the host it was written on — the admin panel has moved domains once
 * already, and an absolute URL baked into 3,000 descriptions is 3,000 places to
 * change. Resolving it here is the other half of that bargain: the storefront
 * serves no /storage of its own.
 *
 * Only `/storage/` is rewritten. An absolute src that is already a full URL is
 * left alone, so older descriptions written before this endpoint still render.
 *
 * ⚠️ This does NOT sanitise. The HTML still reaches dangerouslySetInnerHTML as
 * the admin panel stored it — see ProductContent.jsx. The write endpoint strips
 * script/handler/style markup on the way in, but anything already in the table
 * predates that.
 */
function descriptionHtml(raw) {
  return String(raw ?? '').replace(
    /(\ssrc\s*=\s*["'])\/storage\//gi,
    `$1${STORAGE_BASE}/`
  );
}

/** Money arrives as strings ("2230.00"). Yen has no minor unit. */
const yen = (v) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

const int = (v, fallback = 0) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

/* The URL shape lives in lib/product-url.js — no imports there, so it can be
   run and checked on its own. Re-exported here because every call site that
   builds a product link already imports from this module. */
export { productSlug, productIdFromSlug } from '@/lib/product-url';

/**
 * @param {object} raw
 * @returns {import('@/lib/types').Category}
 */
export function normaliseCategory(raw, extra = {}) {
  return {
    id: raw.id,
    slug: raw.slug || String(raw.id),
    name: raw.category_name || raw.category_name_english || '',
    nameEnglish: raw.category_name_english || undefined,
    description: stripTags(extra.description ?? raw.category_desc) || undefined,
    productCount: extra.productCount,
    /* The admin panel's display order. The API already sorts by it, so this is
       carried for legibility and so a caller can re-sort without losing it. */
    orderNo: raw.order_no ?? null,
    /* Admin-authored SEO copy. Present only once the backend selects these
       columns; until then the category page falls back to the /category-seo
       endpoint. Previously never mapped at all, which is why the page's
       `category.metaTitle || …` always took the fallback branch. */
    metaTitle: raw.meta_title || undefined,
    metaDescription: raw.meta_description || undefined,
    metaKeywords: raw.meta_keywords || undefined,
    /* The admin-uploaded category icon. It used to read category_image, which the
       categories endpoint never selected -- so this was always null -- and which
       holds product box photography rather than icon artwork anyway.
       mediaUrl returns null for an empty path, so a category without an icon gets
       the tile's placeholder rather than a broken image. */
    iconUrl: mediaUrl(raw.category_icon),
    children: extra.children,
  };
}

/**
 * @param {object} raw
 * @returns {import('@/lib/types').Category}
 */
export function normaliseSubcategory(raw, parent) {
  return {
    id: raw.id,
    slug: raw.slug || String(raw.id),
    name: raw.subcategory_name || raw.subcategory_name_english || '',
    nameEnglish: raw.subcategory_name_english || undefined,
    parent: parent ? { slug: parent.slug, name: parent.name } : undefined,
  };
}

/**
 * Variants are the purchasable unit.
 *
 * `quantity_per_variant` is the number of PACKS (1 bottle, 2 bottles), while
 * `product_unit_pack` is the units inside one pack (60 ml). Total units is
 * the product of the two — which is what per-unit pricing must divide by.
 */
function normaliseVariant(raw, product) {
  const packsInVariant = int(raw.quantity_per_variant, 1);
  const unitsPerPack = Number.parseFloat(product.product_unit_pack) || 1;
  const totalUnits = Math.round(packsInVariant * unitsPerPack) || 1;

  const listPrice = yen(raw.base_price);
  const price = yen(raw.discount_price ?? raw.base_price);
  const discountPct = listPrice > price
    ? Math.round(((listPrice - price) / listPrice) * 100)
    : 0;

  return {
    id: raw.id,
    productId: raw.product_id,
    pack: totalUnits,
    unitLabel: product.unit_type_name || '個',
    packLabel: raw.name || `${packsInVariant}`,
    price,
    listPrice,
    discountPct,
    unitPrice: yen(raw.discount_price_per_unit ?? raw.actual_price_per_unit) || Math.round(price / totalUnits),
    points: int(raw.reward_points, 0),
    /* The cap in BASE UNITS, as the backend stores it. undefined, not 99, when
       there is no cap: CommonHelper::getNumberOfDeliveries treats
       subscription_limit > 0 as "has a cap", so a default of 99 invented one
       for every product that has none. */
    purchaseLimit: int(product.subscription_limit, 0) || undefined,
    /* Base units in ONE of this variant, so a pack count can be compared
       against the cap. The two are different things — the cap counts tablets,
       the quantity counts sheets — and comparing them directly asks whether 3
       sheets is more than 30 tablets.

       The branch mirrors CommonHelper::getNumberOfDeliveries line for line:
       with a unit type on the product the variant quantity IS the unit count,
       otherwise it multiplies by the units inside one pack. The cart already
       carries the same field for the same reason; diverging here would make
       the product page warn at a different point from the delivery split it
       is warning about. */
    unitsPerVariant:
      (product.product_unit_type_id1
        ? packsInVariant
        : Math.round(packsInVariant * unitsPerPack)) || 1,
    // No per-variant stock flag is exposed; product_status gates the product.
    inStock: int(product.product_status, 1) === 1,
  };
}

/**
 * The brand on a card: the product's manufacturer.
 *
 * `product_manufacturer` is only an id (205). The listing endpoints resolve it
 * to `manufacturer_name` and the detail endpoint carries the whole account as
 * `manufacturer`, so both shapes are read here. Manufacturers are user
 * accounts, and a few are placeholders named "NOT APPLICABLE" — no brand at
 * all is better on a card than that.
 *
 * @param {object} raw
 * @returns {string}
 */
function manufacturerName(raw) {
  const name = String(
    raw.manufacturer_name ?? raw.manufacturer?.company_name ?? raw.manufacturer?.first_name ?? ''
  ).trim();

  return /^not applicable$/i.test(name) ? '' : name;
}

/**
 * Card-sized product summary.
 * @returns {import('@/lib/types').ProductSummary}
 */
export function normaliseProductSummary(raw) {
  const variants = (raw.variants ?? []).map((v) => normaliseVariant(v, raw));
  const image = pickImage(raw);
  const packs = pickPackImages(raw);

  /* Fall back to the product-level price when a row carries no variants.
     That fallback is a LAST RESORT and reads wrong when it fires:
     `product_unit_price` is the price of a whole pack, and the card prints it
     under 「／1錫あたり」. rankedProducts was the one listing still hitting
     it — a four-tablet pack at 1,850 yen advertised as 1,850 yen per tablet —
     until that endpoint started eager-loading variants like every other one.
     Kept for safety, not because anything should rely on it. */
  const fromPrice = variants.length
    ? Math.min(...variants.map((v) => v.price))
    : yen(raw.product_unit_price);

  const fromUnitPrice = variants.length
    ? Math.min(...variants.map((v) => v.unitPrice))
    : Math.round(Number(raw.discounted_price_per_pcs ?? raw.actual_price_per_pcs) || fromPrice);

  return {
    id: raw.id,
    sku: raw.product_id,
    slug: productSlug(raw),
    name: raw.product_name || raw.product_name_english || '',
    shortDescription: stripTags(raw.product_description).slice(0, 120),
    image: {
      url: image,
      alt: `${raw.product_name || ''}のパッケージ画像`,
      width: 600,
      height: 600,
    },
    /* The pack photos (every image after the first, in the admin's order).
       Homepage cards show the first of these that loads, never the banner. */
    packImages: packs.length
      ? packs.map((url) => ({ url, alt: `${raw.product_name || ''}のパッケージ画像`, width: 600, height: 600 }))
      : undefined,
    brand: manufacturerName(raw),
    fromPrice,
    fromUnitPrice,
    unitLabel: raw.unit_type_name || '個',
    maxDiscountPct: variants.length ? Math.max(0, ...variants.map((v) => v.discountPct)) : 0,
    inStock: int(raw.product_status, 1) === 1,
    rating: {
      average: Number.parseFloat(raw.average_rating) || 0,
      count: int(raw.reviews_count, 0),
      histogram: {},
    },
    tags: normaliseTags(raw),
    /* Exposed because the favourites page needs to offer the saved packs — its
       endpoint eager-loads exactly the variants that were wishlisted, so a
       favourite is a (product, pack) pair rather than a bare product.
       
       Computed here already for fromPrice, so this costs nothing to include.
       Listings that never read it pay only server-side memory: ProductCard is a
       Server Component, so variants reach the browser only where a Client
       Component is handed them, which is the favourites card and nowhere else. */
    variants,
    /* Which packs the customer actually saved — the favourites endpoint
       alone sends this. It preselects the right option in a list that now
       carries every pack, and names the rows to clear once the product has
       been moved into the cart. Empty everywhere else. */
    wishlistedVariantIds: Array.isArray(raw.wishlisted_variant_ids)
      ? raw.wishlisted_variant_ids.map(String)
      : [],
    /* List endpoints return only the numeric `product_category`, but the
       detail endpoint eager-loads the whole category row — so prefer the
       joined object and fall back to the bare id. Without this the name is
       empty, which shows up as a blank breadcrumb and, worse, as an empty
       `name` in the BreadcrumbList structured data. */
    category: raw.category
      ? {
          slug: raw.category.slug || String(raw.category.id ?? ''),
          name: raw.category.category_name || raw.category.category_name_english || '',
        }
      : { slug: String(raw.product_category ?? ''), name: '' },
  };
}

/**
 * Full product detail.
 * @returns {import('@/lib/types').Product}
 */
export function normaliseProduct(raw) {
  const summary = normaliseProductSummary(raw);
  const images = (raw.images ?? [])
    .filter((i) => int(i.product_image_status, 1) === 1)
    .sort((a, b) => int(a.order) - int(b.order))
    .map((i, idx) => ({
      url: mediaUrl(i.product_image),
      alt: `${raw.product_name || ''}の商品画像 ${idx + 1}`,
      width: 600,
      height: 600,
    }));

  return {
    ...summary,
    manufacturer: '',
    images: images.length ? images : [summary.image],
    variants: (raw.variants ?? []).map((v) => normaliseVariant(v, raw)),
    specs: buildSpecs(raw),
    /* 商品構成 — the salt/ingredient list, e.g. "Gokshura, Kokilaksha,
       Almond". The detail endpoint eager-loads it; list endpoints do not. */
    composition: String(raw.composition?.salt_name ?? '').trim(),
    /* Same as the category above: the joined row carries the name and slug,
       the bare column carries only an id. */
    subcategory: raw.subcategory
      ? {
          slug: raw.subcategory.slug || String(raw.subcategory.id ?? ''),
          name: raw.subcategory.subcategory_name || raw.subcategory.subcategory_name_english || '',
        }
      : undefined,
    faqs: [],
    shippingEstimate: '通常10〜14日で発送予定',
    updatedAt: raw.updated_at,
    supervisedBy: undefined,
    /* No heading. 「商品について」 used to be hardcoded here and rendered as an
       h2 above the body — which made sense when the description was one
       undifferentiated blob. The publish workflow now writes its own h2s
       (mm-h) into the HTML, so that title sat immediately above a real one and
       said less. The id stays: it is the section's anchor and the prefix every
       heading id inside the block is built from. */
    content: raw.product_description
      ? [{ id: 'about', heading: '', html: descriptionHtml(raw.product_description) }]
      : [],
    references: [],
    disclaimer:
      '本ページの情報は製品の概要を提供するものであり、医療上の助言・診断・治療に代わるものではありません。ご使用前に必ず医師にご相談ください。',
    /* The detail endpoint returns the whole product row, so all three meta
       fields arrive here already — no separate SEO request is needed for a
       product page. */
    metaTitle: raw.meta_title || undefined,
    metaDescription: raw.meta_description || undefined,
    metaKeywords: raw.meta_keywords || undefined,
  };
}

/** Only rows the API actually populated — never invent a spec row. */
function buildSpecs(raw) {
  const rows = [
    ['内容量', raw.product_unit_pack && raw.unit_type_name
      ? `${Number.parseFloat(raw.product_unit_pack)} ${raw.unit_type_name}`
      : null],
    ['区分', int(raw.is_supplement) === 1 ? 'サプリメント' : '医薬品'],
    ['配達日数目安', '通常10〜14日'],
    ['購入上限', raw.subscription_limit ? `${raw.subscription_limit}` : null],
  ];
  return rows
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label, value: String(value) }));
}

/* Order items arrive with the images relation named `active_images`, product
   endpoints call it `images`. Same rows either way, so pickImage is given
   whichever one is present rather than duplicated per caller.

   SNAKE CASE, and that is not a style choice. The relation is declared as
   `activeImages()`, but Eloquent serialises relations through
   `relationsToArray()`, which runs the name through `Str::snake()` whenever
   `$snakeAttributes` is true — and it is, by default, with no override
   anywhere in the admin panel. So the JSON key is `active_images`, and
   reading `activeImages` found nothing on every order ever rendered: the
   order detail page showed the empty placeholder for products whose images
   we had the whole time. normaliseCartLine already read the snake key, which
   is why the cart showed thumbnails and this did not.

   `activeImages` is kept as a fallback in case a future endpoint hands back
   the camel key, and costs nothing. */
function productImage(product) {
  if (!product) return null;
  const images = product.active_images ?? product.activeImages ?? product.images ?? [];
  return images.length ? pickImage({ ...product, images }) : null;
}

/* Every active image after the first, in admin order (the pack photos), or an
   empty list when the product has only one. The first is the banner-style
   picture. Images without an order number are skipped: they sort ahead of
   numbered ones and are not part of the gallery sequence. */
function pickPackImages(raw) {
  return (raw.images ?? [])
    .filter((i) => int(i.product_image_status, 1) === 1 && i.order != null)
    .sort((a, b) => int(a.order) - int(b.order))
    .slice(1)
    .map((i) => mediaUrl(i.product_image))
    .filter(Boolean);
}

function pickImage(raw) {
  const list = (raw.images ?? []).filter((i) => int(i.product_image_status, 1) === 1);
  const home = list.find((i) => int(i.is_home) === 1);
  const first = [...list].sort((a, b) => int(a.order) - int(b.order))[0];
  return mediaUrl((home ?? first)?.product_image) ?? `${SITE.url}/brand/logo-mark.png`;
}

/**
 * Tags assigned in the admin panel, via the tags ↔ product_tags relation.
 *
 * The detail endpoint eager-loads them as `product_tags`, each carrying a
 * Japanese `name` and an English `name_en`. List endpoints do not include the
 * relation, so those fall back to `product_keyword` — which is NOT a tag field:
 * it holds the product's own name in Japanese and English ("ビューティ・グレース
 * EX, BEAUTY GRACE EX"), so it yields one or two useless pseudo-tags. Real tags
 * are preferred whenever the relation is present.
 *
 * @param {object} raw
 */
function normaliseTags(raw) {
  const assigned = raw.product_tags ?? raw.tags;

  if (Array.isArray(assigned) && assigned.length) {
    return assigned
      .map((tag) => (typeof tag === 'string' ? tag : tag?.name || tag?.name_en || ''))
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  return splitKeywords(raw.product_keyword);
}

function splitKeywords(v) {
  if (!v) return [];
  return String(v)
    .split(/[,、]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

/** Trim to `max` characters on a whole character, adding an ellipsis. */
function truncate(text, max) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function stripTags(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Banner link destinations.
 *
 * ⚠️ Banner rows carry ABSOLUTE URLs, and historically they pointed at the
 * primary platform — 11 of the 12 banners that existed when this was written
 * linked to `https://medicine.shop/...`. Rendering those verbatim would send
 * Medicamaru's visitors to the other storefront on every banner click, so
 * each is re-pointed at the equivalent route here.
 *
 * A link that ALREADY points at this site is honoured as written. It was not,
 * and that was a bug: the whitelist below was drawn up for medicine.shop's
 * routes, and because our own host went through the same filter, a banner the
 * admin pointed at https://medicamaru.com/campaign or /my-account/referral
 * came back null and rendered as artwork with no link at all. Paths on our
 * own host are ours to serve — if one is wrong it should 404 and be fixed in
 * the admin, not be silently swallowed here.
 *
 * Anything genuinely external (YouTube, LINE) is left alone.
 *
 * Returns null only when there is nothing to honour: no link_url, or a
 * legacy-platform path with no counterpart here. The banner then renders as
 * artwork rather than as a link back to the page the visitor is already on.
 */
const PRIMARY_HOSTS = new Set(['medicine.shop', 'www.medicine.shop']);
const SITE_HOST = new URL(SITE.url).host;

export function rewriteBannerHref(url) {
  if (!url) return null;

  let parsed;
  try {
    parsed = new URL(url, SITE.url);
  } catch {
    return url.startsWith('/') ? url : null;
  }

  // Genuinely third-party links stay as they are.
  if (!PRIMARY_HOSTS.has(parsed.host) && parsed.host !== SITE_HOST) {
    return parsed.href;
  }

  const path = parsed.pathname.replace(/\/+$/, '') || '/';
  /* Carried through so /campaign#campaign-111 lands on the right card. */
  const suffix = parsed.search + parsed.hash;

  // /productdetail/PROD-3295 → /product/3295
  const product = path.match(/^\/productdetail\/(?:PROD-)?(\d+)$/i);
  if (product) return `/product/${product[1]}${suffix}`;

  // Ours already. Nothing to translate.
  if (parsed.host === SITE_HOST) return path + suffix;

  /* Everything below is a legacy medicine.shop URL. /category/<slug> and
     /search etc. map across unchanged.

     `offers`, `ranking`, `blogs` and `guide` were deliberately dropped from
     this list when those pages were removed. Most of those banners link to
     /offers/<id> on the source platform, and mapping them to a route that no
     longer exists would give every campaign banner a 404 — returning null
     instead renders the artwork unlinked, which Frame already handles. */
  if (/^\/(category|search|register|login|products|faq|contact|symptom)(\/|$)/.test(path)) {
    return path + suffix;
  }

  return null;
}

/* Every live offer description was written for the other storefront and still
   says so: all eight name 「お薬ショップ」 in their terms, and several link back
   to medicine.shop. This is the same bargain rewriteBannerHref already makes
   above — the content is authored in an admin panel shared with that site's
   history, and a visitor should not be told the name of a shop they are not
   on.

   A stopgap, and deliberately a narrow one: it rewrites the brand name and the
   host, nothing else. The real fix is to edit the eight descriptions in the
   admin, after which this does nothing and can go. */
const OLD_BRAND = /お薬ショップ/g;
const OLD_HOST = /\b(?:www\.)?medicine\.shop\b/g;

function rebrand(html) {
  if (typeof html !== 'string' || !html) return '';
  return html.replace(OLD_BRAND, 'お薬らく').replace(OLD_HOST, 'medicamaru.com');
}

/**
 * A campaign, from the same `banner_details` row that feeds the banners.
 *
 * The money fields need care, because they are filled in loosely. A benefit is
 * only stated when the row says one unambiguously — `discount_type` of
 * percentage or fixed, with a value above zero. Four of the eight live offers
 * have neither (a points bonus, a LINE add, a signup, a bulk-order enquiry),
 * and inventing 「¥500オフ」 out of a bare discount_price would misdescribe the
 * offer. Their title and terms say what they are.
 *
 * `offer_criteria` is left out of the UI for the same reason: 'one_time' and
 * 'period_sale_value' are the only two values in use and the second does not
 * have a meaning anyone has written down.
 *
 * @param {object} raw  A `banner_details` row
 * @returns {import('@/lib/types').Campaign}
 */
export function normaliseCampaign(raw) {
  const pct = Number(raw.discount_pct);
  const amount = Number(raw.discount_price);

  /* THE CEILING on a percentage offer, and the reason 「最大」 is honest.
     CouponService::discountFor caps the discount at this figure, so an offer
     that carries one gives 50% off a small basket and a flat ¥200 off a large
     one. Stating the percentage alone would be 景品表示法's 有利誤認 — the
     customer reads 50% and expects ¥2,500 off a ¥5,000 order.

     Null on every offer that has no cap, which is all of them until someone
     sets one, and those are unchanged. */
  const cap = Number(raw.discount_max_amount);
  const maxDiscount = Number.isFinite(cap) && cap > 0 ? cap : null;

  let benefit = null;
  if (raw.discount_type === 'percentage' && pct > 0) {
    /* The cap rides on the benefit rather than sitting beside it, so no
       caller can format the percentage without having been handed the limit
       that applies to it. */
    benefit = { kind: 'percentage', percent: pct, maxDiscount };
  } else if (raw.discount_type === 'fixed' && amount > 0) {
    /* A fixed amount is already its own ceiling — a cap on top would be a
       second number saying the same thing, and the admin form hides the
       field for this type. */
    benefit = { kind: 'fixed', amount };
  }

  /* One live offer sets the minimum to 1 — a placeholder for "no minimum",
     since the campaign it belongs to sells a tablet for ¥1. Printing
     「¥1以上のご注文」 would read as a bug rather than as a condition. */
  const min = int(raw.offer_value_min, 0);

  return {
    id: raw.id,
    position: int(raw.display_order, 0),
    title: raw.title || '',
    couponCode: raw.coupon_code || null,
    /* A referral campaign has no shared code to print — each customer's code
       is their own, on customers.referral_code, and is shown on My Page. The
       card therefore sends them there instead of showing a chip.

       Marked with `offer_type = 'referral'`, a field the coupon engine does
       not read, so flagging a banner this way changes nothing about how
       coupons are applied. Without the flag a code-less campaign is still
       dropped — that rule is right for an ordinary coupon, where an empty
       chip means somebody forgot to fill the field in. */
    isReferral: raw.offer_type === 'referral',
    startsAt: raw.offer_date_from || null,
    endsAt: raw.offer_date_to || null,
    minSpend: min >= 100 ? min : null,
    benefit,
    image: raw.asset_path
      ? { url: mediaUrl(raw.asset_path), alt: raw.title || '', width: 1400, height: 700 }
      : undefined,
    imageMobile: raw.thumbnail_path
      ? { url: mediaUrl(raw.thumbnail_path), alt: raw.title || '', width: 800, height: 420 }
      : undefined,
    html: richTextHtml(rebrand(raw.offer_desc || '')),
    isActive: int(raw.status, 0) === 1,
  };
}

/**
 * @param {object} raw  A `banner_details` row
 * @returns {import('@/lib/types').Banner}
 */
export function normaliseBanner(raw) {
  return {
    id: raw.id,
    placement: raw.banner_position,
    /** Set only for the `category` placement; null everywhere else. */
    categoryId: raw.product_category_id ?? null,
    position: int(raw.display_order, 0),
    title: raw.title || '',
    /* offer_desc holds the full campaign terms — several hundred characters
       of coupon small print. Only the opening line is banner copy. */
    subtitle: truncate(stripTags(raw.offer_desc), 90) || undefined,
    ctaLabel: undefined,
    href: rewriteBannerHref(raw.link_url),
    /* The two uploads the admin's banner form offers: 「Banner Image」 goes to
       asset_path, 「Mobile Image」 to thumbnail_path. Both come back on every
       banner endpoint — they use `->get()` with no select — so nothing had to
       change server-side to read the second one.

       The declared width/height are the sizes we ASK for, not measurements of
       the file: the endpoint sends paths only. They are not cosmetic. Next
       writes them onto the <img> as its intrinsic ratio, and a banner slot with
       auto height takes its shape from exactly that — which is why every
       desktop LINE banner has been rendering at 2:1 regardless of what was
       uploaded. LineBanner now pins its own ratio in CSS, so these only have to
       agree with the artwork spec we publish:

         desktop  1500 × 600  (2.5:1)
         mobile    900 × 440  (2.05:1)

       Both were 2:1 and 1.9:1 until the uploads were measured: the real files
       are 1976 × 796 and 368 × 180, so the boxes were the wrong shape and
       object-fit was eating the difference off the sides.

       object-fit: cover absorbs any mismatch, trimming the long edge. */
    image: raw.asset_path
      ? {
          url: mediaUrl(raw.asset_path),
          alt: raw.title || '',
          width: 1500,
          height: 600,
        }
      : undefined,
    imageMobile: raw.thumbnail_path
      ? {
          url: mediaUrl(raw.thumbnail_path),
          alt: raw.title || '',
          width: 900,
          height: 440,
        }
      : undefined,
    theme: 'primary',
    badge: raw.coupon_code || undefined,
    startsAt: raw.offer_date_from || undefined,
    endsAt: raw.offer_date_to || undefined,
    isActive: int(raw.status, 0) === 1,
  };
}

/**
 * A `symptoms` row.
 *
 * @param {object} raw
 * @returns {import('@/lib/types').Symptom}
 */
export function normaliseSymptom(raw) {
  const name = raw.symptom_name || raw.symptom_name_english || '';

  return {
    id: raw.id,
    slug: raw.slug || String(raw.id),
    name,
    nameEnglish: raw.symptom_name_english || undefined,
    /* What a chip shows. The admin's `display_name` is a short label written
       for exactly this — 「脱毛症」 in place of 「脱毛症、頭皮の健康、発毛促進」 —
       and falls back to the full string where nobody has written one. `name`
       keeps the full clinical text, which is what a product page wants. */
    label: raw.display_name || name,
    /* Which browse group it sits under. null until one is assigned, which is
       also the state in which it does not appear on /symptom at all. */
    groupId: raw.symptom_group_id ?? null,
    productCount: int(raw.product_count, 0) || undefined,
  };
}

/**
 * A browse group on 症状から探す — 「薄毛・AGA」 and the other 18.
 *
 * `symptoms` arrives nested from /home/symptom-groups and is already filtered
 * to those with visible products, so the page can render the refinement chips
 * without a second request and without checking anything itself.
 *
 * @param {object} raw
 */
export function normaliseSymptomGroup(raw) {
  return {
    id: raw.id,
    slug: raw.slug || String(raw.id),
    name: raw.group_name || raw.group_name_english || '',
    nameEnglish: raw.group_name_english || undefined,
    /* A KEY, not a file path — the storefront draws the matching outline icon
       itself so every card stays in one style. An unknown key falls through to
       the default in SymptomGroupGrid. */
    icon: raw.group_icon || undefined,
    description: raw.group_description || undefined,
    metaTitle: raw.meta_title || undefined,
    metaDescription: raw.meta_description || undefined,
    productCount: int(raw.product_count, 0) || undefined,
    symptoms: (raw.symptoms ?? []).map(normaliseSymptom),
  };
}

/**
 * A `faqs` row.
 *
 * The answer is shown as `html`, through richTextHtml — the strict allow-list
 * notices use, which rebuilds every tag without attributes — so it is safe
 * for dangerouslySetInnerHTML. It takes both shapes an answer arrives in:
 * editor HTML (Admin → FAQ now has CKEditor: lists, bold, links) and the
 * plain text typed before that, whose line breaks were flattened into one
 * run-on line — a numbered 1.–7. answer read as a single paragraph on live.
 *
 * `answer` stays plain text, for the FAQPage structured data.
 *
 * @param {object} raw
 * @returns {import('@/lib/types').Faq}
 */
export function normaliseFaq(raw) {
  const answer = String(raw.answer ?? '');
  return {
    question: htmlToText(String(raw.question ?? ''), Infinity),
    answer: htmlToText(answer, Infinity),
    html: richTextHtml(answer),
    updatedAt: raw.updateDateTime ?? null,
    isActive: int(raw.faq_status, 1) === 1,
  };
}

/**
 * One heading on the /faq page, from GET /api/faqs/groups: a `faq_groups` row
 * with its `faqs`. `icon` is a key (Admin → FAQ Groups → Icon) that the page
 * maps to a drawing; an empty or unknown key gets the question-mark icon there.
 *
 * @param {object} raw
 * @returns {import('@/lib/types').FaqGroup}
 */
export function normaliseFaqGroup(raw) {
  return {
    id: int(raw.id, 0),
    name: htmlToText(String(raw.group_name ?? ''), Infinity),
    icon: String(raw.group_icon ?? ''),
    faqs: (Array.isArray(raw.faqs) ? raw.faqs : [])
      .map(normaliseFaq)
      .filter((f) => f.question && f.answer),
  };
}

/**
 * One notice from GET /api/notices/list (Admin → Notices).
 *
 * The description is CKEditor HTML — or plain text, for a notice written before
 * the editor was added. richTextHtml handles both and is a strict allow-list,
 * so `html` is safe for dangerouslySetInnerHTML as it stands.
 *
 * `date` is the admin-chosen Notice Date. Rows written before that field
 * existed were given their creation day by the migration, and createDateTime
 * stays as the fallback for anything that still arrives undated.
 *
 * @param {object} raw
 * @returns {import('@/lib/types').Notice}
 */
export function normaliseNotice(raw) {
  const date = String(raw.noticeDate || raw.createDateTime || '').slice(0, 10);
  const description = String(raw.noticeDescription ?? '');
  return {
    id: int(raw.id, 0),
    title: htmlToText(String(raw.noticeTitle ?? ''), Infinity),
    html: richTextHtml(description),
    /* Inline tags are removed outright before htmlToText turns the rest into
       spaces: Japanese has no spaces between words, so 「ご注文は<strong>24日
       </strong>」 must not become 「ご注文は 24日 」. */
    excerpt: htmlToText(description.replace(/<\/?(?:a|strong|b|em|i|u|s|span)\b[^>]*>/gi, ''), 120),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
  };
}

/**
 * The signed-in customer, from GET /api/customer.
 *
 * The name is stored split four ways — kanji and hiragana × family and given —
 * and joined here family-first, which is the order the backend itself uses when
 * it builds `customer_name` for a login response.
 *
 * THERE IS NO `pointsBalance` HERE, deliberately. The profile row carries
 * referral amounts (`referral_amount`, `referral_applicable_value`) but no
 * loyalty-point balance — that is the wallet, read through getPoints().
 *
 * It used to be exposed as a literal 0, with a comment saying why. Two pages
 * then read it and reported 0pt to customers who had hundreds: the account
 * sidebar, and 会員情報. A field that is always wrong is worse than a missing
 * one, because a missing one is a build error and a wrong one looks fine.
 *
 * @param {object} raw  the unwrapped `results.data` object
 */
export function normaliseCustomer(raw) {
  if (!raw) return null;

  const join = (family, given) => [family, given].filter(Boolean).join(' ');

  return {
    id: int(raw.id),
    customerId: raw.customer_id ?? null,
    email: raw.customer_email ?? '',
    name: join(raw.last_name_kanji, raw.first_name_kanji),
    nameKana: join(raw.last_name_hiragana, raw.first_name_hiragana) || undefined,
    nickname: raw.nickname ?? null,
    /* The romanised name, split rather than joined: 会員情報 edits the two
       halves separately, so joining here would mean splitting it again on a
       space that may not be where the names divide. */
    familyNameEnglish: raw.last_name_english ?? '',
    givenNameEnglish: raw.first_name_english ?? '',
    phone: raw.customer_phone ?? '',
    /* Defaults to Japan for the customers whose row predates the column. */
    phoneCountry: raw.customer_phone_country || '+81',
    dob: raw.customer_dob ?? null,
    gender: raw.customer_gender ?? null,
    referralCode: raw.referral_code ?? null,
    /* The referral terms, as written onto THIS customer at registration from
       the `referral_points` setting — not constants. An account opened when
       the setting was different carries the older figures, so the referral
       panel states these rather than a number of its own.

       referralAmount is what the REFERRER is paid; referralApplicableValue is
       the order total the referred customer has to reach first. */
    referralAmount: yen(raw.referral_amount) || null,
    referralApplicableValue: yen(raw.referral_applicable_value) || null,
  };
}

/**
 * One customer review.
 *
 * The backend returns only rows with `status = 1`, so anything reaching here
 * has been through moderation; nothing is filtered again on this side.
 *
 * The author is the customer's NICKNAME and nothing else. The relation also
 * carries first_name_kanji and last_name_kanji, and a review page is not the
 * place to print a customer's real name — so they are deliberately dropped
 * rather than used as a fallback. A row with no nickname shows 「ご利用者」.
 *
 * `attachment` is a path on the public storage disk, not a URL, so it goes
 * through mediaUrl like every other uploaded image.
 *
 * @param {object} raw  a `product_reviews` row with its `customer` relation
 * @returns {import('@/lib/types').ProductReview}
 */
export function normaliseReview(raw) {
  const rating = int(raw?.rating, 0);

  return {
    id: raw?.product_review_id ?? String(raw?.id ?? ''),
    /* Clamped, not trusted. The write endpoint only bounded this to 1–5 in
       October 2026, so older rows can hold anything the column allowed, and a
       star display cannot draw a 9. */
    rating: Math.min(5, Math.max(0, rating)),
    comment: raw?.comment ?? '',
    author: raw?.customer?.nickname || 'ご利用者',
    createdAt: raw?.created_at ?? null,
    image: raw?.attachment ? mediaUrl(raw.attachment) : null,
  };
}

/**
 * The referral panel's data.
 *
 * `referral_link` from the backend is dropped on purpose. It is built with
 * Laravel's `url()`, so it resolves against the ADMIN host and hands the
 * customer https://adminpanel.medicamaru.com/register?ref=... — a page that
 * does not exist there. The storefront composes its own from the code.
 *
 * `referred_users` are the people this customer brought in; `referree_users`
 * is the one person who brought THEM in. The backend's naming reads as the
 * reverse of what it means, so both are renamed here rather than carried
 * through to be misread at the call site.
 *
 * @param {object} raw  the unwrapped `data` object from /customer/my-referrals
 */
export function normaliseReferrals(raw) {
  const person = (u) => ({
    name: [u?.last_name_kanji, u?.first_name_kanji].filter(Boolean).join(' ') || 'ご利用者',
    joinedAt: u?.created_at ?? null,
  });

  return {
    code: raw?.referral_code ?? null,
    /** People this customer referred. */
    referred: (Array.isArray(raw?.referred_users) ? raw.referred_users : []).map(person),
    /** The one person who referred this customer, if any. */
    referredBy: (Array.isArray(raw?.referree_users) ? raw.referree_users : []).map(person)[0] ?? null,
  };
}

/**
 * Order status. `orders.order_status` is enum('Pending','Processing',
 * 'Completed','Cancelled') and `payment_status` tracks payment separately, so
 * an unpaid order reads "Pending / Pending" and a cancelled one keeps whatever
 * payment state it reached. The customer-facing label follows order_status,
 * except that an unpaid Pending order is described as awaiting payment —
 * which is the thing the customer can actually act on.
 */
/* orders.payment_status, which is its own ENUM and not a subset of
   order_status. 'Pay Later' is the 後払い option; it is a promise to pay, so it
   reads as outstanding rather than settled. */
const PAYMENT_STATUS_LABELS = {
  Paid: 'お支払い済み',
  Pending: 'お支払い待ち',
  Processing: 'お支払い確認中',
  Failed: 'お支払い失敗',
  Refunded: '返金済み',
  'Pay Later': '後払い',
};

const ORDER_STATUS_LABELS = {
  Pending: 'ご注文受付',
  Processing: '準備中',
  Completed: '発送済み',
  Cancelled: 'キャンセル',
};

/**
 * An order in the account's history, from GET /api/orders/allOrderList.
 *
 * @param {object} raw
 */
/**
 * The bank account the customer must transfer INTO, from the gateway response.
 *
 * ALIJ is a furikomi gateway: it issues a VIRTUAL ACCOUNT per transaction and
 * attributes the money by which account receives it. Two orders never share a
 * `bankNo`, so this cannot be a static "our bank details" block in a template —
 * it has to come from the order.
 *
 * Returns null when there is no successful transaction, which is the correct
 * outcome for a failed payment: showing an account number then would invite a
 * transfer that could never be matched to anything.
 */
function normaliseBankTransfer(raw) {
  const rows = raw.transaction_history ?? raw.transactionHistory ?? [];
  const list = Array.isArray(rows) ? rows : [rows];

  // Newest first — a retried payment issues a fresh account and the old one
  // stops being the right place to send money.
  const row = list
    .filter((t) => t && Number(t.response?.state) === 1 && t.response?.bankNo)
    .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))[0];

  if (!row) return null;

  const r = row.response;
  return {
    transactionId: row.transaction_id ?? r.transactionId ?? null,
    bankName: r.bankName ?? '',
    bankCode: r.bankCode ?? '',
    branchName: r.branchName ?? '',
    branchCode: r.branchCode ?? '',
    accountType: r.bankType ?? '',
    accountNumber: r.bankNo ?? '',
    accountHolder: r.bankAccountName ?? '',
    // What to transfer. The gateway was handed the derived total, so this is
    // the figure it expects to receive.
    amount: yen(row.gateway_amount ?? row.total_amount),
  };
}

/**
 * The same transfer details straight from a checkout response, before any
 * transaction row can be read back: POST /checkout/placeOrder answers with the
 * gateway's reply under `payment`. Same rules — null unless it succeeded.
 *
 * @param {object} payment  The gateway reply.
 * @param {number} amount   What the gateway was asked to collect.
 */
export function bankTransferFromGateway(payment, amount) {
  return normaliseBankTransfer({
    transaction_history: [{ id: 0, response: payment, gateway_amount: amount }],
  });
}

/**
 * The recipient, from the order's `address` column.
 *
 * That column is a longtext JSON SNAPSHOT written at checkout, not a foreign
 * key — which is what makes it right for an invoice. A customer who edits
 * their address book afterwards has not changed where last month's parcel
 * went, and this still says where it went.
 *
 * `address_line_1` is composed at checkout as `[city, street]` joined, so the
 * separate `city` key is already inside it. Printing both would repeat the
 * city on every invoice, so only line 1 and line 2 are read back.
 *
 * Returns null when the column is empty or holds something that is not JSON —
 * old rows predate this shape, and an invoice without a name block is better
 * than one that throws.
 *
 * @param {string|object|null} raw  the `address` column
 */
function orderShipTo(raw) {
  if (!raw) return null;

  let a = raw;
  if (typeof raw === 'string') {
    try {
      a = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!a || typeof a !== 'object') return null;

  /* Family name first, the order the backend itself uses. Guest checkout
     writes the whole name into first_name_kanji and leaves last_name_kanji
     null, so this has to tolerate either shape. */
  const name = [a.last_name_kanji, a.first_name_kanji].filter(Boolean).join(' ');

  return {
    name: name || '',
    email: a.email ?? '',
    phone: a.tel ?? '',
    postalCode: a.zip_code ?? '',
    prefecture: a.state ?? '',
    line1: a.address_line_1 ?? '',
    line2: a.address_line_2 ?? '',
    country: a.country ?? '',
  };
}

/**
 * What each kind of wallet row is called in Japanese.
 *
 * The keys are the `amount_type` ENUM on wallet_transaction_history, and all
 * eight are written by the backend — none of this is aspirational:
 * UserService credits purchase, first order, review, login, anniversary and
 * email verification, and UpdateReferralInfo credits referral and register.
 *
 * 'first order' and 'email verification' have spaces in them. Those are the
 * column values, not typos.
 */
const POINT_REASONS = {
  purchase: 'お買い物',
  'first order': '初回ご注文',
  review: 'レビュー投稿',
  login: 'ログインボーナス',
  anniversary: '会員登録記念日',
  referral: 'ご紹介',
  register: '会員登録',
  /* Settings → Points has offered these since that screen was built and
     nothing ever paid them; UserService::creditEmailVerificationPoints does
     now, so the reason needs a name here or the row reads 「ポイント調整」. */
  'email verification': 'メールアドレス確認',
};

/**
 * One row of the points wallet, from GET /api/home/loyalty_points.
 *
 * `amount` is the points, not yen — the wallet stores them 1:1 and the cart
 * spends them 1pt = 1円, which is why the balance is a SUM over this column.
 * `loyalty_points` sits beside it and is not what the balance is built from,
 * so it is deliberately not read here.
 *
 * `transaction_type` decides the sign: a debit is points spent on an order.
 * Stored unsigned, so the sign is applied here rather than left to the UI to
 * remember.
 */
export function normalisePointEntry(raw) {
  const type = raw.transaction_type === 'debit' ? 'debit' : 'credit';
  const points = yen(raw.amount);

  return {
    id: String(raw.id ?? ''),
    type,
    /* Signed, so a list can be summed or rendered without re-deriving it. */
    points: type === 'debit' ? -points : points,
    reasonKey: raw.amount_type ?? null,
    reason: POINT_REASONS[raw.amount_type] ?? 'ポイント調整',
    /* Set only on rows tied to an order; the account page links to it. */
    orderNumber: raw.order_number || raw.order?.order_number || null,
    orderId: raw.order_id ? String(raw.order_id) : null,
    /* A review credit names the product it was written for. */
    productName: raw.review?.product?.product_name ?? null,
    createdAt: raw.created_at ?? null,
  };
}

export function normaliseOrderSummary(raw) {
  const items = raw.order_items ?? raw.orderItems ?? [];
  const status = raw.order_status ?? 'Pending';
  const unpaid = String(raw.payment_status ?? '').toLowerCase() === 'pending';

  return {
    /* The ROW id. The detail route is /orders/details/{order}/{cusid} with
       route-model binding, which resolves {order} by primary key — an order
       number there resolves to nothing and 404s. */
    id: String(raw.id ?? ''),
    /* What the customer actually recognises, and what appears on their
       confirmation. Shown in the UI; never used for routing. */
    orderNumber: raw.order_number ?? String(raw.id ?? ''),
    placedAt: raw.created_at ?? null,
    status,
    statusLabel:
      status === 'Pending' && unpaid ? 'お支払い待ち' : (ORDER_STATUS_LABELS[status] ?? status),
    /* The payment column, separately from the order status. A printable
       statement has to say whether the money arrived, and `statusLabel` folds
       that into one word only for a Pending order. */
    paid: String(raw.payment_status ?? '').toLowerCase() === 'paid',
    paymentLabel: PAYMENT_STATUS_LABELS[raw.payment_status] ?? 'お支払い待ち',
    /* THE RAW COLUMNS, carried through for the progress bar.
       `status`/`statusLabel` above collapse three independent columns into one
       word, which is why marking an order Dispatched in the admin panel
       changed nothing a customer could see: `delivery_status` was not read
       anywhere in the storefront, and `order_status` had not moved. The panel
       tracks ordering, payment and delivery separately and the customer's view
       has to as well. Both are nullable on rows that predate the columns. */
    paymentStatus: raw.payment_status ?? null,
    deliveryStatus: raw.delivery_status ?? null,
    itemCount: items.reduce((sum, i) => sum + int(i.quantity, 0), 0),
    subtotal: yen(raw.order_amount),
    // Coupon and point reductions are separate columns; the account page shows
    // one combined discount line.
    discount: yen(raw.coupon_discount) + yen(raw.point_discount),
    shipping: yen(raw.postage_amount),
    total: yen(raw.total_amount),
    pointsEarned: int(raw.total_points, 0),
    /* Null unless a payment actually succeeded — see normaliseBankTransfer. */
    bankTransfer: normaliseBankTransfer(raw),
    /* Set once the parcel is handed over. Empty for everything before that,
       which is most of an order's life, so the UI must not assume one.

       `tracking_numbers` is the backend's merged list and is what to read:
       the number is typed on the logistics screen, which writes the DELIVERY
       row, so `tracking_number` on the order was null on every order in the
       panel and this page showed nothing for parcels we had numbers for. The
       old field is still read as a fallback for a backend that predates the
       list.

       A list, not one value: a split shipment has a number per parcel, and
       showing the first tells someone waiting on two boxes that the other is
       lost. */
    trackingNumbers: Array.isArray(raw.tracking_numbers)
      ? raw.tracking_numbers.map((n) => String(n).trim()).filter(Boolean)
      : [raw.tracking_number].map((n) => String(n ?? '').trim()).filter(Boolean),
    /* The shop's own invoice number and date, written when the order is
       invoiced. Both null until then — an invoice view falls back to the order
       number rather than printing an empty field. */
    invoiceNo: raw.invoice_no || null,
    invoiceDate: raw.invoice_date || null,
    /* Where it was sent, snapshotted at checkout. Null on rows whose column
       predates the JSON shape — see orderShipTo. */
    shipTo: orderShipTo(raw.address),
    lines: items.map((item) => ({
      productId: String(item.product_id ?? ''),
      slug: productSlug(item.product),
      productName: item.product?.product_name ?? '',
      packLabel: item.product_variant?.name ?? '',
      quantity: int(item.quantity, 1),
      unitPrice: yen(item.price),
      lineTotal: yen(item.total_price),
      /* The detail endpoint eager-loads orderItems.product.activeImages, so a
         past order can show what was bought rather than a list of names. The
         list endpoint does not, and null simply renders no thumbnail. */
      image: productImage(item.product),
    })),
  };
}

/**
 * One row of `carts`, as returned by POST /api/cart/listProducts.
 *
 * `id` is the CART ROW id and it matters: the update and remove endpoints are
 * keyed on it, not on the product or the variant. Sending a variant id there
 * addresses the wrong row — or, before those endpoints were scoped to a cart,
 * somebody else's row.
 *
 * @param {object} raw
 */
export function normaliseCartLine(raw) {
  const product = raw.product ?? {};
  const variant = raw.product_variant ?? {};
  const image = (product.active_images ?? product.activeImages ?? [])[0];

  return {
    // The cart row — what update/remove address.
    id: String(raw.id),
    productId: String(raw.product_id ?? product.id ?? ''),
    variantId: String(raw.product_variant_id ?? variant.id ?? ''),
    // No slug column exists; the product route takes the numeric id.
    slug: productSlug(product),
    productName: product.product_name ?? '',
    packLabel: variant.name ?? '',
    quantity: int(raw.quantity, 1),
    unitPrice: yen(raw.price),
    lineTotal: yen(raw.total_price),
    points: int(raw.loyality_points, 0),
    /* `subscription_limit` on the product is the purchase cap in base units.
       The cart's own `subscription_limit` string ("4 まで ボトル") is display
       copy, so the numeric one is what the quantity input can use. */
    purchaseLimit: int(product.subscription_limit, 0) || undefined,
    limitLabel: raw.subscription_limit || undefined,
    /* Units in ONE cart unit, so the cap can be compared against the right
       thing. The cap counts base units; `quantity` counts packs. Comparing
       them directly — which the stepper used to do — asks whether 1 bottle is
       more than 30 tablets.

       The branch mirrors CommonHelper::getNumberOfDeliveries exactly: with a
       unit type on the product the variant quantity IS the unit count,
       otherwise it multiplies by the units inside one pack. Divergence here
       would mean the warning fires at a different point from the delivery
       split it warns about. */
    unitsPerVariant:
      (product.product_unit_type_id1
        ? int(variant.quantity_per_variant, 1)
        : Math.round(
            int(variant.quantity_per_variant, 1) *
              (Number.parseFloat(product.product_unit_pack) || 1)
          )) || 1,
    /* The split state of THIS row, as the backend holds it.

       `delivery_type` decides whether a split happens at all: CheckoutController
       ::deliveriesCountFor returns 1 for 'one_time' before it looks at the cap,
       so an over-limit row still ships as one parcel until the customer asks
       otherwise. `deliveries_count` is what the backend settled on.

       `may_be_delivery_count` is the useful one for the toggle: Cart.php
       computes it on EVERY row from getNumberOfDeliveries regardless of the
       type, so it answers "what would this become if split" while the row is
       still one_time — which is what the control has to say before it is used.
       Defaulted to the row's own count rather than 1, since an older backend
       that does not send it would otherwise report no split for a row that has
       one. */
    deliveryType: raw.delivery_type === 'recurring' ? 'recurring' : 'one_time',
    deliveriesCount: int(raw.deliveries_count, 1) || 1,
    mayBeDeliveryCount:
      int(raw.may_be_delivery_count, 0) || int(raw.deliveries_count, 1) || 1,
    image: {
      url: mediaUrl(image?.product_image) ?? `${SITE.url}/brand/logo-mark.png`,
      alt: product.product_name ?? '',
    },
  };
}

/**
 * The cart envelope. Every figure here is the backend's own arithmetic —
 * nothing in the frontend adds up a total (brief §17).
 *
 * The response nests as `{ message, code, results: { data: {...}, ... } }`,
 * and `results.data` holds the items and the money while sibling keys on
 * `results` hold the coupon and points state.
 *
 * @param {object} raw  the unwrapped `results` object
 * @param {string|null} sessionId
 */
export function normaliseCart(raw, sessionId = null) {
  const data = raw?.data ?? {};
  const lines = (data.cart_items ?? []).map(normaliseCartLine);
  const coupon = raw?.appliedCoupon ?? {};

  const subtotal = yen(data.cart_total);
  const shipping = yen(data.shipping_amount);
  /* `discount` is a parallel array to `discount_type` — coupon, points and
     referral each contribute a row. Summed rather than picked, so a cart with
     more than one active discount is not under-reported. */
  const discount = (data.discount ?? []).reduce((sum, d) => sum + yen(d), 0);

  return {
    sessionId,
    lines,
    subtotal,
    discount,
    shipping,
    // Recomputed the same way the backend does at checkout, and clamped: a
    // discount larger than the goods must not produce a negative total.
    total: Math.max(0, subtotal + shipping - discount),
    pointsEarned: int(data.total_points, 0),
    /* 送料無料 progress, from the offer configured in the admin.
       Both are NULL when no free-shipping offer is running, and null — not 0 —
       is what tells the cart to say nothing: 0 means "you have reached it",
       which is a very different message from "there is no such offer". For
       years there was no threshold in the API at all (`shipping_amount` is the
       fee that applies, `highest_shipping_amount` the dearest band, neither a
       target to spend up to), so this was pinned at 0 and the nudge could
       never render. */
    freeShippingThreshold:
      data.free_shipping_threshold == null ? null : yen(data.free_shipping_threshold),
    amountToFreeShipping:
      data.amount_to_free_shipping == null ? null : yen(data.amount_to_free_shipping),
    appliedCoupon: coupon.coupon_code ?? null,
    /* The banner row behind the code. Removal is keyed on it and nothing
       else in the payload carries it, so a cart could show an applied
       coupon with no way to ask for it to be taken off. */
    couponBannerId: coupon.banner_id ?? null,
    couponDiscount: yen(coupon.coupon_discount),
    couponLabel: coupon.coupon_code
      ? `${coupon.coupon_code}（−${yen(coupon.coupon_discount)}円）`
      : null,
    pointsApplied: yen(raw?.pointDiscountData?.extraPointDiscount),
    /* Points are a wallet — the balance is SUM(credit) − SUM(debit) over
       wallet_transaction_history — and 1 point spends as 1 yen.
       `maxUseWallet` is the backend’s own cap:
       min(balance, cart × point_usages%, cart − couponDiscount). It moves
       whenever the cart or the coupon changes, so it is read, never
       recomputed here. */
    pointsBalance: yen(raw?.userWalletBalance),
    maxPointsUsable: Math.floor(yen(raw?.maxUseWallet)),
    /* Admin kill switches; earning and redeeming are separately disabled. */
    pointsRedeemDisabled: Boolean(Number(raw?.stop_points_redeem ?? 0)),
    pointsEarningDisabled: Boolean(Number(raw?.stop_points_earning ?? 0)),
  };
}

/** `{current_page, per_page, total, last_page}` → our Paginated envelope. */
export function normalisePagination(p = {}, itemCount = 0) {
  return {
    page: int(p.current_page, 1),
    perPage: int(p.per_page, itemCount || 20),
    total: int(p.total, itemCount),
    totalPages: int(p.last_page, 1),
  };
}
