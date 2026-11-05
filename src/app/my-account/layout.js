
import Link from 'next/link';

import styles from './AccountLayout.module.css';
import AccountNav from './AccountNav';
import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import { getCurrentCustomer, getPoints } from '@/services/auth.service';
import { formatNumber } from '@/lib/format';

/**
 * Account area layout.
 *
 * The redirect for signed-out visitors lives in `src/proxy.js`, NOT here.
 * Calling `redirect()` from a layout is answered correctly for a full page
 * load but not for the RSC request a client-side navigation makes: clicking
 * マイページ got `307 Location: /my-account?_rsc`, pointing back at itself, and
 * the router rendered the site chrome around an empty middle. The proxy runs
 * before any route renders, so both request types get the same real redirect.
 *
 * What remains here is the case the proxy cannot see: a session cookie that
 * exists but whose token the backend no longer accepts. That is rendered as an
 * explicit message rather than another redirect, both because it avoids the
 * same RSC trap and because silently bouncing someone who believes they are
 * signed in reads as the site being broken.
 *
 * `force-dynamic` because everything here is per-customer and must never be
 * cached or prerendered.
 */
export const dynamic = 'force-dynamic';

const ACCOUNT_NAV = [
  { href: '/my-account', label: 'アカウントトップ' },
  { href: '/my-account/orders', label: '注文履歴' },
  { href: '/my-account/points', label: 'ポイント履歴' },
  { href: '/my-account/addresses', label: 'お届け先の管理' },
  { href: '/my-account/profile', label: '会員情報' },
  { href: '/my-account/referral', label: '紹介プログラム' },
  { href: '/wishlist', label: 'お気に入り' },
];

export default async function AccountLayout({ children }) {
  /* The balance comes from the WALLET, not the customer profile. The profile
     row has no loyalty-point column — normaliseCustomer pins pointsBalance at
     0 and says so — so the sidebar read 0 for every customer, including ones
     with hundreds of points. getPoints is the endpoint that has the figure the
     cart actually spends against. */
  const [customer, points] = await Promise.all([getCurrentCustomer(), getPoints()]);

  if (!customer) {
    return (
      <div className="container">
        <Breadcrumbs items={[{ name: 'マイページ' }]} />
        <div className={styles.expired}>
          <h1 className={styles.expiredTitle}>ログインの有効期限が切れました</h1>
          <p className={styles.expiredBody}>
            お手数ですが、もう一度ログインしてください。
          </p>
          {/* A LINK to a route handler, not a form posting a Server Action.

              The cookie still has to be cleared before /login will do anything
              but send the visitor back here — that part was always right. What
              was wrong was the shape: the action's reply carried both the
              Set-Cookie that deletes the session and the redirect, so a single
              dropped response left the server signed out, the browser still
              holding the cookie, and this button doing nothing however many
              times it was pressed. Responses abort intermittently on this host.

              A GET is retried by an ordinary reload, survives with JavaScript
              off, and needs no client bundle. See ../(auth)/session-expired. */}
          <Link href="/session-expired" className={styles.expiredCta}>
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: 'マイページ' }]} />

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.identity}>
            <p className={styles.greeting}>こんにちは</p>
            <p className={styles.name}>{customer.name} 様</p>
            <p className={styles.points}>
              <span className={styles.pointsLabel}>保有ポイント</span>
              <span className={`${styles.pointsValue} numeric`}>
                {formatNumber(points.balance)}pt
              </span>
            </p>
          </div>

          {/* Extracted to a Client Component so it can mark the current page.
              As a sidebar list that mattered little; as a row of pills on a
              phone an unmarked rail gives no sense of where you are. */}
          <AccountNav items={ACCOUNT_NAV} />
        </aside>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
