import Link from 'next/link';
import styles from './MobileTabBar.module.css';
import AccountTabLabel from './AccountTabLabel';
import CartBadge from '@/components/layout/Header/CartBadge';
import { MOBILE_TABS } from '@/constants/nav';

/**
 * MobileTabBar — persistent bottom navigation on small screens.
 *
 * Server Component, with one Client Component inside it: the cart tab now
 * carries the same count as the desktop header. It had none at all, which on
 * a phone meant the item count was invisible everywhere — the tab bar is the
 * only cart icon on screen at that width.
 */
export default function MobileTabBar() {
  return (
    <nav className={styles.tabbar} aria-label="モバイルナビゲーション">
      {MOBILE_TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} className={styles.tab}>
          <span className={styles.iconWrap}>
            <TabIcon name={tab.icon} />
            {tab.icon === 'cart' && <CartBadge className={styles.badge} />}
          </span>
          {tab.icon === 'user' ? (
            <AccountTabLabel fallback={tab.label} />
          ) : (
            <span className={styles.label}>{tab.label}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

function TabIcon({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case 'cart':
      return (
        <svg {...common}>
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M2 3h2.5l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h9a1.5 1.5 0 0 0 1.5-1.2L21 7H5.2" />
        </svg>
      );
    case 'user':
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
  }
}
