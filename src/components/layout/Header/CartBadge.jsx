'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import styles from './Header.module.css';
import { CART_CHANGED } from '@/lib/cart-events';

/**
 * CartBadge — the item count on the header cart icon.
 *
 * Deliberately client-side. Reading the cart cookie during server render
 * would force every page into dynamic rendering and cost us the statically
 * prerendered product and category pages, which matter far more than showing
 * this number a few hundred milliseconds earlier.
 *
 * ## When it re-reads
 *
 * It used to key on the pathname alone, which is the one thing adding to the
 * cart does not change: the action ends in `redirect(`${returnTo}?added=1`)`,
 * landing back on the page the customer was already on. The badge therefore
 * only ever caught up on the next navigation — which is exactly the
 * "it updates on refresh" this fixes.
 *
 * Three triggers now:
 *   - the pathname, for ordinary navigation;
 *   - a CART_CHANGED event, which the forms fire once their write has landed
 *     — this is the one that does the real work, since adding to the cart
 *     never changes the pathname;
 *   - returning to the tab, since the cart may have changed in another one.
 *
 * It takes a className because there are two cart icons: the one in the
 * desktop header and the one in the phone tab bar, which had no count at all
 * until now. Each positions its own badge; the number and when to read it are
 * the same either way.
 *
 * Not the query string. useSearchParams() in the root layout forces a
 * Suspense bail-out and would un-static every prerendered page — the exact
 * cost this component was written to avoid. The build says so plainly:
 * "useSearchParams() should be wrapped in a suspense boundary at page /404".
 */
export default function CartBadge({ className }) {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  const read = useCallback(async () => {
    try {
      const res = await fetch('/api/cart/count', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setCount(data?.count ?? 0);
    } catch {
      // A failed badge fetch is not worth surfacing to the customer.
    }
  }, []);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect --
       read() is async: its setCount runs after two awaits, so it cannot
       cascade a render synchronously. The rule traces setState into the
       callback without seeing the await boundary in between. */
    read();
  }, [read, pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') read();
    };

    window.addEventListener(CART_CHANGED, read);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener(CART_CHANGED, read);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [read]);

  if (count <= 0) return null;

  return (
    <>
      <span className={className || styles.badge} aria-hidden="true">
        {count > 99 ? '99+' : count}
      </span>
      <span className="visually-hidden">商品{count}点</span>
    </>
  );
}
