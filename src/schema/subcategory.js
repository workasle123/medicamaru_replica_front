import { SITE } from '@/constants/site';
import { abs, graph, faqPage, breadcrumbList, websiteRef } from './shared';

/**
 * Subcategory page — CollectionPage + BreadcrumbList.
 *
 * `/category/ed/ed-supplements`. Same shape as a top-level category, with the
 * parent inserted at position 2 of the trail.
 *
 * Note on the source document: its `@id` values were written with spaces
 * inside the string (`" https://… #breadcrumb"`). Those are not equivalent to
 * the trimmed form, so the CollectionPage's `breadcrumb` reference would not
 * have resolved to the list beside it. Both ids are built from the same `url`
 * here, which makes the mismatch impossible.
 */

/**
 * @param {Object} input
 * @param {import('@/lib/types').Category} input.category  With `.parent` set.
 * @param {string} input.path  Canonical path, e.g. `/category/ed/ed-supplements`
 * @param {{question: string, answer: string}[]} [input.faqs]  Only when rendered.
 */
export function subcategorySchema({ category, path, faqs = [] }) {
  const url = abs(path);
  const parent = category.parent;

  const description =
    category.metaDescription ||
    category.description ||
    `${category.name}の商品一覧です。症状や価格から絞り込んでお探しいただけます。`;

  const collection = {
    '@type': 'CollectionPage',
    '@id': `${url}#collectionpage`,
    url,
    name: category.name,
    description,
    inLanguage: SITE.lang,
    isPartOf: websiteRef(),
    breadcrumb: { '@id': `${url}#breadcrumb` },
  };

  /* The parent is included only when it actually resolved. A subcategory
     reached without its parent row would otherwise emit a ListItem with an
     empty name and a link to `/category/undefined`. */
  const crumbs = breadcrumbList(
    [
      ...(parent?.name ? [{ name: parent.name, href: `/category/${parent.slug}` }] : []),
      { name: category.name, href: path },
    ],
    `${url}#breadcrumb`
  );

  return [graph([collection, crumbs]), faqPage(faqs, `${url}#faq`)];
}
