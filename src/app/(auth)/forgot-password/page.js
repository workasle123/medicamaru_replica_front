import Link from 'next/link';

import styles from '../AuthLayout.module.css';
import ForgotPasswordForm from './ForgotPasswordForm';
import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'パスワードの再設定',
  description: 'パスワードをお忘れの場合の再設定手続きです。',
  path: '/forgot-password',
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <div className="container">
      <Breadcrumbs items={[{ name: 'パスワードの再設定' }]} />

      <div className={styles.wrap}>
        <div className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>パスワードの再設定</h1>
            <p className={styles.subtitle}>
              ご登録のメールアドレスを入力してください。再設定用のご案内をお送りします。
            </p>
          </header>

          <div className={styles.panel}>
            <ForgotPasswordForm />

            <p className={styles.meta}>
              <Link href="/login" className={styles.metaLink}>
                ログイン画面に戻る
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
