import ContentPage from '@/components/content/ContentPage/ContentPage';
import LegalContent from '@/components/content/LegalContent/LegalContent';
import PageToc from '@/components/content/PageToc/PageToc';
import aboutContent from '@/content/legal/about';
import { pageMetadata } from '@/lib/seo';
import { getFreeShippingThreshold } from '@/services/shipping.service';

export const generateMetadata = pageMetadata('/about', {
  title: '運営者情報・特定商取引法に基づく表示',
  description:
    'お薬らくの運営方針と運営者情報、特定商取引法に基づく表示（販売価格・送料・お支払い・配送・キャンセル・返品・返金）についてご案内します。',
});

/**
 * The 特定商取引法に基づく表示 lives in about.js as a `table` block, the
 * operator details in its first group. The 「所在地を準備中です」 notice that
 * used to sit here is gone — it was standing in for an address this page can
 * now state.
 *
 * The threshold is fetched here because the 送料 row prints it, and it is the
 * admin's 送料無料 offer rather than a constant. It reads the same cached
 * offers list the /campaign page does, so it adds no request the site was not
 * making anyway.
 */
export default async function AboutPage() {
  const content = aboutContent({ freeShippingThreshold: await getFreeShippingThreshold() });

  return (
    <ContentPage
      title={content.title}
      updatedAt="2026-11-27"
      start={{
        label: '目次',
        phone: false,
        sticky: true,
        content: <PageToc sections={content.sections} />,
      }}
    >
      {/* Phone only: the side column renders after the article there, so a
          contents list in it would sit below the document it introduces. */}
      <PageToc sections={content.sections} collapsible />

      <LegalContent content={content} />
    </ContentPage>
  );
}
