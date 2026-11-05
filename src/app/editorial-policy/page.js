import ContentPage from '@/components/content/ContentPage/ContentPage';
import LegalContent from '@/components/content/LegalContent/LegalContent';
import PageToc from '@/components/content/PageToc/PageToc';
import content from '@/content/legal/editorial-policy';
import { pageMetadata } from '@/lib/seo';

export const generateMetadata = pageMetadata('/editorial-policy', {
  title: '編集方針',
  description:
    'メディカ丸のコンテンツ制作における編集方針、情報源の取扱い、制作・確認体制についてご説明します。',
});

/* No placeholders left in this document, so no draft notice: the text is the
   real editorial policy and is presented as such. */
export default function EditorialPolicyPage() {
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
