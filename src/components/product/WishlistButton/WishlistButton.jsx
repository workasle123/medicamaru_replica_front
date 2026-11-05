'use client';

import { useFormStatus } from 'react-dom';

import styles from './WishlistButton.module.css';

/**
 * WishlistButton — the お気に入り submit.
 *
 * It used to carry its own `formAction`, because it was a second submit inside
 * the buy form and had to override where that form posted. Each pack now has
 * its own buy form and お気に入り has one of its own, so the action belongs on
 * the form and this is an ordinary submit again.
 *
 * Secondary styling — outline, not filled — so the primary action stays
 * unambiguous.
 */
export default function WishlistButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.button} disabled={pending}>
      <HeartIcon />
      <span>お気に入り</span>
    </button>
  );
}

function HeartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1Z" />
    </svg>
  );
}
