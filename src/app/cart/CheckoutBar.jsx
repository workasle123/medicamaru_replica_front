import Link from 'next/link';

import styles from './CheckoutBar.module.css';
import { formatYenSuffix } from '@/lib/format';

/**
 * CheckoutBar — the total and the checkout button, pinned on a phone.
 *
 * On a desktop the summary sits in a sticky sidebar beside the items, so the
 * total and the button are always in view. On a phone that sidebar stacks
 * BELOW the item list, which means a cart of six products hides both behind a
 * scroll — you cannot see what you are about to pay without leaving the items,
 * and the one button that matters is off screen the whole time.
 *
 * So the same two things get pinned to the bottom on small screens only. The
 * sidebar keeps everything else: coupon, points, the line-by-line breakdown.
 * This is deliberately just the number and the action.
 *
 * `data-bottom-bar` is read by ChatLauncher, which docks in the same corner —
 * see the note there. It is an attribute rather than a class because a CSS
 * module hashes its class names, and the two components cannot see each
 * other's.
 *
 * @param {Object} props
 * @param {number} props.total
 * @param {number} props.itemCount
 */
export default function CheckoutBar({ total, itemCount }) {
  if (!itemCount) return null;

  return (
    <div className={styles.bar} data-bottom-bar>
      <div className={styles.figures}>
        <span className={styles.label}>合計（{itemCount}点）</span>
        <span className={`${styles.total} numeric`}>{formatYenSuffix(total)}</span>
      </div>

      <Link href="/checkout" className={styles.action}>
        ご注文手続きへ
      </Link>
    </div>
  );
}
