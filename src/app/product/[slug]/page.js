import { notFound, permanentRedirect } from 'next/navigation';
import styles from './ProductPage.module.css';

import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import RankingBox from '@/components/sidebar/RankingBox/RankingBox';
import ProductGallery from '@/components/product/ProductGallery/ProductGallery';
import SpecTable from '@/components/product/SpecTable/SpecTable';
import PriceTiers from '@/components/product/PriceTiers/PriceTiers';
import ProductHighlights from '@/components/product/ProductHighlights/ProductHighlights';
import ProductContent from '@/components/product/ProductContent/ProductContent';
import ProductToc from '@/components/product/ProductToc/ProductToc';
import { sanitizeWithHeadingAnchors } from '@/lib/sanitize';
import FaqList from '@/components/product/FaqList/FaqList';
import ReviewSummary from '@/components/product/ReviewSummary/ReviewSummary';
import { Suspense } from 'react';

import ReviewForm from '@/components/product/ReviewForm/ReviewForm';
import CartAddedNotice from '@/components/cart/CartAddedNotice/CartAddedNotice';
import ProductRail from '@/components/home/ProductRail/ProductRail';
import Rating from '@/components/ui/Rating/Rating';
import Badge from '@/components/ui/Badge/Badge';

import {
  getAllProductSlugs,
  getProduct,
  getProductReviews,
  getRelatedProducts,
  listRankedProducts,
} from '@/services/products.service';
import { hasOwnBrand } from '@/services/seo.service';
import { buildMetadata } from '@/lib/seo';
import { JsonLd, productSchema } from '@/schema';
import { formatYenPrefix, formatPerUnit, formatYenSuffix, formatDate, toIsoDate } from '@/lib/format';

/**
 * Product detail page.
 *
 * Entirely server-rendered — every word, price and spec is in the initial
 * HTML. There are **no Client Components on this page**: the gallery is a
 * scroll-snap strip with anchor links, pack selection is radio inputs, the
 * FAQ is <details>, and the TOC is in-page anchors. All of it works before
 * (and without) hydration. Next.js still ships its own runtime for the app
 * shell, but this route adds no component JavaScript of its own.
 *
 * ISR, since price and stock live on this page and must not go stale.
 */
export const revalidate = 600;

/**
 * Prerendering the whole catalogue is opt-in.
 *
 * A full build renders ~3,550 pages, each one an API call, against a backend
 * capped at 500 database connections per hour — roughly seven times over in a
 * single deploy, which would take the live shop down for real customers.
 *
 * With the flag unset every page renders on demand and is then cached by its
 * own `revalidate`, so the same requests happen anyway but spread over hours
 * of real traffic instead of minutes of build. Set PRERENDER_CATALOGUE=true
 * only for a build you have deliberately timed.
 */
const PRERENDER = process.env.PRERENDER_CATALOGUE === 'true';

/**
 * Prerendering is skipped entirely when the detail endpoint is unhealthy.
 *
 * getProduct now throws instead of returning null when the backend is
 * unreachable — correct at request time, but during a build it would fail
 * every one of the ~2,500 pages and take the whole build with it. Since the
 * slug list comes from a DIFFERENT endpoint, that list can be perfectly
 * healthy while the detail route is broken (which is exactly the situation
 * the missing ProductBulkPricing class creates).
 *
 * Returning [] leaves dynamicParams on, so pages render on demand and each
 * shows a real error rather than a build that never completes.
 */
export async function generateStaticParams() {
  if (!PRERENDER) return [];

  const slugs = await getAllProductSlugs();
  if (!slugs.length) return [];

  try {
    await getProduct(slugs[0].slug);
  } catch (error) {
    // Loud on purpose: silently prerendering nothing looks identical to a
    // catalogue that is genuinely empty.
    console.warn(
      `[medicamaru] product detail endpoint is failing (${error?.message}). ` +
        `Skipping prerender of ${slugs.length} product pages; they will render on demand.`
    );
    return [];
  }

  return slugs.map(({ slug }) => ({ slug }));
}

/**
 * Best VALUE variant: the lowest price per unit, in stock where possible.
 *
 * This is the one the headline quotes, and it is usually the largest pack —
 * the opposite of the cheapest pack, which there used to be a second helper
 * for. Both were on screen at once, describing the same price, which is how
 * 「1錠あたり24円」 came to sit beside 「730円／1シート 10錠」.
 */
function bestUnitVariant(product) {
  const pool = product.variants.filter((v) => v.inStock);
  const list = pool.length ? pool : product.variants;
  return list.reduce((a, b) => (a.unitPrice <= b.unitPrice ? a : b));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return buildMetadata({ title: '商品が見つかりません', path: `/product/${slug}`, noIndex: true });
  }

  const best = bestUnitVariant(product);

  /* Admin-authored meta wins. 3,102 of 3,104 products have a title and
     description written in the admin panel; none of it was being read.

     Taken from the product row rather than the /product-seo endpoint: the
     detail response already carries all three fields, so fetching them
     separately added a request to every one of ~1,300 prerendered pages and
     took the build from 3 to 17 minutes.

     The generated fallback stays for the ~2 products with nothing set: the
     lowest unit price in the title follows okusuritsuhan's strongest SEO
     pattern (「最安値1錠20円」), which is the clearest differentiator in a SERP
     full of competitors selling the identical product. */
  return buildMetadata({
    title: product.metaTitle || `${product.name}の通販｜最安値1${best.unitLabel}${best.unitPrice}円`,
    description: product.metaDescription || product.shortDescription,
    keywords: product.metaKeywords,
    // Admin titles that brand themselves must bypass the layout's suffix.
    titleIsComplete: hasOwnBrand(product.metaTitle),
    /* product.slug, not the slug that was requested. The two differ whenever
       an old or mis-spelled URL is used, and the canonical must name the one
       address this product has — pointing it back at the URL being visited
       would tell Google that both spellings are canonical. */
    path: `/product/${product.slug}`,
    image: product.images[0]?.url,
    type: 'article',
  });
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  /* After the product, not alongside it: the endpoint is keyed on the numeric
     id, which only the product tells us. Returns an empty set on failure, so
     reviews cannot take the product page down with them. */
  const reviews = await getProductReviews(product.id);

  /* THE RATING SHOWN ON THIS PAGE COMES FROM THE REVIEWS ENDPOINT, not from
     the product.

     productDetails sends no rating fields at all — no average_rating, no
     reviews_count; only the LIST endpoints compute them. So product.rating
     was always {average: 0, count: 0} here, which meant the stars by the
     title read empty, 「レビューを見る」 never appeared, and ReviewSummary
     returned its empty state before it ever looked at the rows. Approved
     reviews existed and were fetched; nothing rendered them.

     The reviews endpoint's own figures are also the more trustworthy pair:
     they are computed over `status = 1`, where the list endpoints' count
     includes reviews still awaiting moderation.

     Falls back to the product's own numbers, so that if the detail endpoint
     ever does start sending them, a product with no approved reviews still
     shows whatever it reports. */
  /* The distribution bars, counted from the rows we already have. No endpoint
     supplies one, so they rendered 0% on every star — which under a 4.0
     average and 1件 read as a broken chart rather than a missing one. Counts
     per star, which is what ReviewSummary divides by the total.

     Honest only while the endpoint returns every approved review in one
     response, which it does: there is no pagination on it. */
  const histogram = reviews.items.reduce((acc, review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      acc[review.rating] = (acc[review.rating] ?? 0) + 1;
    }
    return acc;
  }, {});

  const rating = reviews.count
    ? { ...product.rating, average: reviews.average, count: reviews.count, histogram }
    : product.rating;

  /* One product, one address. The id at the end of the segment is what found
     this page, so every other spelling of the name in front of it resolves
     here too — including the bare `/product/3295` that every URL indexed
     before the slug column existed still uses.
     
     A 308 rather than rendering the page at both: two URLs serving identical
     content splits whatever ranking they have and leaves Google to pick a
     canonical for us. Permanent because the id-only form is never coming back.

     This is also what makes the admin's slug field safe to edit. Change the
     slug and yesterday's links do not break; they redirect. */
  if (slug !== product.slug) {
    permanentRedirect(`/product/${product.slug}`);
  }

  /* Both are side content and neither gates the page, so they go together
     rather than one after the other. listRankedProducts returns [] on failure
     — see the note on it — so a ranking that cannot be fetched costs the
     column, not the product page. */
  const [related, ranked] = await Promise.all([
    getRelatedProducts(slug, 8),
    listRankedProducts(10),
  ]);

  const best = bestUnitVariant(product);
  /* The same pack's per-unit price before its discount, struck through beside
     the headline — 180円 → 92円, as medicine.shop shows it. 0 when the pack is
     not discounted, and the strike is then left out. */
  const wasUnitPrice = best.discountPct > 0 && best.pack
    ? Math.round(best.listPrice / best.pack)
    : 0;
  const inStock = product.variants.some((v) => v.inStock);

  /* One pass over the admin body: sanitise it AND give every heading inside an
     id. A product description is a single 22 KB blob of editor HTML with about
     a dozen headings and no ids, so without this the 目次 could only point at
     the block as a whole rather than at the sections a reader wants. */
  const contentBlocks = product.content.map((block) => {
    const { html, headings } = sanitizeWithHeadingAnchors(block.html, block.id);
    return { ...block, html, headings };
  });

  /* The 目次, built from what this product actually renders rather than a fixed
     list — an entry that jumps nowhere is worse than no entry.

     Only h2 is listed. The bodies also carry h3s, but they are subordinate
     detail and several repeat (「関連コラム」 appears twice in a typical
     product), which would pad the list without helping anyone navigate. */
  const tocSections = [
    { id: 'specs', label: '商品の基本情報' },
    ...contentBlocks.flatMap((block) =>
      block.headings.filter((h) => h.level === 2).map((h) => ({ id: h.id, label: h.text }))
    ),
    ...(product.faqs.length ? [{ id: 'faq', label: 'よくあるご質問' }] : []),
    { id: 'reviews', label: 'レビュー' },
    ...(product.references?.length ? [{ id: 'references', label: '参考文献' }] : []),
  ];

  /* Home › category › subcategory › product. `Breadcrumbs` supplies the home
     crumb itself, so it is not repeated here.

     Each level is included only when it actually has a name: an unnamed
     crumb renders as a stray separator and, worse, emits an empty `name`
     into the BreadcrumbList — which is what happened while the normaliser
     was dropping the joined category rows. */
  const parentCrumbs = [
    ...(product.category?.name
      ? [{ name: product.category.name, href: `/category/${product.category.slug}` }]
      : []),
    ...(product.subcategory?.name
      ? [
          {
            name: product.subcategory.name,
            // Nested, matching the canonical category URL shape.
            href: product.category?.slug
              ? `/category/${product.category.slug}/${product.subcategory.slug}`
              : `/category/${product.subcategory.slug}`,
          },
        ]
      : []),
  ];

  /* The visible trail ends at the product; the BreadcrumbList in the graph is
     built from the same array, so the two cannot drift. */
  const crumbs = [...parentCrumbs, { name: product.name }];

  return (
    <div className="container">
      {/* 「カートに追加しました」, with the way to the cart. The add action
          redirects back to this page carrying ?added=1, and until now nothing
          read it — so adding looked like a page that reloaded itself.

          Suspense because it calls useSearchParams(): without a boundary that
          hook opts the whole route out of static rendering, and these pages
          are prerendered for every product in the catalogue. Inside one, only
          this subtree waits for the client. */}
      <Suspense fallback={null}>
        <CartAddedNotice />
      </Suspense>

      {/* Product+Drug, the breadcrumb trail, and compact Organization and
          WebSite nodes so the seller and publisher resolve on this page
          alone. See src/schema/product.js. */}
      {/* The same corrected rating the page renders. productSchema emits
          aggregateRating only when there are reviews behind it AND the page
          shows them — both true now, and neither was before, so the stars
          could never have reached a rich result either. */}
      <JsonLd
        data={productSchema({
          product: { ...product, rating },
          path: `/product/${product.slug}`,
          crumbs: parentCrumbs,
        })}
      />

      {/* `schema={false}`: the BreadcrumbList is in the graph above. */}
      <Breadcrumbs items={crumbs} schema={false} />

      {/* ONE grid for the whole page body, not two.

          The gallery, title, pack panel, 目次, description and ranking were
          split across a `.top` grid and a `.bodyLayout` grid, and a grid row
          is as tall as its tallest column. The pack panel is the only part of
          this page that grows with the data, so a 7-pack product held the
          upper grid open to the panel's height and left a block of blank
          space beside the specs — and the description could not begin until
          the packs ended.

          Merged, the panel spans the title row, the specs row AND the body
          row, so the text that was being pushed below it absorbs its height
          instead. See ProductPage.module.css for the row map.

          Child order here is the order those two grids had between them, so
          reading order and the single-column phone layout are unchanged. */}
      <div className={styles.page}>
        <div className={styles.galleryColumn}>
          <ProductGallery images={product.images} productName={product.name} />

          {/* Tags assigned in the admin panel (tags ↔ product_tags).

              NOT links, deliberately. They used to point at
              /search?q=<tag>, because /products?tags= returns nothing (its
              listing endpoint needs a category_id it is never given). But
              that search matches product NAMES, never the tag tables, so the
              two have almost nothing to do with each other: 女性向け is on 236
              products and returned 0, while カルダモン is on 3 and returned 5 —
              products that do not even carry the tag.

              A label that lies is worse than a label that does nothing, so
              until the backend can answer "which products have this tag"
              these stay descriptive. They are styled as metadata, not chips,
              so nobody expects a click. */}
          {product.tags.length > 0 && (
            <div className={styles.tagSection}>
              <p className={styles.tagLabel}>
                <IconTag />
                タグ
              </p>
              <ul className={styles.tags} aria-label="この商品のタグ">
                {product.tags.map((tag) => (
                  <li key={tag} className={styles.tag}>
                    <span className={styles.tagHash} aria-hidden="true">
                      #
                    </span>
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.head}>
          {product.brand && <p className={styles.brand}>{product.brand}</p>}
          <h1 className={styles.title}>{product.name}</h1>

          <div className={styles.headlinePrice}>
            {wasUnitPrice > best.unitPrice && (
              <span className={`${styles.wasPrice} numeric`}>
                {formatYenPrefix(wasUnitPrice)}
              </span>
            )}
            <span className={`${styles.unitPrice} numeric`}>
              {formatYenPrefix(best.unitPrice)}
              <span className={styles.perUnit}>{formatPerUnit(best.unitLabel)}</span>
            </span>
            {/* The pack this price comes from, so the headline figure is
                attributable; every other tier is in the panel.

                `best`, not `cheapest`. The per-unit figure beside it is the
                best unit price in the range — usually the LARGEST pack —
                while this line used to name the cheapest pack, which is the
                smallest. So the two halves described different variants:
                「1錠あたり24円」 next to 「730円／1シート 10錠」, and 730/10
                is 73, not 24. The sentence contradicted itself, and the
                cheaper-looking pack was the one that did not earn the
                headline rate. */}
            <span className={`${styles.fromPrice} numeric`}>
              {formatYenSuffix(best.price)}／{best.packLabel}
            </span>
          </div>

          <div className={styles.ratingRow}>
            <Rating average={rating.average} count={rating.count} showValue />
            {rating.count > 0 && (
              <a href="#reviews" className={styles.reviewLink}>
                レビューを見る
              </a>
            )}
            {inStock ? <Badge variant="inStock">在庫あり</Badge> : <Badge variant="outOfStock">在庫なし</Badge>}
          </div>
        </div>

        {/* The right rail: the pack panel, then 売れ筋ランキング under it.

            ONE box, because a grid cannot flow two items down a column that a
            third item is spanning. With the panel spanning the title, specs
            and body rows — which is what keeps the blank space out — the only
            cell left for the ranking was below the description, which put it
            thousands of pixels down the page on every product. Inside a rail
            they simply stack, and the ranking starts where the packs end.

            This is also why the ranking is no longer last in the DOM. Below
            1280px it does not render at all, so nothing changes there; above
            it, a screen reader now meets it after the buy box rather than
            after the description. The aria-label makes it a landmark that can
            be skipped in one key press, which is the trade for having it
            beside the text instead of beneath it. */}
        <div className={styles.railRight}>
          <div className={styles.purchase}>
            <PriceTiers product={product} />
          </div>

          <aside className={styles.rankingColumn} aria-label="売れ筋ランキング">
            <RankingBox products={ranked} />
          </aside>
        </div>

        <div className={styles.details}>
          <ProductHighlights
            composition={product.composition}
            shippingEstimate={product.shippingEstimate}
          />

          <div className={styles.specs} id="specs">
            <h2 className="visually-hidden">商品の基本情報</h2>
            <SpecTable specs={product.specs} />
          </div>

          {/* E-E-A-T signals: freshness and medical supervision */}
          <p className={styles.byline}>
            <span>
              最終更新日：
              <time dateTime={toIsoDate(product.updatedAt)}>{formatDate(product.updatedAt)}</time>
            </span>
            {product.supervisedBy && <span>監修：{product.supervisedBy}</span>}
          </p>
        </div>

        {/* The 目次 is a sibling column, not a block above the text, so it stays
            in view while the body is read. It is FIRST in the DOM so keyboard
            and screen-reader users reach it before the content it indexes;
            on narrow screens it simply stacks above. */}
        <aside className={styles.tocColumn}>
          <ProductToc sections={tocSections} />
        </aside>

        <div className={styles.bodyMain}>
          <ProductContent blocks={contentBlocks} />

          <FaqList faqs={product.faqs} title={`${product.name}に関するよくあるご質問`} />

          {/* The form resolves its own eligibility after hydration. It MUST
              NOT be decided here: this page is prerendered static HTML for
              every product, and reading the session cookie during its render
              would opt all of them into dynamic rendering. */}
          <ReviewSummary
            rating={rating}
            reviews={reviews.items}
            /* product.slug, not the requested one — the two differ for a
               legacy numeric URL, and the path that needs revalidating after
               a post is the canonical one. */
            form={<ReviewForm productId={product.id} slug={product.slug} />}
          />

        {product.references?.length > 0 && (
          <section className={styles.references} id="references">
            <h2 className={styles.referencesTitle}>参考文献</h2>
            <ul className={styles.referencesList}>
              {product.references.map((ref) => (
                <li key={ref}>
                  <a href={ref} rel="nofollow noopener noreferrer" target="_blank">
                    {ref}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

          {product.disclaimer && <p className={styles.disclaimer}>{product.disclaimer}</p>}
        </div>
      </div>

      {related.length > 0 && (
        <div className={styles.related}>
          <ProductRail title="関連商品" products={related} />
        </div>
      )}
    </div>
  );
}

/* Decorative: it sits beside the word タグ, which already says what it is. */
function IconTag() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.tagLabelIcon}
      aria-hidden="true"
    >
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </svg>
  );
}
