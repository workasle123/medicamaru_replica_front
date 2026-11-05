import { notFound, permanentRedirect } from 'next/navigation';

import styles from './SymptomBrowse.module.css';

import ListingLayout from '@/components/catalog/ListingLayout/ListingLayout';
import SymptomChips from '@/components/catalog/SymptomChips/SymptomChips';
import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import { JsonLd, symptomGroupSchema, symptomSchema } from '@/schema';
import { listProducts } from '@/services/products.service';
import { listCategoryTree, listSymptoms, listSymptomGroups, getSymptomGroup } from '@/services/categories.service';
import { parseProductQuery, isFiltered, buildListingUrl } from '@/lib/query';
import { buildMetadata } from '@/lib/seo';

/**
 * Symptom browse.
 *
 *   /symptom/{group}                 the group — 薄毛・AGA and the other 18
 *   /symptom/{group}?symptom={slug}  one indication inside it
 *
 * A symptom is a TAB on its group's page, not a page of its own. Clicking one
 * swaps the products without leaving: Next soft-navigates a query change, so
 * there is no reload and no flash.
 *
 * Why a query parameter rather than filtering in the browser: a group holds up
 * to 123 products across 25 pages, so client-side filtering would mean loading
 * every one of them up front in order to hide most. This way the URL stays
 * real — shareable, bookmarkable, survives the back button, and works with
 * JavaScript off, which is how every other filter in this catalogue behaves.
 *
 * The old per-symptom paths 308 here, so nothing written against them breaks:
 *
 *   /symptom/{group}/{slug}  ->  /symptom/{group}?symptom={slug}
 *   /symptom/{slug}          ->  /symptom/{group}?symptom={slug}
 *
 * A symptom with NO group keeps a page of its own at the flat URL — there is
 * no group page for it to be a tab on, and 404ing it would take its products
 * off the site.
 */
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-cache';

/**
 * Below this many products, a standalone symptom page is not offered for
 * indexing.
 *
 * Only reaches the handful of symptoms with no group, since every other one is
 * a tab now and has no page to index. All of those are thin today, but the
 * threshold stays so that assigning a group remains the only thing that
 * decides it.
 */
const MIN_INDEXABLE_PRODUCTS = 3;

/* No generateStaticParams: force-dynamic ignores it, and this page reads
   searchParams for its filters, which cannot be prerendered anyway — the same
   DYNAMIC_SERVER_USAGE that returned a 500 for every symptom page before. */

/**
 * Work out what a URL points at.
 *
 * A group is tried FIRST: group slugs are short curated words, and they are
 * the ones that should win a collision with an imported symptom slug.
 *
 * @param {string[]} segments
 * @param {object} query
 */
async function resolve(segments, query) {
  if (!segments?.length || segments.length > 2) return null;

  // ── /symptom/{group} ──────────────────────────────────────────────────
  if (segments.length === 1) {
    const found = await getSymptomGroup(segments[0], query);
    if (found) return { kind: 'group', ...found, path: `/symptom/${found.group.slug}` };
  }

  /* ── a symptom, at either depth ─────────────────────────────────────────
     Both lists are single cached responses, so resolving through them costs
     nothing per request and saves an endpoint that does not exist. */
  const slug = segments[segments.length - 1];
  const [symptoms, groups] = await Promise.all([listSymptoms(), listSymptomGroups()]);
  const symptom = symptoms.find((s) => s.slug === slug);

  if (!symptom) return null;

  const group = groups.find((g) => g.id === symptom.groupId);

  // Grouped: it is a tab now, so send the visitor to it.
  if (group) {
    return { kind: 'redirect', to: `/symptom/${group.slug}?symptom=${symptom.slug}` };
  }

  return { kind: 'symptom', symptom, path: `/symptom/${symptom.slug}` };
}

/** The symptom named by `?symptom=`, when it is one this group holds. */
function activeSymptom(symptoms, query) {
  if (!query.symptom) return null;
  return symptoms.find((s) => s.slug === query.symptom) ?? null;
}

export async function generateMetadata({ params, searchParams }) {
  const { slug: segments } = await params;
  const sp = await searchParams;
  const query = parseProductQuery(sp);
  const match = await resolve(segments, query);

  if (!match || match.kind === 'redirect') {
    return buildMetadata({
      title: 'ページが見つかりません',
      path: `/symptom/${(segments ?? []).join('/')}`,
      noIndex: true,
    });
  }

  const filtered = isFiltered(query) || query.page > 1;

  if (match.kind === 'group') {
    const { group } = match;
    const active = activeSymptom(match.symptoms, query);

    if (active) {
      const label = active.label || active.name;
      return buildMetadata({
        title: `${label}に関する商品｜${group.name}`,
        description: `${group.name}のうち、${label}に関する商品一覧です。`,
        /* Canonical to the UNFILTERED group. A tab is a facet of this page
           rather than a page of its own — which is the point of making it one
           — so the group is the address that should rank. */
        path: match.path,
        noIndex: true,
      });
    }

    return buildMetadata({
      title: group.metaTitle || `${group.name}の商品`,
      description:
        group.metaDescription ||
        group.description ||
        `${group.name}に関する商品一覧です。症状や価格から絞り込んでお探しいただけます。`,
      path: match.path,
      noIndex: filtered,
    });
  }

  const label = match.symptom.label || match.symptom.name;
  const thin = (match.symptom.productCount ?? 0) < MIN_INDEXABLE_PRODUCTS;

  return buildMetadata({
    title: `${label}に関する商品`,
    description: `${label}でお悩みの方向けの商品一覧です。価格や在庫状況から絞り込んでお探しいただけます。`,
    path: match.path,
    noIndex: filtered || thin,
  });
}

export default async function SymptomBrowsePage({ params, searchParams }) {
  const { slug: segments } = await params;
  const sp = await searchParams;
  const query = parseProductQuery(sp);

  const match = await resolve(segments, query);
  if (!match) notFound();

  /* 308 rather than 302: these paths were live and in the sitemap, so the move
     has to be permanent for a crawler to transfer their ranking rather than
     keep indexing both. */
  if (match.kind === 'redirect') permanentRedirect(match.to);

  const categories = await listCategoryTree();

  if (match.kind === 'group') {
    const { group, symptoms, result: groupResult } = match;
    const active = activeSymptom(symptoms, query);

    /* A tab re-queries by symptom rather than filtering the group's result in
       memory: that result is ONE page of up to 123 products, so filtering it
       here would silently drop everything on pages 2-25. The symptom endpoint
       already exists — it is what the per-symptom pages used. */
    const result = active ? await listProducts({ ...query, symptom: active.slug }) : groupResult;

    return (
      <div className="container">
        <JsonLd data={symptomGroupSchema({ group, path: match.path })} />

        {/* schema={false}: the BreadcrumbList is inside the graph above. */}
        <Breadcrumbs
          items={[{ name: '症状から探す', href: '/symptom' }, { name: group.name }]}
          schema={false}
        />

        {symptoms.length > 0 && (
          <nav className={styles.refine} aria-label="この分類の症状">
            <p className={styles.heading}>症状で絞り込む</p>

            <SymptomChips
              symptoms={symptoms}
              activeSlug={active?.slug}
              /* すべて is prepended only once a tab is open — with nothing
                 selected it would be a control that does nothing. */
              leading={
                active
                  ? {
                      label: 'すべて',
                      href: buildListingUrl(match.path, query, { symptom: undefined }),
                      count: group.productCount,
                    }
                  : null
              }
              hrefFor={(symptom) =>
                buildListingUrl(match.path, query, {
                  symptom: symptom.slug,
                  keepSymptomParam: true,
                })
              }
            />
          </nav>
        )}

        <ListingLayout
          title={active ? `${active.label || active.name}に関する商品` : `${group.name}の商品`}
          /* The full indication string when a tab is open — three clauses on
             most rows, which a chip has to shorten but a heading has room
             for. */
          description={active ? symptomDescription(active) : group.description}
          basePath={match.path}
          query={query}
          result={result}
          categories={categories}
        />
      </div>
    );
  }

  // A symptom with no group: nowhere to be a tab, so it keeps its own page.
  const { symptom } = match;
  const label = symptom.label || symptom.name;
  const result = await listProducts({ ...query, symptom: symptom.slug });

  return (
    <div className="container">
      <JsonLd data={symptomSchema({ symptom, path: match.path })} />

      <Breadcrumbs
        items={[{ name: '症状から探す', href: '/symptom' }, { name: label }]}
        schema={false}
      />

      <ListingLayout
        title={`${label}に関する商品`}
        description={symptomDescription(symptom)}
        basePath={match.path}
        query={query}
        result={result}
        categories={categories}
      />
    </div>
  );
}

/** The full indication string, but only when the label is not already it. */
function symptomDescription(symptom) {
  const label = symptom.label || symptom.name;
  return symptom.name !== label ? symptom.name : undefined;
}
