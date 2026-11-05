import Image from 'next/image';
import Link from 'next/link';

import styles from './SidebarPromos.module.css';

/**
 * SidebarPromos — the campaign page's left column.
 *
 * It replaces the category menu, the login box and the newsletter sign-up that
 * every other ContentPage carries there. The reasoning is particular to this
 * page: someone reading a list of coupons has already decided to buy, so the
 * column is better spent on the two things that move them forward — a way to
 * find a product when they do not know its name, and an account to spend the
 * coupon with. Only this page. The category menu stays everywhere else.
 *
 * Two promos, and deliberately different in kind. The first is supplied
 * artwork, so it is placed and not composed. The second is built from markup:
 * the artwork for it is a 1536×1024 landscape hero, and in a 200–240px column
 * that renders about 160px tall, which would put its 「新規会員登録」 at roughly
 * 8px. A card that can be read beats a picture of a card that cannot.
 */

/* An internal path, not the absolute https://medicamaru.com/… that was asked
   for. The コラム is proxied onto this same domain under /column, so the two
   resolve to the same page in production — but a relative path also works on
   staging and in development, where the absolute one would send a visitor to
   the live site mid-session. The trailing slash is load-bearing: next.config
   keeps it for exactly this proxy, and dropping it makes WordPress's Apache
   issue its own redirect using the backend's hostname. */
const BODY_PARTS_HREF = '/column/body-parts/';

export default function SidebarPromos() {
  return (
    <div className={styles.promos}>
      <Link href={BODY_PARTS_HREF} className={styles.banner}>
        <Image
          src="/banners/column-body-parts.webp"
          alt="薬の名前がわからない場合は、体の部位や病気から探すこともできます"
          width={1031}
          height={1526}
          className={styles.bannerImage}
          sizes="240px"
        />
      </Link>

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
