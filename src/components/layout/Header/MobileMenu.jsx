'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';

import styles from './MobileMenu.module.css';
import { MAIN_NAV } from '@/constants/nav';
import { useAccountSummary } from './useAccountSummary';
import WishlistBadge from './WishlistBadge';

/**
 * MobileMenu — the hamburger and its drawer.
 *
 * Below 1024px the category nav is hidden and the wishlist, account and cart
 * links are desktop-only, so a phone had no navigation at all beyond the search
 * field. This is where that goes.
 *
 * Categories arrive as a prop rather than being fetched here: the header is a
 * Server Component and already has them, so refetching would be a second
 * request for data sitting one level up.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Category[]} [props.categories]
 */
export default function MobileMenu({ categories = [] }) {
  const [open, setOpen] = useState(false);
  const summary = useAccountSummary();
  const drawerId = useId();
  const closeRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();

    /* The page behind a full-height drawer must not scroll — otherwise a swipe
       inside the drawer moves the page under it. */
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) buttonRef.current?.focus({ preventScroll: true });
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls={drawerId}
        aria-label="メニューを開く"
      >
        <span className={styles.bars} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {open && (
        <>
          <button type="button" className={styles.scrim} aria-label="閉じる" onClick={close} />

          <nav
            id={drawerId}
            className={styles.drawer}
            aria-label="メインメニュー"
          >
            <header className={styles.head}>
              <span className={styles.headTitle}>メニュー</span>
              <button
                ref={closeRef}
                type="button"
                className={styles.close}
                onClick={close}
                aria-label="メニューを閉じる"
              >
                ✕
              </button>
            </header>

            <div className={styles.body}>
              {/* The account row first: these are the links that exist nowhere
                  else on a phone. */}
              {/* Same rule as the desktop bar: マイページ only once we know there
                  is an account behind it. Unresolved shows ログイン, which is the
                  safer of the two on a drawer that is only open for a moment —
                  a signed-in visitor who taps it lands on their account anyway,
                  since /login redirects them there. */}
              <ul className={styles.quick} role="list">
                <li>
                  {summary?.signedIn ? (
                    <Link href="/my-account" className={styles.quickLink} onClick={close}>
                      マイページ
                    </Link>
                  ) : (
                    <Link href="/login" className={styles.quickLink} onClick={close}>
                      ログイン
                    </Link>
                  )}
                </li>
                {/* Registration only when there is no account yet. Offering it to
                    someone already signed in wastes one of three slots. */}
                {!summary?.signedIn && (
                  <li>
                    <Link href="/register" className={styles.quickLink} onClick={close}>
                      新規登録
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/wishlist" className={styles.quickLink} onClick={close}>
                    お気に入り
                    {/* Below 1024px this drawer is the only way to the saved
                        list, so the count belongs here too — the header's own
                        heart is hidden at this width. */}
                    <WishlistBadge className={styles.quickCount} />
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className={styles.quickLink} onClick={close}>
                    カート
                  </Link>
                </li>
              </ul>

              <ul className={styles.nav} role="list">
                {MAIN_NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={styles.navLink} onClick={close}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {categories.length > 0 && (
                <section className={styles.cats}>
                  <h2 className={styles.catsTitle}>カテゴリー</h2>
                  <ul className={styles.catList} role="list">
                    {categories.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/category/${c.slug}`}
                          className={styles.catLink}
                          onClick={close}
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
