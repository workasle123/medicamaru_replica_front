import ContentPage, { contentStyles as styles } from '@/components/content/ContentPage/ContentPage';
import LegalContent from '@/components/content/LegalContent/LegalContent';
import PageToc from '@/components/content/PageToc/PageToc';
import content from '@/content/legal/terms';
import { pageMetadata } from '@/lib/seo';

export const generateMetadata = pageMetadata('/terms', {
  title: '利用規約',
  description: 'お薬らくのご利用にあたっての規約です。',
});

/**
 * ⚠️ Still carries one placeholder: [管轄裁判所]. 受付時間 was filled in with
 * the support hours /about states (10:00〜18:00), and the 制定日 line was
 * removed rather than filled in — 最終更新日 above already dates the page
 * (both 2026-11-27).
 * The notice below stays until the court is filled in — a governing-court
 * clause naming no court is not something to publish quietly.
 */
export default function TermsPage() {
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
      <div className={styles.notice}>
        <strong>一部の項目を準備中です</strong>
        <br />
        管轄裁判所は確定後に掲載いたします。
      </div>

      {/* Phone only: the side column renders after the article there, so a
          contents list in it would sit below the document it introduces. */}
      <PageToc sections={content.sections} collapsible />

      <LegalContent content={content} />
    </ContentPage>
  );
}
