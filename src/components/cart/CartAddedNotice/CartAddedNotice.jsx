'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import styles from './CartAddedNotice.module.css';

/** Long enough to read and act on, short enough not to sit over the page. */
const DISMISS_MS = 9000;

/**
 * CartAddedNotice — "added to cart", with the way to the cart.
 *
 * addToCartAction has always redirected to `${returnTo}?added=1`, and its own
 * comment said that `added=1` is "what the destination reads to confirm the
 * item landed". Nothing read it. Adding from a product page therefore looked
 * like a page that reloaded itself: the only feedback was the cart count, and
 * on a phone that number is in the tab bar at the opposite end of the screen
 * from the button that was just tapped.
 *
 * So this is the destination that reads it. It gives the customer the two
 * things they want at that moment — confirmation, and a way to the cart —
 * without taking them off the product they are still looking at.
 *
 * WHY NOT READ IT ON THE SERVER. Accepting `searchParams` in the product page
 * would opt all ~3,000 prerendered product pages into dynamic rendering. That
 * is the same constraint behind /api/cart/count and the review form. Here it
 * means `useSearchParams()`, which needs a Suspense boundary around it — the
 * page provides one, and only this subtree is client-rendered.
 *
 * The parameter is stripped once shown, with replaceState rather than a
 * router navigation: re-rendering the page to clean up its own URL would cost
 * a round trip, and a reload or a shared link should not re-announce an add
 * that happened minutes ago.
 */
export default function CartAddedNotice() {
  const params = useSearchParams();
  const added = params.get('added') === '1';

  /* CAPTURED AT MOUNT, and deliberately not read again.
     Next patches history.replaceState to keep its router in step, so stripping
     the parameter below re-runs useSearchParams() — and a toast whose
     visibility was derived from `added` closed itself in the same tick it
     opened. Seeding state from the first render decouples the two: the URL is
     cleaned up, this stays open, and nothing else can close it but the timer
     or the customer.

     Seeding rather than setting from an effect also keeps the first paint
     right; a toast that appears one render late flickers in. */
  const [open, setOpen] = useState(added);

  useEffect(() => {
    if (!added) return undefined;

    /* Stripped immediately, not on dismiss. The customer may navigate away
       first, and a back button landing on ?added=1 would announce an add that
       happened minutes ago — as would sharing the URL. */
    const url = new URL(window.location.href);
    url.searchParams.delete('added');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);

    const timer = setTimeout(() => setOpen(false), DISMISS_MS);
    return () => clearTimeout(timer);
  }, [added]);

  if (!open) return null;

  return (
    /* `status`, not `alert`: this is a confirmation, and alert interrupts
       whatever a screen reader is currently saying. */
    <div className={styles.toast} role="status" aria-live="polite">
      <p className={styles.message}>
        <span className={styles.tick} aria-hidden="true">
          ✓
        </span>
        カートに追加しました
      </p>

      <div className={styles.actions}>
        <Link href="/cart" className={styles.view}>
          カートを見る
        </Link>
        <button
          type="button"
          className={styles.close}
          onClick={() => setOpen(false)}
          aria-label="閉じる"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
