import { getHomeData, listFaqs } from '@/services/home.service';
import { pageMetadata } from '@/lib/seo';
import { JsonLd, homeSchema } from '@/schema';
import { SITE } from '@/constants/site';

import CategoryGrid from '@/components/home/CategoryGrid/CategoryGrid';
import ProductRail from '@/components/home/ProductRail/ProductRail';
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader';
import LeadIntro from '@/components/home/LeadIntro/LeadIntro';
import LineBanner from '@/components/home/LineBanner/LineBanner';
import CategoryBanner from '@/components/banner/CategoryBanner/CategoryBanner';
import PromoTiles from '@/components/banner/PromoTiles/PromoTiles';
import FaqList from '@/components/product/FaqList/FaqList';
import OrderGuideAside from '@/components/home/OrderGuideAside/OrderGuideAside';
import styles from './page.module.css';

/**
 * Homepage.
 *
 * A Server Component throughout — every section is static markup rendered on
 * the server, so the page ships effectively no JavaScript and all content is
 * crawlable without execution (brief §15).
 *
 * Revalidated rather than request-rendered: the homepage changes with
 * merchandising, not per visitor.
 */
export const revalidate = 300;

export const generateMetadata = pageMetadata('/', {
  title: null,
  description: SITE.description,
});

export default async function HomePage() {
  // One call assembles every rail and every banner — no request waterfall.
  // FAQs come from a different endpoint, so they run alongside rather than after.
  const [{ ranked, categorySections, categories, banners }, faqs] =
    await Promise.all([getHomeData(), listFaqs('home')]);

  return (
    <>
      {/* The site's identity graph — OnlineStore, WebSite and this WebPage —
          plus the FAQPage, which mirrors the questions rendered below.
          Every other page refers to these two @ids rather than restating
          them, so this is the one page that must always emit them. */}
      <JsonLd data={homeSchema({ faqs })} />

      <div className="container">
        {/* The H1, the LINE banner and a button into the catalogue open the
            page; the campaign carousel and the slider banners are gone. */}
        <LeadIntro banner={<LineBanner banner={banners.homepageLine?.[0]} />} />

        <section className="section">
          <SectionHeader
            title="カテゴリーから探す"
            subtitle="お悩みや目的に合わせて、カテゴリーから商品をお探しいただけます。"
            href="/category"
          />
          {/* No limit: this grid is the index to the rails below it, so it
              shows the same set — every category ticked "Show On Home Page",
              in the admin's order_no order. A grid capped at five above eight
              rails would be an index missing three of its entries.
              すべて見る leads to the full catalogue. */}
          <CategoryGrid categories={categories} />
        </section>

        {/* Best-ranking products, then one rail per category. Category rails
            on the homepage are the norm in this market — kusuriexpress runs
            ten of them — and each carries its own すべて見る through to the
            full category listing. */}
        {/* No `href`: the ranking rail stays, but /ranking is gone, so there
            is nowhere for a すべて見る to lead. */}
        <section className="section">
          <ProductRail
            title="売れ筋ランキング"
            subtitle="よくご購入いただいている商品です。"
            products={ranked}
            priority
            packImages
          />
        </section>

        {/* Products lead; each category rail is followed by its own banner,
            assigned in the admin panel under the "Category Banner" position.
            A category with none assigned simply renders without one. */}
        {categorySections.map((section) => (
          <section className="section" key={section.slug}>
            <ProductRail
              title={section.name}
              href={`/category/${section.slug}`}
              products={section.products}
              subcategories={section.subcategories}
              parentSlug={section.slug}
              packImages
            />
            <CategoryBanner banner={section.banner} />
          </section>
        ))}

        {/* The 健康コラム rail was removed along with /blogs. */}

        {/* FAQs follow the products — the questions
            someone still has once they have finished browsing — with the
            order guide beside them.

            The guide stands on its own when no FAQ is assigned to this page
            (Admin → FAQ → Page = home). It used to sit inside the FAQ block,
            so an empty FAQ list took ご注文の流れ off the homepage with it. */}
        <div className="section">
          {faqs.length > 0 ? (
            <div className={styles.faqRow}>
              <FaqList faqs={faqs} id="home-faq" initialCount={10} />
              <div className={styles.faqAside}>
                <OrderGuideAside />
              </div>
            </div>
          ) : (
            <OrderGuideAside wide />
          )}
        </div>

        {/* Promotional banners come last, after the products and FAQ. */}
        {banners.promo.length > 0 && (
          <section className="section">
            <h2 className="visually-hidden">サイトのご案内</h2>
            <PromoTiles banners={banners.promo} />
          </section>
        )}
      </div>
    </>
  );
}
