import Link from 'next/link';
import { redirect } from 'next/navigation';

import styles from '../AuthLayout.module.css';
import RegisterForm from './RegisterForm';
import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import { pageMetadata } from '@/lib/seo';
import { isAuthenticated } from '@/lib/auth/session';
import { getCurrentCustomer } from '@/services/auth.service';
import { REFERRAL_PARAM } from '@/lib/referral';

export const generateMetadata = pageMetadata('/register', {
  title: '新規会員登録',
  description: 'メディカ丸の会員登録ページです。登録は無料です。',
  noIndex: true,
});

/**
 * @param {Object} props
 * @param {Promise<Record<string, string|string[]>>} props.searchParams
 */
export default async function RegisterPage({ searchParams }) {
  /* ?ref= is the key the referral link carries, and it was being ignored:
     the link from the account panel landed here and left the customer to type
     the code by hand off whatever they had been sent. Prefilled, and still
     editable — the field stays a normal input so a code from elsewhere, or a
     corrected one, can be entered over it. */
  const params = await searchParams;
  const raw = params?.[REFERRAL_PARAM];
  const referralCode = (Array.isArray(raw) ? raw[0] : raw)?.trim() || '';

  /* VALIDITY, NOT PRESENCE — see the long note in ../login/page.js. A cookie
     left behind by an expired session used to bounce 新規登録 to /my-account,
     which then said the login had expired, with no way out.

     Someone who clicked 新規登録 wants the register form, so the round trip
     comes back HERE rather than to /login, and carries the referral code with
     it — losing that to a session repair would cost the referrer their
     credit. */
  if (params?.cleared !== '1' && (await isAuthenticated())) {
    if (await getCurrentCustomer()) redirect('/my-account');

    const back = referralCode
      ? `/register?${REFERRAL_PARAM}=${encodeURIComponent(referralCode)}`
      : '/register';
    redirect(`/session-expired?to=${encodeURIComponent(back)}`);
  }

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: '新規会員登録' }]} />

      <div className={styles.wrap}>
        <div className={`${styles.card} ${styles.cardWide}`}>
          <header className={styles.header}>
            <h1 className={styles.title}>新規会員登録</h1>
            <p className={styles.subtitle}>
              ご登録は無料です。ご注文の履歴確認やお気に入りの保存にご利用いただけます。
            </p>
          </header>

          <div className={styles.panel}>
            <RegisterForm referralCode={referralCode} />

            <p className={styles.meta}>
              すでにアカウントをお持ちの方は{' '}
              <Link href="/login" className={styles.metaLink}>
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
