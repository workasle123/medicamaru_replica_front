import ContentPage from '@/components/content/ContentPage/ContentPage';
import LegalContent from '@/components/content/LegalContent/LegalContent';
import PageToc from '@/components/content/PageToc/PageToc';
import content from '@/content/legal/pharmaceutical-law';
import { pageMetadata } from '@/lib/seo';

export const generateMetadata = pageMetadata('/pharmaceutical-law', {
  title: '医薬品医療機器等法（薬機法）について',
  description:
    '薬機法がどのような法律か、個人輸入する製品と国内承認品の違い、当サイトの情報提供との関係についてご説明します。',
});

export default function PharmaceuticalLawPage() {
  return (
    <ContentPage
      title={content.title}
      updatedAt="2026-09-24"
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
