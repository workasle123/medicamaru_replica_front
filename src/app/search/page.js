import ListingLayout from '@/components/catalog/ListingLayout/ListingLayout';
import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { listProducts } from '@/services/products.service';
import { listCategoryTree } from '@/services/categories.service';
import { parseProductQuery } from '@/lib/query';
import { buildMetadata } from '@/lib/seo';

/**
 * Search results.
 *
 * Request-rendered: results depend entirely on user input, so there is
 * nothing meaningful to cache.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;

  // Search result pages are always noindex. They are infinite in number,
  // thin, and add nothing to the index — while still being crawlable onward
  // to the products they link to (follow).
  return buildMetadata({
    title: q ? `「${q}」の検索結果` : '商品検索',
    description: 'お薬らくの商品検索結果です。',
    path: '/search',
    noIndex: true,
  });
}

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const query = parseProductQuery(sp);

  const [result, categories] = await Promise.all([
    listProducts(query),
    listCategoryTree(),
  ]);

  const title = query.q ? `「${query.q}」の検索結果` : '商品検索';

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: '検索結果' }]} />

      <ListingLayout
        title={title}
        basePath="/search"
        query={query}
        result={result}
        categories={categories}
        keep={{ keepCategoryParam: true }}
        empty={
          <EmptyState
            title={
              query.q
                ? `「${query.q}」に一致する商品は見つかりませんでした`
                : 'キーワードを入力してください'
            }
            /* A search that finds nothing used to be followed by all ~300
               symptoms as chips. The way out stays, but as one link to the
               symptom page rather than its entire contents inlined here. */
            body="商品名のほか、症状からもお探しいただけます。カテゴリーからお探しいただくこともできます。"
            actionHref="/symptom"
            actionLabel="症状から探す"
          />
        }
      />
    </div>
  );
}
