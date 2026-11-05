'use client';

import { useEffect, useRef, useState } from 'react';

import styles from './CopyButton.module.css';

/**
 * CopyButton — copies one value to the clipboard.
 *
 * Built for the furikomi details, where every field is about to be retyped into
 * a banking app on a phone. A katakana account holder and a ten-digit account
 * number are exactly the things people mistype, and a mistyped transfer on this
 * gateway cannot be matched back to an order — the account is per-transaction,
 * so the money arrives nowhere and the customer has to chase it.
 *
 * WHAT IS COPIED IS NOT WHAT IS SHOWN. The caller passes `value` separately
 * from the label beside it, so the amount copies as `4782` rather than
 * 「4,782円」 and a code copies without its parentheses. Pasting a formatted
 * string into a bank form is the failure this exists to prevent.
 *
 * Client-only, and deliberately the ONLY client component in the panel: the
 * confirmation page and the panel around it stay server-rendered.
 *
 * @param {Object} props
 * @param {string} props.value   What lands on the clipboard.
 * @param {string} props.label   What it is, for the accessible name.
 * @param {boolean} [props.subtle] Quieter styling, for secondary rows.
 */
export default function CopyButton({ value, label, subtle = false }) {
  const [state, setState] = useState('idle');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    let next = 'done';

    try {
      /* Needs a secure context AND clipboard-write permission. */
      await navigator.clipboard.writeText(value);
    } catch {
      /* The fallback matters more here than it looks. A large share of
         Japanese shoppers arrive through the LINE in-app browser, and
         embedded webviews are exactly where clipboard-write is denied —
         measured: `navigator.permissions.query({name:'clipboard-write'})`
         returns "denied" and writeText throws NotAllowedError even on a real
         tap. Without this, those customers see 失敗 on the one control that
         exists to stop them mistyping an account number.

         execCommand is deprecated and still the only thing that works there,
         because it rides the user gesture instead of asking permission. */
      next = legacyCopy(value) ? 'done' : 'failed';
    }

    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2400);
  }

  const done = state === 'done';
  const failed = state === 'failed';

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className={`${styles.button} ${subtle ? styles.subtle : ''} ${done ? styles.done : ''}`}
        aria-label={`${label}をコピー`}
      >
        {done ? <CheckIcon /> : <CopyIcon />}
        <span className={styles.text}>
          {done ? 'コピー済' : failed ? '失敗' : 'コピー'}
        </span>
      </button>

      {/* The button's own label changes, but a change to the focused element's
          text is not reliably announced. This says it once, politely. */}
      <span role="status" aria-live="polite" className="visually-hidden">
        {done ? `${label}をコピーしました` : failed ? `${label}をコピーできませんでした` : ''}
      </span>
    </>
  );
}

/**
 * The pre-Clipboard-API copy, for webviews that deny the modern one.
 *
 * Off-screen rather than `display: none`, because a hidden element cannot be
 * selected and the copy would silently do nothing. `readOnly` stops the mobile
 * keyboard appearing for the instant it is focused, and the fixed position
 * keeps the page from scrolling to it.
 *
 * @returns {boolean} whether the copy actually happened.
 */
function legacyCopy(text) {
  try {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
    document.body.appendChild(field);

    field.select();
    field.setSelectionRange(0, text.length);

    const ok = document.execCommand('copy');
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 5 5L19 7" />
    </svg>
  );
}
