import Image from 'next/image';
import Link from 'next/link';
import styles from './Header.module.css';
import SearchBar from '@/components/search/SearchBar/SearchBar';
import { SITE } from '@/constants/site';
import { MAIN_NAV } from '@/constants/nav';
import { listAllCategories } from '@/services/categories.service';
import LineMark from '@/components/ui/LineMark/LineMark';
import CartBadge from './CartBadge';
import WishlistBadge from './WishlistBadge';
import MobileMenu from './MobileMenu';
import AccountAction from './AccountAction';
import DeliverTo from './DeliverTo';

/**
 * Header — global site header.
 *
 * Server Component. Only the search input inside it is a Client Component,
 * which keeps the header's JavaScript cost close to zero.
 *
 * The logo is a placeholder wordmark, isolated here so dropping in the real
 * asset later is a one-file change (docs/DECISIONS.md D8).
 */
export default async function Header() {
  /* Categories power the nav dropdown. Safe to fetch here without losing
     static rendering — unlike the cart badge, this reads no cookies and no
     request-time API, so pages stay prerenderable.

     EVERY active category, not the homepage's flagged subset. 「カテゴリーから
     探す」 is a promise about the catalogue, and the homepage tick is an
     editorial choice about which rails to feature — reusing it here hid three
     categories and the 270 products under them from the site's main way in. */
  const categories = await listAllCategories();

  /* Server Component, so this never reaches the browser bundle and needs no
     NEXT_PUBLIC_ prefix. */
  const lineUrl = process.env.LINE_ACCOUNT_URL || '';

  return (
    <header className={styles.header}>
      {/* The utility strip that sat above the logo is gone. Its two links live
          in the main nav below, and the trust line it used to carry is in the
          footer, so nothing was lost with it. */}

      {/* Main bar */}
      <div className="container">
        <div className={styles.bar}>
          {/* Full lockup — capsule mark plus the お薬らく wordmark — with a
            {/* Full lockup — capsule mark plus the お薬らく wordmark, shown
                at every width.

              Both files are cropped to the artwork’s ink. The supplied PNG sits
              on a 420×208 canvas of which 46% is transparent padding, so drawing
              it whole meant a 72px box to show 40px of visible logo. Cropped, the
              box IS the logo and the height below is what you actually see.

              NOT `unoptimized`: these are raster, so Next serves them as WebP or
              AVIF at the density each device needs. The old files were SVG, where
              optimising would have rasterised away the point of shipping vector. */}
          <Link href="/" className={styles.logo} aria-label={`${SITE.name} ホーム`}>
            {/* unoptimized: the logo is one small fixed-size file we ship
                ourselves, so the optimiser adds a request and a cache entry
                and saves nothing. It also keeps the address honest — the logo
                is /brand/logo.png rather than
                /_next/image?url=%2Fbrand%2Flogo.png&w=640&q=75, which is what
                opening it in a new tab shows you. */}
            <Image
              src="/brand/logo.png"
              alt={SITE.name}
              width={164}
              height={168}
              className={styles.logoFull}
              priority
              unoptimized
            />
          </Link>

            {/* One field, in the bar. Below 1024px it wraps to a line of its
                own via flex-basis rather than being a second component that
                CSS hides — the header used to ship two search forms. */}
            {/* Search and the delivery destination share ONE grid cell. The bar
                is `1fr <capped> 1fr` so that the middle column is centred
                whatever the logo and actions measure; adding a fourth child
                would have pushed the actions onto a second row and given up that
                centring. Widened to fit both instead. */}
            <div className={styles.searchSlot}>
              {/* Where this visitor's orders go, to the LEFT of the field —
                  it is read once on arrival and then ignored, so it sits before
                  the thing being used rather than interrupting the path from the
                  field to the search button.

                  Client-side, like the cart badge: reading the session cookie in
                  this Server Component would make every page on the site
                  dynamic. */}
              <DeliverTo />

              <SearchBar />
            </div>


          {/* Order is LINE, お気に入り, カート, お知らせ, マイページ — and it is the
              MARKUP order, not flex `order`. Reordering visually while leaving
              the DOM alone moves the icons for a mouse and leaves them where
              they were for the keyboard, so tab order and reading order
              disagree; a screen reader would still announce the old sequence.
              Anything that changes this row has to change it here. */}
          <div className={styles.actions}>
            {/* LINE, when an account is configured. Rendered from the env var
                rather than hardcoded, and simply absent when it is unset —
                the same rule SOCIAL_LINKS and the homepage banner follow, so
                a deployment without a LINE account shows no dead icon.

                A real external link: rel="noopener" because it opens a new
                tab, and no `noreferrer`, since LINE's own analytics being
                able to see the referrer is the point of the link. */}
            {lineUrl && (
              <a
                href={lineUrl}
                className={`${styles.action} ${styles.lineAction}`}
                target="_blank"
                rel="noopener"
              >
                <LineMark size={22} />
                <span className={styles.actionLabel}>LINE</span>
              </a>
            )}

            <Link href="/wishlist" className={`${styles.action} ${styles.desktopOnlyAction}`}>
              {/* Same iconWrap/badge pairing as the cart beside it — the
                  wrapper is what the badge positions against. */}
              <span className={styles.iconWrap}>
                <IconHeart />
                <WishlistBadge />
              </span>
              <span className={styles.actionLabel}>お気に入り</span>
            </Link>

            <Link href="/cart" className={`${styles.action} ${styles.desktopOnlyAction}`}>
              <span className={styles.iconWrap}>
                <IconCart />
                <CartBadge />
              </span>
              <span className={styles.actionLabel}>カート</span>
            </Link>

            {/* お知らせ at every width. The notices were previously reachable
                only from the footer, which on a phone is past the whole page. */}
            <Link href="/notices" className={styles.action}>
              <IconBell />
              <span className={styles.actionLabel}>お知らせ</span>
            </Link>

            {/* マイページ or ログイン, decided after hydration — this used to be a
                fixed マイページ link that sent signed-out visitors to a redirect.
                Last in the row: it is the only action whose label changes
                length once a name is known, so the growth happens at the end
                rather than pushing the other four sideways. */}
            <AccountAction />

            {/* The menu button only below 1024px, where the nav row and
                these action links are hidden. The AI assistant used to sit
                here; it is docked above the bottom tab bar now (ChatLauncher,
                rendered from the root layout). */}
            <MobileMenu categories={categories} />
          </div>
        </div>
      </div>

      {/* Category navigation — curated, not a 257-link mega menu */}
      <nav className={styles.nav} aria-label="メインナビゲーション">
        <div className="container">
          <ul className={styles.navList} role="list">
            {MAIN_NAV.map((item) => (
              <li
                key={item.href}
                className={item.dropdown ? styles.navItemDropdown : undefined}
              >
                <Link href={item.href} className={styles.navLink}>
                  {item.label}
                  {item.dropdown && <ChevronDown />}
                </Link>

                {item.dropdown === 'categories' && categories.length > 0 && (
                  <div className={styles.dropdown}>
                    <ul className={styles.dropdownGrid} role="list">
                      {categories.map((category) => (
                        <li key={category.slug} className={styles.dropdownCat}>
                          <Link
                            href={`/category/${category.slug}`}
                            className={styles.dropdownCatLink}
                          >
                            {category.name}
                            {typeof category.productCount === 'number' && (
                              <span className={styles.dropdownCount}>
                                {category.productCount}
                              </span>
                            )}
                          </Link>

                          {category.children?.length > 0 && (
                            <ul className={styles.dropdownSubs} role="list">
                              {category.children.map((child) => (
                                <li key={child.slug}>
                                  <Link
                                    href={`/category/${child.slug}`}
                                    className={styles.dropdownSubLink}
                                  >
                                    {child.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Was 全商品を見る → /products, which listed nothing.
                        The category index is the real "see everything" page. */}
                    <p className={styles.dropdownFooter}>
                      <Link href="/category">カテゴリー一覧を見る →</Link>
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}

/* Inline icons — avoids an icon-font dependency and the FOUC that comes
   with it. Each is decorative; the adjacent text carries the meaning. */

function ChevronDown() {
  return (
    <svg className={styles.navChevron} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" />
      <path d="M13.7 19a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1Z" />
    </svg>
  );
}


function IconCart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h2.5l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h9a1.5 1.5 0 0 0 1.5-1.2L21 7H5.2" />
    </svg>
  );
}
