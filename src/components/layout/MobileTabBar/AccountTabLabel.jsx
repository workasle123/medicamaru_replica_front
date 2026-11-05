'use client';

import styles from './MobileTabBar.module.css';
import { useAccountSummary } from '@/components/layout/Header/useAccountSummary';

/**
 * The bottom tab's label: the customer's name once they are signed in.
 *
 * It shares useAccountSummary with the header, which deduplicates the request
 * at module level — so adding this costs no extra call, whichever mounts
 * first.
 *
 * `マイページ` stays as the fallback and as what renders while the answer is
 * unresolved. A tab label cannot show a placeholder the way the header's
 * account action does: it is five tabs wide and a blank one would shift the
 * row, so the generic word holds the space until there is a name to put in it.
 *
 * Names are not length-limited anywhere upstream, and this is the narrowest
 * label on the site — a fifth of a 390px screen. The CSS truncates rather than
 * wrapping, which would make this tab taller than the four beside it.
 *
 * @param {Object} props
 * @param {string} props.fallback  The label from MOBILE_TABS
 */
export default function AccountTabLabel({ fallback }) {
  const summary = useAccountSummary();
  const name = summary?.signedIn ? summary.name : null;

  return (
    <span className={`${styles.label} ${name ? styles.labelName : ''}`}>
      {name || fallback}
    </span>
  );
}
