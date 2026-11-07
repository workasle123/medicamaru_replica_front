import Link from 'next/link';

import styles from './SidebarPromos.module.css';

/**
 * SidebarPromos — the campaign page's left column.
 *
 * It replaces the category menu, the login box and the newsletter sign-up that
 * every other ContentPage carries there. The reasoning is particular to this
 * page: someone reading a list of coupons has already decided to buy, so the
 * column is better spent on the thing that moves them forward — an account to
 * spend the coupon with. Only this page. The category menu stays everywhere else.
 *
 * One promo, built from markup rather than artwork: a 1536×1024 landscape hero
 * would render about 160px tall in a 200–240px column, which would put its
 * 「新規会員登録」 at roughly 8px. A card that can be read beats a picture of a
 * card that cannot.
 */

export default function SidebarPromos() {
  return (
    <div className={styles.promos}>
      <section className={styles.card} aria-labelledby="sidebar-register-title">
        <h2 id="sidebar-register-title" className={styles.cardTitle}>
          はじめての方へ
        </h2>
        <p className={styles.cardBody}>
          会員登録をすると、クーポンのご利用や注文履歴の確認ができます。
        </p>
        <Link href="/register" className={styles.cardCta}>
          新規会員登録
        </Link>
        <p className={styles.cardFoot}>
          すでにアカウントをお持ちの方は
          <Link href="/login" className={styles.cardLink}>
            ログイン
          </Link>
        </p>
      </section>
    </div>
  );
}
