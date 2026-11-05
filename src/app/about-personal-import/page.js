import ContentPage from '@/components/content/ContentPage/ContentPage';
import LegalContent from '@/components/content/LegalContent/LegalContent';
import PageToc from '@/components/content/PageToc/PageToc';
import content from '@/content/legal/about-personal-import';
import { pageMetadata } from '@/lib/seo';

export const generateMetadata = pageMetadata('/about-personal-import', {
  title: '個人輸入について',
  description:
    '個人輸入の仕組み、ご利用の流れ、国内購入との違い、通関や転売の禁止など、ご注文前に知っておきたい点をご説明します。',
});

export default function AboutPersonalImportPage() {
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
