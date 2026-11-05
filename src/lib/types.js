/**
 * Medicamaru — domain type definitions.
 *
 * The project is JavaScript, so these are JSDoc typedefs. They are not
 * enforced at runtime, but they give editor autocomplete and act as the
 * written contract the backend must satisfy.
 *
 * Every field below was derived from the real medicine.shop data model
 * observed in the Phase 0 audit — not invented. When the backend replica
 * arrives, this file is the checklist to validate its responses against.
 *
 * @see docs/PHASE-0-AUDIT.md §3
 */

/**
 * A purchasable pack tier. This — not the product — is what goes in the cart.
 * medicine.shop models variants as bulk pack sizes (60/120/180/300 tablets),
 * each with its own price, discount, loyalty points and purchase limit.
 *
 * @typedef {Object} ProductVariant
 * @property {number}  id            Variant id, e.g. 23288
 * @property {number}  productId     Parent product id
 * @property {number}  pack          Units in the pack, e.g. 60
 * @property {string}  unitLabel     Unit counter, e.g. '錠' | 'カプセル' | 'ボトル'
 * @property {string}  packLabel     Display label, e.g. '1 ボトル / 60 錠'
 * @property {number}  price         Selling price in JPY (integer — yen has no minor unit)
 * @property {number}  listPrice     Pre-discount price, for strike-through
 * @property {number}  discountPct   0–100, derived server-side
 * @property {number}  unitPrice     Price per single unit, e.g. 19
 * @property {number}  points        Loyalty points earned
 * @property {number}  [purchaseLimit]  The cap in BASE UNITS (tablets, ml),
 *   not in packs. Absent when the product has no cap.
 * @property {number}  unitsPerVariant  Base units in one of this variant, so a
 *   pack count can be compared against purchaseLimit
 * @property {boolean} inStock       Stock is tracked per variant, not per product
 */

/**
 * A row in the product spec table. Rendered above the fold on the PDP —
 * the strongest pattern found in Phase 2 research.
 *
 * @typedef {Object} SpecRow
 * @property {string}  label   e.g. '有効成分'
 * @property {string}  value   e.g. 'アシュワガンダ・ゴクシュラなど'
 * @property {string} [href]   Optional deep link to a detail section
 */

/**
 * @typedef {Object} ProductImage
 * @property {string} url
 * @property {string} alt   Must never be empty — SEO and a11y requirement
 * @property {number} [width]
 * @property {number} [height]
 */

/**
 * @typedef {Object} Faq
 * @property {string} question
 * @property {string} answer   Plain text or sanitised HTML
 * @property {string} [html]  The answer as sanitised HTML (richTextHtml) — what the page shows
 * @property {string|null} [updatedAt]  Last edited in the admin (API FAQs only)
 */

/**
 * One heading on the /faq page (Admin → FAQ Groups).
 * @typedef {Object} FaqGroup
 * @property {number} id
 * @property {string} name   e.g. 「ご注文について」
 * @property {string} icon   Icon key; unknown or empty → question mark
 * @property {Faq[]} faqs
 */

/**
 * One お知らせ (Admin → Notices).
 * @typedef {Object} Notice
 * @property {number} id
 * @property {string} title
 * @property {string} html     Sanitised description (richTextHtml)
 * @property {string} excerpt  Plain-text start of the description, ≤120 chars
 * @property {string} date   YYYY-MM-DD — the admin-chosen Notice Date
 */

/**
 * One moderated customer review.
 *
 * @typedef {Object} ProductReview
 * @property {string} id
 * @property {number} rating          1–5, clamped on the way in
 * @property {string} comment
 * @property {string} author          The customer's nickname; never their name
 * @property {string|null} createdAt
 * @property {string|null} image      Absolute URL, or null
 */

/**
 * @typedef {Object} RatingSummary
 * @property {number} average         0–5, one decimal
 * @property {number} count           Total reviews
 * @property {Object<string, number>} histogram  Keyed '1'–'5' → count
 * @property {number} [recommendPct]  % who answered "satisfied"
 */

/**
 * A product summary — everything a product card needs, and nothing more.
 * Listing endpoints return this shape so grids stay light.
 *
 * @typedef {Object} ProductSummary
 * @property {number}  id
 * @property {string}  sku            e.g. 'PROD-118'
 * @property {string}  slug           SEO slug — Medicamaru uses slugs, not SKU codes
 * @property {string}  name
 * @property {string}  shortDescription  Clamped to 2 lines in the card
 * @property {ProductImage} image     Primary image only
 * @property {string}  brand
 * @property {number}  fromPrice      Cheapest variant price — displayed as `1,350円〜`
 * @property {number}  fromUnitPrice  Cheapest per-unit price — displayed as `1錠 19円〜`
 * @property {string}  unitLabel
 * @property {number}  maxDiscountPct Best discount across variants; 0 = no badge
 * @property {boolean} inStock        True if ANY variant is in stock
 * @property {RatingSummary} rating
 * @property {string[]} tags
 * @property {{slug: string, name: string}} category
 */

/**
 * Full product detail.
 *
 * @typedef {Object} Product
 * @property {number}  id
 * @property {string}  sku
 * @property {string}  slug
 * @property {string}  name
 * @property {string}  shortDescription
 * @property {string}  brand
 * @property {string}  manufacturer
 * @property {ProductImage[]} images
 * @property {ProductVariant[]} variants   Ordered cheapest → most expensive
 * @property {SpecRow[]} specs             The above-the-fold spec table
 * @property {{slug: string, name: string}} category
 * @property {{slug: string, name: string}} [subcategory]
 * @property {string[]} tags
 * @property {RatingSummary} rating
 * @property {Faq[]} faqs
 * @property {string} shippingEstimate     e.g. '通常10〜14日で発送予定'
 * @property {string} updatedAt            ISO date — surfaced as 最終更新日 (E-E-A-T)
 * @property {string} [supervisedBy]       e.g. '医療監修チーム' (E-E-A-T)
 * @property {ProductContentBlock[]} content  Long-form body, drives the TOC
 * @property {string[]} references          Citation URLs
 * @property {string} disclaimer
 */

/**
 * A section of long-form product copy. Each block becomes a TOC entry and an
 * <h2> on the page, so headings stay hierarchical and crawlable.
 *
 * @typedef {Object} ProductContentBlock
 * @property {string} id       Anchor slug
 * @property {string} heading
 * @property {string} html     SANITISED HTML from the admin editor
 */

/**
 * A merchandising banner.
 *
 * Modelled to be admin-managed: the source platform already serves banners
 * from `/adminpanel/storage/banners/`, so this entity exists there in some
 * form and this shape is what the storefront needs back from it.
 *
 * `placement` is the slot the banner occupies, `position` orders banners
 * within a slot, and the schedule fields let a campaign be queued in advance
 * and expire on its own. Scheduling and the active flag MUST be applied
 * server-side — the frontend renders what it is given and never filters by
 * date, or a stale cache would surface an expired campaign.
 *
 * @typedef {Object} Banner
 * @property {number}  id
 * @property {BannerPlacement} placement
 * @property {number}  position       Ascending sort within a placement
 * @property {string}  title          Also the accessible name
 * @property {string}  [subtitle]
 * @property {string}  [ctaLabel]
 * @property {string}  href           Destination — internal path preferred
 * @property {ProductImage} [image]   Omit for text-only placements (notice)
 * @property {ProductImage} [imageMobile]  The admin's second upload — its
 *   「Mobile Image」 field, stored as `thumbnail_path`. A separately composed
 *   crop for the stacked layout, not a smaller copy of `image`: the slot is
 *   ~1.9:1 on a phone and 2:1 on a desktop, so one file cannot serve both
 *   without losing an edge. Absent for every banner where nobody uploaded one,
 *   and the desktop artwork is then used at both sizes.
 * @property {string}  [theme]        'primary' | 'accent' | 'neutral'
 * @property {string}  [badge]        e.g. 'キャンペーン'
 * @property {string}  [startsAt]     ISO date — server-side gate
 * @property {string}  [endsAt]       ISO date — server-side gate
 * @property {boolean} isActive
 */

/**
 * A campaign on /campaign — a `banner_details` row read for its offer fields
 * rather than its artwork.
 *
 * @typedef {Object} Campaign
 * @property {number}  id
 * @property {number}  position        display_order, the tie-break on sort
 * @property {string}  title
 * @property {string}  couponCode      The code to enter at checkout
 * @property {string}  [startsAt]      ISO datetime
 * @property {string}  [endsAt]        ISO datetime
 * @property {number}  [minSpend]      Yen, omitted below 100 — see the
 *   normaliser: one live offer uses 1 to mean "no minimum"
 * @property {{kind: 'percentage'|'fixed', percent?: number, amount?: number,
 *   maxDiscount?: number|null}} [benefit]
 *   Only when the row states one unambiguously; null for the offers whose
 *   value is points, a gift or an enquiry. `maxDiscount` is the ceiling on a
 *   percentage — what 「最大◯%オフ」 means — and null when uncapped.
 * @property {ProductImage} [image]
 * @property {ProductImage} [imageMobile]
 * @property {string}  html            Sanitised terms, from offer_desc
 * @property {boolean} isActive
 */

/**
 * Placements are named to match the backend's own banner endpoints
 * (`/home/carousel`, `/home/left`, `/home/right`) so the mapping is direct
 * once the HTTP adapter is wired — see docs/PHASE-0.5-BACKEND-AUDIT.md.
 *
 *  · carousel — the wide slot at the centre of the showcase row
 *  · left / right — square banners flanking the carousel
 *  · promo — the three evergreen entry tiles
 *  · notice — text-only announcement strip
 *
 * @typedef {'notice'|'carousel'|'left'|'right'|'promo'|'homepageLine'} BannerPlacement
 */

/**
 * A category.
 *
 * Category pages on the source platform are not bare product grids — they
 * carry substantial editorial content below the products: a medical-review
 * byline, long-form sections, comparison tables and an FAQ. That content is
 * what makes them rank, so the shape below mirrors it.
 *
 * @typedef {Object} Category
 * @property {number}  id
 * @property {string}  slug
 * @property {string}  name
 * @property {string}  [description]     Short intro, shown above the products
 * @property {number}  productCount
 * @property {string}  [iconUrl]
 * @property {Category[]} [children]
 * @property {string}  [metaTitle]       Overrides the generated <title>
 * @property {string}  [metaDescription]
 * @property {string}  [supervisedBy]    e.g. '薬剤師 ○○' — E-E-A-T byline
 * @property {string}  [updatedAt]       ISO date, surfaced as 最終更新日
 * @property {ProductContentBlock[]} [content]  Long-form body below the grid
 * @property {Faq[]}   [faqs]
 */

/**
 * A paginated listing response. Every list endpoint returns this envelope.
 *
 * @typedef {Object} Paginated
 * @property {ProductSummary[]} items
 * @property {number} page
 * @property {number} perPage
 * @property {number} total
 * @property {number} totalPages
 */

/**
 * Catalogue query. Named readably — deliberately NOT the reference sites'
 * cryptic AMI/ASI/DON params, which are unreadable and unshareable.
 *
 * @typedef {Object} ProductQuery
 * @property {string}  [q]         Keyword
 * @property {string}  [category]  Category slug
 * @property {string}  [symptom]   Symptom/effect slug — second browse axis
 * @property {string[]}[tags]
 * @property {boolean} [inStock]
 * @property {number}  [minPrice]
 * @property {number}  [maxPrice]
 * @property {SortKey} [sort]
 * @property {number}  [page]
 * @property {number}  [perPage]
 */

/**
 * @typedef {'recommended'|'price_asc'|'price_desc'|'rating_desc'|'newest'|'popular'} SortKey
 */

/**
 * @typedef {Object} CartLine
 * @property {number}  variantId
 * @property {number}  productId
 * @property {string}  productName
 * @property {string}  slug
 * @property {ProductImage} image
 * @property {string}  packLabel
 * @property {number}  quantity
 * @property {number}  unitPrice   Price of one pack
 * @property {number}  lineTotal   SERVER-CALCULATED. Never derived client-side.
 * @property {number}  points
 * @property {boolean} inStock
 * @property {number}  [purchaseLimit]  Personal-import cap, in base units.
 * @property {number}  [unitsPerVariant] Base units inside one pack, so the
 *                     quantity can be compared against the cap.
 * @property {'one_time'|'recurring'} [deliveryType] Whether this row ships as
 *                     one parcel or a lawful split. 'recurring' is the
 *                     backend's name for the split, not a subscription.
 * @property {number}  [deliveriesCount] Parcels the backend settled on.
 * @property {number}  [mayBeDeliveryCount] Parcels a split WOULD come to,
 *                     computed even while the row is one_time.
 */

/**
 * Cart totals are ALWAYS server-calculated. The frontend renders them and
 * never recomputes them — the backend is the source of truth for every
 * monetary value. See docs/PHASE-0-AUDIT.md and the project brief §17.
 *
 * @typedef {Object} Cart
 * @property {string}   sessionId
 * @property {CartLine[]} lines
 * @property {number}   subtotal
 * @property {number}   discount
 * @property {number}   shipping
 * @property {number}   total
 * @property {number}   pointsEarned
 * @property {number}   [freeShippingThreshold]
 * @property {number}   [amountToFreeShipping]
 * @property {string}   [appliedCoupon]
 */

/**
 * One customer type only. No doctor/wholesale/pharmacist roles, no
 * customer_type column, one price for everyone. See docs/DECISIONS.md D7.
 *
 * @typedef {Object} Customer
 * @property {number} id
 * @property {string} email
 * @property {string} name
 * @property {string} [nameKana]
 * @property {string} [phone]
 * (No pointsBalance: the wallet holds it — see getPoints in auth.service.)
 */

export {};
