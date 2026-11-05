'use client';

import Link from 'next/link';

import styles from './Header.module.css';
import { useAccountSummary } from './useAccountSummary';

/**
 * The account link in the header actions.
 *
 * マイページ when signed in, ログイン／新規登録 when not. The header used to show
 * マイページ unconditionally, which sent a signed-out visitor to a page that
 * immediately redirected them to a login form — the site appearing to log them
 * out on every click.
 *
 * While the answer is unresolved it renders a placeholder of the same width
 * rather than assuming. Assuming is what this replaces, and either wrong guess
 * is worse than a few hundred milliseconds of nothing: showing マイページ misleads
 * the signed-out, showing ログイン insults the signed-in.
 */
export default function AccountAction() {
  const summary = useAccountSummary();

  if (summary === null) {
    return (
      <span
        className={`${styles.action} ${styles.desktopOnlyAction} ${styles.actionPending}`}
        aria-hidden="true"
      >
        <IconUser />
        <span className={styles.actionLabel}>&nbsp;</span>
      </span>
    );
  }

  if (summary.signedIn) {
    /* The customer's own name once there is one. マイページ is the fallback,
       not the default: the backend does not require a name, so it can come
       back null, and an empty label would leave an icon with nothing beside
       it. The title carries the whole thing when the CSS truncates it. */
    const label = summary.name || 'マイページ';

    return (
      <Link
        href="/my-account"
        className={`${styles.action} ${styles.desktopOnlyAction}`}
        title={summary.name ? `${summary.name} さんのマイページ` : undefined}
      >
        <IconUser />
        <span className={`${styles.actionLabel} ${styles.actionLabelName}`}>{label}</span>
      </Link>
    );
  }

  /* Both offered, not just ログイン. Someone who has never bought here has no
     reason to read a sign-in link as their way in, and burying 新規会員登録 one
     page deeper is a step lost at exactly the point a new visitor decides whether
     to bother.

     Rendered as one control with two links rather than two separate actions: two
     would each carry an icon and a 44px target and push the cart along the row,
     which the bar does not have width for at 1024px. */
  return (
    <span className={`${styles.action} ${styles.desktopOnlyAction} ${styles.authPair}`}>
      <IconUser />
      <span className={styles.authLinks}>
        <Link href="/login" className={styles.authLink}>
          ログイン
        </Link>
        <span className={styles.authDivider} aria-hidden="true">
          /
        </span>
        <Link href="/register" className={styles.authLink}>
          新規登録
        </Link>
      </span>
    </span>
  );
}

function IconUser() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
    </svg>
  );
}
