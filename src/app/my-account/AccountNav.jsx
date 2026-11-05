'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './AccountLayout.module.css';
import { logoutAction } from '@/app/(auth)/actions';

/**
 * The account menu.
 *
 * A Client Component for one reason: it marks where you are. The layout's
 * comment deferred that to "Phase 10" and it never arrived, which mattered
 * little while this was a vertical list in a sidebar — you could see the page
 * heading beside it. It matters now that phones get a horizontal row of
 * pills, where an unmarked rail gives no clue which of the six you are on.
 *
 * `aria-current="page"` rather than only a colour: the marker has to reach a
 * screen reader too, and it is what the CSS hooks onto, so the two can never
 * disagree.
 *
 * Matching is exact, not a prefix. /my-account is a prefix of every other
 * entry, so アカウントトップ would otherwise be marked current on all six.
 *
 * @param {Object} props
 * @param {{href: string, label: string}[]} props.items
 */
export default function AccountNav({ items }) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="マイページメニュー">
      <ul className={styles.navList}>
        {items.map((item) => {
          const current = pathname === item.href;

          return (
            <li key={item.href} className={styles.navItem}>
              <Link
                href={item.href}
                className={styles.navLink}
                aria-current={current ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}

        <li className={styles.navItem}>
          <form action={logoutAction}>
            <button type="submit" className={`${styles.navLink} ${styles.logout}`}>
              ログアウト
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
