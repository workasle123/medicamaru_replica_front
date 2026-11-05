import Link from 'next/link';
import Button from '@/components/ui/Button/Button';
import styles from './StatusPage.module.css';

export const metadata = {
  title: 'ページが見つかりません',
  robots: { index: false, follow: true },
};

/**
 * 404. Offers routes forward rather than dead-ending — a 404 is a navigation
 * failure, and the page should help recover from it.
 */
export default function NotFound() {
  return (
    <div className="container section">
      <div className={styles.panel}>
        <p className={styles.code}>404</p>
        <h1>お探しのページが見つかりませんでした</h1>
        <p className={styles.lead}>
          URLが変更されたか、削除された可能性があります。
          お手数ですが、以下からお探しください。
        </p>

        <div className={styles.actions}>
          <Button href="/">ホームへ戻る</Button>
          <Button href="/category" variant="outline">カテゴリーから探す</Button>
        </div>

        <p className={styles.footnote}>
          お探しの商品が見つからない場合は、
          <Link href="/contact">お問い合わせ</Link>
          からご連絡ください。
        </p>
      </div>
    </div>
  );
}
