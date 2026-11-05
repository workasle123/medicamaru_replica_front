import { redirect } from 'next/navigation';

import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import ProductGrid from '@/components/product/ProductGrid/ProductGrid';
import WishlistAddToCart from './WishlistAddToCart';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader';
import { getCurrentCustomer, getWishlist } from '@/services/auth.service';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'お気に入り',
  path: '/wishlist',
  noIndex: true,
});

export default async function WishlistPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect('/login?next=/wishlist');

  /* The endpoint returns the products themselves, so this is one request and
     no filtering. It previously fetched ids here and then searched a
     100-product listing for them, which meant anything outside that page —
     most of a 3,000-product catalogue — never appeared. */
  const items = await getWishlist();

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: 'お気に入り' }]} />

      <div className="section">
        <SectionHeader
          title="お気に入り"
          subtitle="気になる商品を保存しておけます。"
          as="h1"
        />

        <ProductGrid
          products={items}
          /* Favourites is the one listing where the point is to re-buy, so the
             pack and quantity are chosen here rather than a page deeper. */
          renderActions={(product) => <WishlistAddToCart product={product} />}
          empty={
            <EmptyState
              title="お気に入りに登録された商品はありません"
              body="商品ページのハートマークから、気になる商品を保存できます。"
              actionHref="/category"
              actionLabel="商品を探す"
            />
          }
        />
      </div>
    </div>
  );
}
