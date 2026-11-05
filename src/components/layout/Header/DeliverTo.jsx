'use client';

import Link from 'next/link';

import styles from './DeliverTo.module.css';
import { useAccountSummary } from './useAccountSummary';

/**
 * The delivery destination, beside the search field.
 *
 * Shows where this visitor's orders go, and is a link to change it. Three
 * states, because a header line that says nothing useful is worse than one that
 * asks for something: signed out invites signing in, signed in without an
 * address invites adding one, signed in with an address shows it.
 *
 * Labelled お届け先 rather than "Delivered to" — the rest of the site is in
 * Japanese and this sits between a Japanese search field and a Japanese nav, so
 * an English label would be the only English on the row.
 *
 * The address is deliberately partial: prefecture and city, not the street. It
 * is a reassurance that the right destination is selected, not the address
 * itself, and a header is a poor place to display someone's full home address to
 * whoever is looking over their shoulder.
 */
export default function DeliverTo() {
  const summary = useAccountSummary();

  /* Reserved width while unresolved, so the search field beside it does not
     jump once the answer arrives. */
  if (summary === null) {
    return <span className={`${styles.root} ${styles.pending}`} aria-hidden="true" />;
  }

  if (!summary.signedIn) {
    return (
      <Link href="/login" className={styles.root}>
        <IconPin />
        <span className={styles.text}>
          <span className={styles.label}>お届け先</span>
          <span className={styles.value}>ログインして設定</span>
        </span>
      </Link>
    );
  }

  if (!summary.address) {
    return (
      <Link href="/my-account/addresses" className={styles.root}>
        <IconPin />
        <span className={styles.text}>
          <span className={styles.label}>お届け先</span>
          <span className={styles.value}>お届け先を登録</span>
        </span>
      </Link>
    );
  }

  const { label, prefecture, city } = summary.address;

  return (
    <Link
      href="/my-account/addresses"
      className={styles.root}
      title={`${label}：${prefecture}${city}`}
    >
      <IconPin />
      <span className={styles.text}>
        <span className={styles.label}>お届け先</span>
        <span className={styles.value}>
          {prefecture}
          {city}
          <IconChevron />
        </span>
      </span>
    </Link>
  );
}

function IconPin() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.pin}
      aria-hidden="true"
    >
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.chevron}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
