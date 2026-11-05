'use client';

import { useState } from 'react';

import styles from './Field.module.css';

/**
 * Field — labelled form input with hint and error slots.
 *
 * Accessibility is wired here once so no individual form has to remember it:
 * the label is bound via htmlFor/id, the hint and error are referenced by
 * aria-describedby, and aria-invalid is set when there is an error.
 *
 * Required is marked with an asterisk. On its own an asterisk is ambiguous — it
 * carries no meaning to anyone who has not learned the convention, and nothing
 * at all to a screen reader — so the word 必須 is still in the markup, just
 * visually hidden, and the legend above the form says what the mark means.
 * Optional fields keep the 任意 badge, which is the only thing distinguishing a
 * field someone may skip from one they have simply not reached yet.
 *
 * A `type="password"` field gets a reveal toggle. Handled here rather than in
 * each form so every password input has it — login, registration, and whatever
 * password field is added next — and so the button's label stays consistent.
 *
 * Client Component. Every form using Field already is one, so this costs no
 * additional JavaScript on any page that did not already ship it.
 *
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.name
 * @param {string} props.label
 * @param {string} [props.type]
 * @param {boolean} [props.required]
 * @param {string} [props.hint]
 * @param {string} [props.error]
 * @param {string} [props.defaultValue]
 * @param {string} [props.autoComplete]
 */
export default function Field({
  id,
  name,
  label,
  type = 'text',
  required = false,
  hint,
  error,
  defaultValue,
  autoComplete,
  ...rest
}) {
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === 'password';
  /* The rendered type, which is what the toggle actually changes. `type` itself
     stays as passed, so `isPassword` keeps meaning "this is a password field"
     even while its characters are showing. */
  const inputType = isPassword && revealed ? 'text' : type;

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {required ? (
          <span className={styles.required}>
            <span aria-hidden="true">*</span>
            <span className="visually-hidden">必須</span>
          </span>
        ) : (
          <span className={styles.optional}>任意</span>
        )}
      </div>

      <div className={styles.inputWrap}>
      <input
        className={`${styles.input} ${error ? styles.invalid : ''} ${
          isPassword ? styles.inputWithToggle : ''
        }`}
        id={id}
        name={name}
        type={inputType}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...rest}
      />

      {/* Reveal toggle.

          A button, not a checkbox: it performs an action rather than recording a
          preference, and nothing is submitted with the form. `tabIndex={-1}`
          keeps it out of the tab order — someone filling in a login form expects
          Tab to move from password to the submit button, not to detour through
          an optional control they may not want. It stays reachable by click and
          by touch, which is how it is used.

          aria-pressed carries the state, so a screen reader hears whether the
          password is currently visible rather than only what the button does. */}
      {isPassword && (
        <button
          type="button"
          className={styles.reveal}
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? 'パスワードを隠す' : 'パスワードを表示'}
          aria-pressed={revealed}
          aria-controls={id}
          tabIndex={-1}
        >
          {revealed ? <IconEyeOff /> : <IconEye />}
        </button>
      )}
      </div>

      {/* Hint sits BELOW the input, not above it.

          Above, a field with a hint pushed its own input ~25px lower than a
          hintless field beside it — visible on the registration form wherever
          two fields share a row and only one is annotated. Label and input are
          now always the first two elements, so paired fields line up.

          aria-describedby still points at it, and DOM order does not affect
          that, so nothing changes for a screen reader. */}
      {hint && (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      )}

      {error && (
        <p className={styles.error} id={errorId}>
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

/* Open eye: the password is hidden, and pressing this reveals it. */
function IconEye() {
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
    >
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* Struck-through eye: the password is showing, and pressing this hides it. The
   two icons are the state, not the action — which is the convention people
   actually read, and why aria-pressed carries the same thing for screen
   readers. */
function IconEyeOff() {
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
    >
      <path d="M10.6 6.1A9.9 9.9 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3 3.6M6.3 7.7A16.7 16.7 0 0 0 2 12s3.6 6 10 6a9.6 9.6 0 0 0 4-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}
