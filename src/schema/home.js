import { SITE } from '@/constants/site';
import {
  abs,
  graph,
  faqPage,
  organizationNode,
  websiteNode,
  ORG_ID,
  WEBSITE_ID,
} from './shared';

/**
 * Homepage structured data.
 *
 * This is the page that establishes the site's identity: it carries the only
 * full `OnlineStore` and `WebSite` definitions, and every other page refers to
 * them by `@id`. If the homepage stops emitting this graph, the references
 * elsewhere point at nothing.
 *
 * Two documents, matching how the SEO team supplied them — the identity graph,
 * and the FAQPage as a block of its own.
 */

/** The `name` of the homepage node. SEO-authored; not the <title> template. */
const PAGE_NAME = 'お薬らく | 海外医薬品・ジェネリック医薬品・サプリメント';

/**
 * @param {Object} input
 * @param {{question: string, answer: string}[]} [input.faqs]
 *   The FAQs the page RENDERS (Admin → FAQ → Page = home). Structured data has
 *   to mirror what a visitor sees, so this is the same array FaqList is given —
 *   never a separate hardcoded list.
 */
export function homeSchema({ faqs = [] } = {}) {
  const identity = graph([
    organizationNode(),
    websiteNode(),
    {
      '@type': 'WebPage',
      '@id': `${abs('/')}#webpage`,
      url: abs('/'),
      name: PAGE_NAME,
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': ORG_ID },
      inLanguage: SITE.lang,
    },
  ]);

  return [identity, faqPage(faqs, `${abs('/')}#faq`)];
}
