/**
 * Medicamaru — structured data.
 *
 * One file per page type, each exporting a builder that takes live data and
 * returns what that page should emit. Pages import from here and render the
 * result through `JsonLd`; no page assembles JSON-LD inline any more.
 *
 *   src/schema/
 *     JsonLd.jsx      the renderer — the only place a <script> is written
 *     shared.js       @ids, brand facts, and the nodes more than one page needs
 *     home.js         OnlineStore + WebSite + WebPage, and the homepage FAQs
 *     category.js     CollectionPage + BreadcrumbList
 *     subcategory.js  the same, one level deeper
 *     product.js      Product+Drug, BreadcrumbList, Organization, WebSite
 *
 * To change a page's markup, edit that page's file. To change a brand fact —
 * the logo, the social profiles, the postal address — edit `shared.js`, which
 * is the single source for all of them.
 */

export { default as JsonLd } from './JsonLd';

export { homeSchema } from './home';
export { categorySchema } from './category';
export { subcategorySchema } from './subcategory';
export { productSchema } from './product';
export { symptomGroupSchema, symptomSchema } from './symptom';

/* Building blocks, for the pages the SEO team has not specified a graph for:
   /faq renders one FAQPage over every group, and Breadcrumbs emits a trail on
   pages that do not carry a graph of their own. */
export { faqPage, breadcrumbList, abs } from './shared';
