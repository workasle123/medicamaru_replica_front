import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import CategoryGrid from '@/components/home/CategoryGrid/CategoryGrid';
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader';
import { listAllCategories } from '@/services/categories.service';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: 'カテゴリー一覧',
  description:
    'メディカ丸で取り扱う商品のカテゴリー一覧です。ED・AGA・ダイエット・スキンケアなど、目的別にお探しいただけます。',
  path: '/category',
});

/**
 * Category index.
 *
 * Carries the catalogue's long tail as crawlable internal links, which is why
 * the header nav can stay curated instead of exposing a 257-link mega menu.
 */
export default async function CategoryIndexPage() {
  const categories = await listAllCategories();

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: 'カテゴリー' }]} />

      <div className="section">
        <SectionHeader
          title="カテゴリーから探す"
          subtitle="目的やお悩みに合わせて、カテゴリーから商品をお探しいただけます。"
          as="h1"
        />
        <CategoryGrid categories={categories} />
      </div>
    </div>
  );
}
