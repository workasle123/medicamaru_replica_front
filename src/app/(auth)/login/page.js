import Link from 'next/link';
import { redirect } from 'next/navigation';

import styles from '../AuthLayout.module.css';
import LoginForm from './LoginForm';
import ResendForm from '../ResendForm';
import Alert from '@/components/ui/Alert/Alert';
import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import { pageMetadata } from '@/lib/seo';
import { isAuthenticated } from '@/lib/auth/session';
import { safePath } from '@/lib/auth/redirect';
import { getCurrentCustomer } from '@/services/auth.service';
import { isMockData } from '@/services/adapters';
import { DEMO_CREDENTIALS } from '@/services/adapters/mock/auth';

export const generateMetadata = pageMetadata('/login', {
  title: 'ログイン',
  description: 'お薬らくのアカウントにログインします。',
  noIndex: true,
});

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  const next = typeof sp?.next === 'string' ? sp.next : '';

  /* VALIDITY, NOT PRESENCE.

     This used to be `if (await isAuthenticated()) redirect('/my-account')`,
     and `isAuthenticated()` only answers whether the cookie EXISTS. The
     cookie carries its own max-age and outlives the token inside it, so once
     a session expired server-side this page sent the customer to /my-account,
     which validates properly, finds nothing, and shows 「ログインの有効期限が
     切れました」. Every door led to the same locked room — and clearing the
     browser cache did not help, because the thing at fault was a cookie.
     /register had the identical bug.

     Presence is still checked first, and only then is the token verified:
     a visitor with no cookie at all — most of them — costs no backend call. */
  if (sp?.cleared !== '1' && (await isAuthenticated())) {
    if (await getCurrentCustomer()) redirect('/my-account');

    /* The cookie is real but the token behind it is dead. A Server Component
       may not delete a cookie, so the removal happens in the route handler,
       which comes straight back here with `cleared=1`. */
    const back = next ? `/login?next=${encodeURIComponent(safePath(next, '/my-account'))}` : '/login';
    redirect(`/session-expired?to=${encodeURIComponent(back)}`);
  }
  // Arrived from a successful /reset-password.
  const justReset = sp?.reset === '1';
  /* Sent here by /register/verify when the link could not sign them in. The
     verify route has no screen of its own — this page already holds the login
     form and the resend form, which is everything either outcome needs. */
  const verify = typeof sp?.verify === 'string' ? sp.verify : '';

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: 'ログイン' }]} />

      <div className={styles.wrap}>
        <div className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>ログイン</h1>
            <p className={styles.subtitle}>
              ご登録のメールアドレスとパスワードを入力してください。
            </p>
          </header>

          <div className={styles.panel}>
            {/* Development helper. Disappears the moment DATA_SOURCE=api. */}
            {isMockData && (
              <div className={styles.demo}>
                <Alert variant="info" title="開発用のテストアカウント">
                  {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
                </Alert>
              </div>
            )}

            {justReset && (
              <div className={styles.demo}>
                <Alert variant="success" title="パスワードを再設定しました">
                  新しいパスワードでログインしてください。
                </Alert>
              </div>
            )}

            {verify === 'done' && (
              <div className={styles.demo}>
                <Alert variant="success" title="メールアドレスを確認しました">
                  ログインしてお買い物をお楽しみください。
                </Alert>
              </div>
            )}

            {verify === 'expired' && (
              <div className={styles.demo}>
                <Alert variant="error" title="リンクの有効期限が切れています">
                  下記よりログインいただくか、確認メールを再送信してください。
                </Alert>
                <ResendForm />
              </div>
            )}

            {/* Deliberately not an error. The usual cause is a link that was
                already used, which means the address IS confirmed and the
                account is fine — telling them something went wrong would send
                them chasing a problem they do not have. */}
            {verify === 'invalid' && (
              <div className={styles.demo}>
                <Alert variant="info" title="このリンクはご利用いただけません">
                  すでにご確認が完了している場合は、そのままログインいただけます。
                </Alert>
              </div>
            )}

            <LoginForm next={next} />

            <Link href="/forgot-password" className={styles.helper}>
              パスワードをお忘れの方
            </Link>

            <p className={styles.meta}>
              アカウントをお持ちでない方は{' '}
              <Link href="/register" className={styles.metaLink}>
                新規会員登録
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
