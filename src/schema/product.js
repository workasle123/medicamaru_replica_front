import { SITE } from '@/constants/site';
import {
  abs,
  graph,
  faqPage,
  breadcrumbList,
  organizationRef,
  websiteRef,
  ORG_ID,
  WEBSITE_ID,
} from './shared';

/**
 * Product detail page.
 *
 * The graph carries four nodes: the product, its breadcrumb trail, and compact
 * restatements of the organization and the website so the seller and publisher
 * resolve without the crawler having to have seen the homepage first.
 *
 * `["Product", "Drug"]` — a dual type. `Drug` alone would not be eligible for a
 * merchant listing; `Product` alone would not say what is being sold. Together
 * they are both shoppable and accurate, which matters for a pharmacy.
 */

/** Cheapest in-stock pack, falling back to the cheapest pack overall. */
function cheapestVariant(product) {
  const pool = product.variants.filter((v) => v.inStock);
  const list = pool.length ? pool : product.variants;
  return list.length ? list.reduce((a, b) => (a.price <= b.price ? a : b)) : null;
}

/**
 * @param {Object} input
 * @param {import('@/lib/types').Product} input.product
 * @param {string} input.path  Canonical path, e.g. `/product/107`
 * @param {{name: string, href?: string}[]} [input.crumbs]
 *   The trail the page RENDERS, excluding ホーム and excluding the product
 *   itself — passed in so the visible breadcrumbs and this list cannot drift.
 */
export function productSchema({ product, path, crumbs = [] }) {
  const url = abs(path);
  const cheapest = cheapestVariant(product);
  const inStock = product.variants.some((v) => v.inStock);

  const images = product.images.map((image) => image.url).filter(Boolean);

  /* `manufacturer` is not mapped by the detail endpoint — it normalises to an
     empty string — so it falls back to the brand, which for this catalogue IS
     the manufacturing house (AJANTA PHARMA LTD and the like). Both are omitted
     rather than emitted empty when neither is known. */
  const manufacturer = product.manufacturer || product.brand;

  const node = {
    '@type': ['Product', 'Drug'],
    '@id': `${url}#product`,
    url,
    name: product.name,
    description: product.metaDescription || product.shortDescription,
    ...(images.length ? { image: images } : {}),
    ...(product.sku ? { sku: String(product.sku) } : {}),
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    ...(manufacturer
      ? { manufacturer: { '@type': 'Organization', name: manufacturer } }
      : {}),
    inLanguage: SITE.lang,
    ...(product.category?.name ? { category: product.category.name } : {}),
    isPartOf: { '@id': WEBSITE_ID },

    /* Emitted ONLY with real reviews behind it. An aggregateRating with no
       ratings — or one the page does not display — is a structured data policy
       violation, not merely a weak signal. */
    ...(product.rating?.count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: String(product.rating.average),
            reviewCount: String(product.rating.count),
            bestRating: '5',
            worstRating: '1',
          },
        }
      : {}),

    /* A single Offer at the cheapest pack's price, as specified. The catalogue
       prices per pack, so this reads as the "from" price a shopper sees in the
       headline; the remaining tiers are on the page but not in the markup. */
    ...(cheapest
      ? {
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: SITE.currency,
            price: String(cheapest.price),
            availability: inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@id': ORG_ID },
          },
        }
      : {}),

    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  const trail = breadcrumbList(
    [...crumbs, { name: product.name, href: path }],
    `${url}#breadcrumb`
  );

  const website = {
    ...websiteRef(),
    publisher: { '@id': ORG_ID },
    inLanguage: SITE.lang,
  };

  return [
    graph([node, trail, organizationRef(), website]),
    /* Products carry no FAQs today — the detail normaliser hardcodes `faqs: []`
       — so this resolves to null and nothing is emitted. It is wired up so that
       the moment per-product FAQs are authored and rendered, the markup follows
       them automatically. */
    faqPage(product.faqs, `${url}#faq`),
  ];
}
