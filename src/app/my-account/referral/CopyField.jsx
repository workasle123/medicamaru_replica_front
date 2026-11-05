'use client';

import { useRef, useState } from 'react';

import styles from '../AccountLayout.module.css';

/**
 * A read-only value with a copy button.
 *
 * Used for both the code and the invitation link, which is why the value is a
 * prop rather than two near-identical components.
 *
 * `readOnly`, not `disabled`: a disabled input cannot be focused or selected,
 * and selecting the text by hand is the fallback when the clipboard is refused
 * — which it is on an insecure origin, and whenever the permission is denied.
 *
 * The confirmation is the button's own label changing. A toast would be the
 * other option, but this control may be two taps from the bottom of a phone
 * screen and a message at the other end of it is not where the eye is.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {string} [props.hint]
 */
export default function CopyField({ label, value, hint }) {
  const [state, setState] = useState('idle');
  const inputRef = useRef(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      /* No clipboard: select the text so one keystroke finishes the job, and
         say so, because a button that silently does nothing reads as broken. */
      inputRef.current?.select();
      setState('failed');
    }
    setTimeout(() => setState('idle'), 2400);
  }

  const labelText =
    state === 'copied' ? 'コピーしました' : state === 'failed' ? '選択しました' : 'コピー';

  return (
    <div className={styles.copyField}>
      <label className={styles.copyLabel} htmlFor={`copy-${label}`}>
        {label}
      </label>

      <div className={styles.copyRow}>
        <input
          id={`copy-${label}`}
          ref={inputRef}
          className={styles.copyInput}
          value={value}
          readOnly
          onFocus={(e) => e.target.select()}
        />
        <button type="button" className={styles.copyButton} onClick={copy} data-state={state}>
          {labelText}
        </button>
      </div>

      {hint && <p className={styles.copyHint}>{hint}</p>}

      {/* The state change is on a button whose own label changed, which a
          screen reader does not announce on its own. */}
      <span role="status" aria-live="polite" className="visually-hidden">
        {state === 'copied' ? `${label}をコピーしました` : ''}
      </span>
    </div>
  );
}
