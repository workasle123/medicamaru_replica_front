import Link from 'next/link';
import { redirect } from 'next/navigation';

import styles from '../../AuthLayout.module.css';
import SetPasswordForm from '../../SetPasswordForm';
import { confirmRegistrationAction } from '../../actions';
import Alert from '@/components/ui/Alert/Alert';
import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { isAuthenticated } from '@/lib/auth/session';

export const metadata = buildMetadata({
  title: '会員登録の完了',
  path: '/register/confirm',
  noIndex: true,
});

/**
 * Where the link in the 「会員登録のご確認」 email lands.
 *
 * Registering with an address that already has guest orders does not sign
 * anyone in: the backend emails this page's link to that address, and the
 * password is chosen here. Only someone who can read the inbox gets this far,
 * which is what makes it safe to hand them the orders placed as a guest.
 */
export default async function ConfirmRegistrationPage({ searchParams }) {
  if (await isAuthenticated()) redirect('/my-account');

  const { token } = await searchParams;

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: '新規会員登録', href: '/register' }, { name: '会員登録の完了' }]} />

      <div className={styles.wrap}>
        <div className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>会員登録の完了</h1>
            <p className={styles.subtitle}>
              パスワードを設定すると登録が完了し、これまでのご注文もマイページの注文履歴でご確認いただけます。
            </p>
          </header>

          <div className={styles.panel}>
            {typeof token === 'string' && token ? (
              <SetPasswordForm
                action={confirmRegistrationAction}
                token={token}
                submitLabel="パスワードを設定して登録を完了する"
                pendingLabel="登録しています…"
              />
            ) : (
              <Alert variant="error">
                リンクが正しくありません。確認メール内のリンクからもう一度開いてください。
              </Alert>
            )}

            <p className={styles.meta}>
              リンクの有効期限が切れた場合は、
              <Link href="/register" className={styles.metaLink}>
                会員登録
              </Link>
              からもう一度お手続きください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
