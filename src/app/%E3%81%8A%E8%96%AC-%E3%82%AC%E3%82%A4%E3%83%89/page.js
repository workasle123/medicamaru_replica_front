import ContentPage from '@/components/content/ContentPage/ContentPage';
import LegalContent from '@/components/content/LegalContent/LegalContent';
import PageToc from '@/components/content/PageToc/PageToc';
import content, { faqs, GUIDE_PATH } from '@/content/guide/medicine-guide';
import { pageMetadata } from '@/lib/seo';
import { JsonLd, faqPage, abs } from '@/schema';

/**
 * お薬ガイド — /お薬-ガイド
 *
 * ## Why this directory has an unreadable name
 *
 * It is `お薬-ガイド` percent-encoded. A directory named with the Japanese
 * characters themselves is NEVER DISCOVERED — it does not reach the app
 * paths manifest at all, and the URL 404s with nothing logged. Verified
 * against this version: an ASCII route created at the same moment served
 * 200 immediately, the same page under the Japanese directory 404ed through
 * a dev-server restart, and renaming that directory to the encoded form
 * made it serve. So the encoded name is the route, not a workaround around
 * one.
 *
 * Decode it with `decodeURI('%E3%81%8A%E8%96%AC-%E3%82%AC%E3%82%A4%E3%83%89')`
 * if you are ever unsure which page you have open. The same string lives in
 * the content file as GUIDE_PATH, and every URL we write — canonical,
 * sitemap, footer link — comes from there, so the directory and the links
 * cannot disagree about where this page lives.
 *
 * No CMS_PAGE_SLUG entry: there is no admin SEO row for this page, so
 * pageMetadata falls through to the literal title and description below. Add
 * a mapping in lib/seo.js if one is created later.
 */
export const generateMetadata = pageMetadata(GUIDE_PATH, {
  title: 'お薬ガイド',
  description:
    'お薬の種類、成分と効果、副作用や飲み合わせ、保管方法から、ジェネリック医薬品の選び方、ご注文の流れ、お支払いと配送までをまとめたガイドです。',
});

export default function MedicineGuidePage() {
  /* Same strings the page renders — see the note on `faqs`. */
  const schema = faqPage(faqs, `${abs(GUIDE_PATH)}#faq`);

  return (
    <ContentPage
      title={content.title}
      updatedAt="2026-10-15"
      breadcrumbs={[{ name: 'お薬ガイド' }]}
      /* No `fitTitle`: that rule sets `text-wrap: nowrap` and sizes the type
         for about thirteen full-width characters, so this seventeen-character
         title ran off the right edge of a 390px screen instead of shrinking.
         Left to wrap, it takes two lines on a phone and one from 640px. */
      start={{
        label: '目次',
        phone: false,
        sticky: true,
        content: <PageToc sections={content.sections} />,
      }}
    >
      <JsonLd data={schema} />

      {/* Phone only: the side column renders after the article there, so a
          contents list in it would sit below the document it introduces. */}
      <PageToc sections={content.sections} collapsible />

      <LegalContent content={content} />
    </ContentPage>
  );
}
