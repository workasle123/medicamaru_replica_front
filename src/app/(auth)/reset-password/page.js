import Link from 'next/link';

import styles from '../AuthLayout.module.css';
import SetPasswordForm from '../SetPasswordForm';
import { resetPasswordAction } from '../actions';
import Alert from '@/components/ui/Alert/Alert';
import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: '新しいパスワードの設定',
  path: '/reset-password',
  noIndex: true,
});

/**
 * Where the button in the password-reset email lands:
 * /reset-password?token=…&type=customer (built by the backend's
 * forgotPassword). The page did not exist until now, so every reset link
 * opened a 404 and no customer could recover a forgotten password.
 *
 * Open to signed-in visitors as well — someone following a reset link has
 * proved the inbox either way, and success signs this browser out anyway.
 */
export default async function ResetPasswordPage({ searchParams }) {
  const { token, type } = await searchParams;
  const usable = typeof token === 'string' && token !== '' && (!type || type === 'customer');

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: 'パスワードの再設定', href: '/forgot-password' }, { name: '新しいパスワードの設定' }]} />

      <div className={styles.wrap}>
        <div className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>新しいパスワードの設定</h1>
            <p className={styles.subtitle}>
              新しいパスワードを入力してください。設定後は新しいパスワードでログインしていただけます。
            </p>
          </header>

          <div className={styles.panel}>
            {usable ? (
              <SetPasswordForm
                action={resetPasswordAction}
                token={token}
                submitLabel="パスワードを再設定する"
                pendingLabel="設定しています…"
              />
            ) : (
              <Alert variant="error">
                リンクが正しくありません。再設定メール内のリンクからもう一度開いてください。
              </Alert>
            )}

            <p className={styles.meta}>
              リンクの有効期限（30分）が切れた場合は、
              <Link href="/forgot-password" className={styles.metaLink}>
                パスワードの再設定
              </Link>
              からもう一度お申し込みください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
