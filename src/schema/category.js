import { SITE } from '@/constants/site';
import { abs, graph, faqPage, breadcrumbList, websiteRef } from './shared';

/**
 * Top-level category page — CollectionPage + BreadcrumbList.
 *
 * `/category/ed` and the like. A subcategory is one level deeper and has its
 * own file, `subcategory.js`; the two are kept apart deliberately so either
 * can be retuned without touching the other.
 *
 * The two nodes are joined by `@id`: the CollectionPage's `breadcrumb` points
 * at the BreadcrumbList rather than nesting a copy of it.
 */

/**
 * @param {Object} input
 * @param {import('@/lib/types').Category} input.category
 * @param {string} input.path  Canonical path, e.g. `/category/ed`
 * @param {{question: string, answer: string}[]} [input.faqs]  Only when rendered.
 */
export function categorySchema({ category, path, faqs = [] }) {
  const url = abs(path);

  /* The display name, not the meta title. A meta title is written for a SERP
     snippet (「ED治療薬の通販｜メディカ丸」) whereas `name` identifies the
     collection itself, and the SEO team's document uses the plain name. */
  const name = category.name;

  const description =
    category.metaDescription ||
    category.description ||
    `${category.name}の商品一覧です。症状や価格から絞り込んでお探しいただけます。`;

  const collection = {
    '@type': 'CollectionPage',
    '@id': `${url}#collectionpage`,
    url,
    name,
    description,
    inLanguage: SITE.lang,
    isPartOf: websiteRef(),
    breadcrumb: { '@id': `${url}#breadcrumb` },
  };

  const crumbs = breadcrumbList([{ name: category.name, href: path }], `${url}#breadcrumb`);

  return [graph([collection, crumbs]), faqPage(faqs, `${url}#faq`)];
}
