import ContentPage, { contentStyles as styles } from '@/components/content/ContentPage/ContentPage';
import LegalContent from '@/components/content/LegalContent/LegalContent';
import PageToc from '@/components/content/PageToc/PageToc';
import content from '@/content/legal/privacy';
import { pageMetadata } from '@/lib/seo';

export const generateMetadata = pageMetadata('/privacy', {
  title: 'プライバシーポリシー',
  description: 'お薬らくにおける個人情報の取り扱いについてご説明します。',
});

/** ⚠️ Still carries [最終改定日] — hence the notice. */
export default function PrivacyPage() {
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
      <div className={styles.notice}>
        <strong>一部の項目を準備中です</strong>
        <br />
        最終改定日は確定後に掲載いたします。
      </div>

      {/* Phone only: the side column renders after the article there, so a
          contents list in it would sit below the document it introduces. */}
      <PageToc sections={content.sections} collapsible />

      <LegalContent content={content} />
    </ContentPage>
  );
}
