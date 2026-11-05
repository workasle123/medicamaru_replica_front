import Link from 'next/link';

import ContentPage, { contentStyles as styles } from '@/components/content/ContentPage/ContentPage';
import ContactForm from './ContactForm';
import NoticeList from '@/components/sidebar/NoticeList/NoticeList';
import { contactColumns } from '@/components/sidebar/SideColumns';
import { pageMetadata } from '@/lib/seo';
import { isMockData } from '@/services/adapters';
import { listFaqGroups } from '@/services/home.service';
import { listNotices } from '@/services/notices.service';
import { listAllCategories } from '@/services/categories.service';

export const generateMetadata = pageMetadata('/contact', {
  title: 'お問い合わせ',
  description:
    'ご注文、配送、商品についてのお問い合わせはこちらのフォームからお送りください。',
});

export default async function ContactPage() {
  /* Side-column data only. None of it is required to show the form, so a
     failure here must not take the contact page down with it — that would
     leave a customer with no way to reach the shop at all. */
  const [categories, faqGroups, notices] = await Promise.all([
    listAllCategories().catch(() => []),
    listFaqGroups().catch(() => []),
    listNotices(5).catch(() => []),
  ]);

  const columns = contactColumns({
    categories,
    faqGroups,
    notices: notices.length > 0 ? <NoticeList notices={notices} /> : null,
  });

  return (
    <ContentPage
      title="お問い合わせ"
      lead="ご不明な点は、以下のフォームよりお気軽にお問い合わせください。"
      start={columns.start}
      end={columns.end}
      centerHeader
    >
      {/* The form now reaches the backend (Admin → Inquiry). Only the demo
          adapter has nowhere to put a message, so only it warns. This used to
          be the ONLY warning that the form went nowhere — and because it hangs
          off isMockData, live was the one place it never appeared. */}
      {isMockData && (
        <div className={styles.notice}>
          <strong>デモ表示です</strong>
          <br />
          サンプルデータで表示しているため、お問い合わせは送信されません。
        </div>
      )}

      <p>
        よくあるご質問は<Link href="/faq">FAQ</Link>にまとめています。
        送信前に一度ご確認いただくと、より早く解決する場合があります。
      </p>

      {/* The reply time moved to the 受付時間・返信目安 box in the side column;
          repeating it here read as filler. The order-number advice stays,
          because it is about the form directly below it. */}
      <p>
        ご注文に関するお問い合わせの場合は、ご注文番号をあわせてご入力いただくと、
        より早くご案内できます。
      </p>

      <ContactForm />
    </ContentPage>
  );
}
