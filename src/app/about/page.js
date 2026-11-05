import ContentPage from '@/components/content/ContentPage/ContentPage';
import LegalContent from '@/components/content/LegalContent/LegalContent';
import PageToc from '@/components/content/PageToc/PageToc';
import content from '@/content/legal/about';
import { pageMetadata } from '@/lib/seo';

export const generateMetadata = pageMetadata('/about', {
  title: '運営者情報',
  description: 'メディカ丸の運営方針と運営者情報についてご案内します。',
});

/**
 * The 特定商取引法 operator details now live in about.js, under 運営体制について
 * as a `definitions` block. The 「所在地を準備中です」 notice that used to sit
 * here is gone with them — it was standing in for an address this page can
 * now state, and that section no longer points at a 特定商取引法 page that
 * does not exist.
 */
export default function AboutPage() {
  return (
    <ContentPage
      title={content.title}
      updatedAt="2026-10-07"
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
