'use client';

import { useRef, useState } from 'react';

import styles from './CouponCode.module.css';

/**
 * CouponCode — the code, and a button that copies it.
 *
 * The whole page exists so someone leaves with a code, and the way that
 * normally goes wrong is a half-selected string: these codes are mixed case
 * with punctuation (`FIRST10%OFF`), and a stray character at either end fails
 * silently at checkout with no explanation.
 *
 * The code stays selectable text rather than becoming button content, so it is
 * still readable to a screen reader, still copyable by hand, and still visible
 * when JavaScript has not arrived. The button is the addition, not the
 * mechanism.
 *
 * Two clipboard paths. navigator.clipboard needs a secure context, which rules
 * it out over plain http — the staging host — so a hidden-textarea fallback
 * sits behind it. If both fail the button says so instead of claiming success,
 * because a copy that silently did nothing is how you end up pasting the
 * previous thing in your clipboard into the coupon field.
 *
 * @param {Object} props
 * @param {string} props.code
 */
export default function CouponCode({ code }) {
  const [state, setState] = useState('idle');
  const timer = useRef(null);

  async function copy() {
    clearTimeout(timer.current);

    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        ok = true;
      }
    } catch {
      ok = false;
    }

    if (!ok) ok = copyByTextarea(code);

    setState(ok ? 'copied' : 'failed');
    timer.current = setTimeout(() => setState('idle'), 2400);
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>クーポンコード</span>
      <code className={styles.code}>{code}</code>
      <button
        type="button"
        className={styles.button}
        onClick={copy}
        data-state={state}
      >
        {state === 'copied' ? 'コピーしました' : state === 'failed' ? '手動でコピーしてください' : 'コピー'}
      </button>
      {/* Announced on change; the button's own label change is visual. */}
      <span role="status" aria-live="polite" className={styles.srOnly}>
        {state === 'copied' ? `${code} をコピーしました` : ''}
      </span>
    </div>
  );
}

/**
 * The pre-clipboard-API way, kept for insecure origins.
 *
 * Off-screen rather than `display: none` or `hidden`: a textarea the browser
 * does not lay out cannot be focused, and an unfocused one cannot be selected,
 * so the copy would be of nothing. readOnly stops a mobile keyboard appearing
 * for the moment it is focused.
 */
function copyByTextarea(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
  document.body.appendChild(el);

  try {
    el.select();
    el.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    el.remove();
  }
}
