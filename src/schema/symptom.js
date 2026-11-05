import { SITE } from '@/constants/site';
import { abs, graph, breadcrumbList, websiteRef } from './shared';

/**
 * 症状から探す — the browse group and the individual symptom.
 *
 * Both are CollectionPage + BreadcrumbList, the same shape the category pages
 * use, because they are the same kind of thing: a curated listing of products
 * at a stable URL. The trail differs only in depth.
 */

/**
 * A browse group — /symptom/{group}.
 *
 * @param {Object} input
 * @param {import('@/lib/types').SymptomGroup} input.group
 * @param {string} input.path
 */
export function symptomGroupSchema({ group, path }) {
  const url = abs(path);

  const collection = {
    '@type': 'CollectionPage',
    '@id': `${url}#collectionpage`,
    url,
    name: group.name,
    description:
      group.metaDescription ||
      group.description ||
      `${group.name}に関する商品一覧です。症状や価格から絞り込んでお探しいただけます。`,
    inLanguage: SITE.lang,
    isPartOf: websiteRef(),
    breadcrumb: { '@id': `${url}#breadcrumb` },
  };

  const crumbs = breadcrumbList(
    [
      { name: '症状から探す', href: '/symptom' },
      { name: group.name, href: path },
    ],
    `${url}#breadcrumb`
  );

  return graph([collection, crumbs]);
}

/**
 * One symptom — /symptom/{group}/{symptom}, or /symptom/{symptom} while it has
 * no group.
 *
 * `name` is the short label a customer sees; the full indication string goes
 * in `description`, which is where the long clinical text is useful rather
 * than unreadable.
 *
 * @param {Object} input
 * @param {{slug: string, name: string, label?: string}} input.symptom
 * @param {import('@/lib/types').SymptomGroup} [input.group]
 * @param {string} input.path
 */
export function symptomSchema({ symptom, group, path }) {
  const url = abs(path);
  const label = symptom.label || symptom.name;

  const collection = {
    '@type': 'CollectionPage',
    '@id': `${url}#collectionpage`,
    url,
    name: `${label}に関する商品`,
    description: symptom.name,
    inLanguage: SITE.lang,
    isPartOf: websiteRef(),
    breadcrumb: { '@id': `${url}#breadcrumb` },
  };

  const crumbs = breadcrumbList(
    [
      { name: '症状から探す', href: '/symptom' },
      // Skipped entirely when the symptom has no group, so the trail never
      // carries an empty level.
      ...(group ? [{ name: group.name, href: `/symptom/${group.slug}` }] : []),
      { name: label, href: path },
    ],
    `${url}#breadcrumb`
  );

  return graph([collection, crumbs]);
}
