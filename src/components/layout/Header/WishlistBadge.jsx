'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import styles from './Header.module.css';
import { WISHLIST_CHANGED } from '@/lib/wishlist-events';

/**
 * WishlistBadge — the saved-product count on the header heart.
 *
 * There was no count here at all. Saving a product redirects to /wishlist, so
 * the number was visible on the page but never on the icon the customer came
 * back to later — the header said nothing about whether anything was saved.
 *
 * Built as CartBadge's twin rather than as something new, because the problem
 * is identical: the number is per-visitor, so it cannot be read during server
 * render without making every prerendered page dynamic. It is fetched after
 * hydration and re-read on three triggers:
 *
 *   - the pathname, for ordinary navigation (which covers saving from a
 *     product page, since that action redirects to /wishlist);
 *   - a WISHLIST_CHANGED event, for a change that does not move the customer
 *     — moving a favourite into the cart lands back on /wishlist;
 *   - returning to the tab, since another tab may have changed it.
 *
 * @param {Object} props
 * @param {string} [props.className] The phone tab bar positions its own badge.
 */
export default function WishlistBadge({ className }) {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  const read = useCallback(async () => {
    try {
      const res = await fetch('/api/wishlist/count', { cache: 'no-store' });
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

    window.addEventListener(WISHLIST_CHANGED, read);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener(WISHLIST_CHANGED, read);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [read]);

  if (count <= 0) return null;

  return (
    <>
      <span className={className || styles.badge} aria-hidden="true">
        {count > 99 ? '99+' : count}
      </span>
      <span className="visually-hidden">お気に入り{count}件</span>
    </>
  );
}
