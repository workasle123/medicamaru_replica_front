'use client';

import { useEffect, useId, useRef, useState } from 'react';

import styles from './ChatLauncher.module.css';

/**
 * ChatLauncher — the AI assistant button and its panel.
 *
 * The panel is a complete chat surface: header, transcript area, composer,
 * close. What it does not have yet is a bot behind it, so the composer is
 * disabled and the transcript carries a short 準備中 note instead of pretending
 * to answer. A dead input that looks live is worse than one that says why.
 *
 * When the assistant is built, the only changes here are: drop `PENDING`, hold
 * messages in state, and post to the endpoint. The markup and styling stay.
 *
 * Panel, not a route: the point of asking is that you are mid-task — on a
 * product page, in the cart — and navigating away loses the thing you were
 * asking about.
 *
 * It used to sit in the header's action row, where on a phone it competed with
 * the logo and the menu button for a 375px line. It is now docked above the
 * bottom tab bar and revealed on scroll-UP: reading down the page it gets out
 * of the way, and the gesture that means "I want the controls back" brings it
 * with them.
 */

/** Flip to false once a real endpoint exists. */
const PENDING = true;

export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  /* Starts visible: someone who has not scrolled yet has not asked for it to
     go away, and a control that is invisible until you scroll and come back is
     a control most people never find. */
  const [shown, setShown] = useState(true);
  const panelId = useId();
  const closeRef = useRef(null);
  const buttonRef = useRef(null);

  /* Hide on the way down, show on the way up.

     Read inside rAF rather than on the event: scroll fires far more often than
     the screen paints, and reading scrollY in the handler forces a reflow each
     time. `passive` for the same reason — this never calls preventDefault, and
     saying so lets the browser scroll without waiting on us. */
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        // A few pixels of slack, so a trackpad's jitter does not flicker it.
        if (Math.abs(y - last) > 6) {
          setShown(y < last || y < 80);
          last = y;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Escape closes, and focus moves into the panel on open and back to the
     button on close — otherwise a keyboard user is dropped at the top of the
     document with no idea the panel appeared. */
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();

    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) buttonRef.current?.focus({ preventScroll: true });
    // Only when it closes, and only if it was this component that had focus.
  }, [open]);

  return (
    <>
      {/* `inert` rather than display:none while hidden — the button keeps its
          place in the layout so revealing it cannot shift anything, but it is
          taken out of the tab order and off the accessibility tree, so a
          keyboard user cannot land on something they cannot see. */}
      <div className={`${styles.dock} ${shown || open ? '' : styles.dockHidden}`}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.trigger}
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <ChatIcon />
          <span className={styles.triggerLabel}>AIに相談</span>
        </button>
      </div>

      {open && (
        <>
          {/* Sits under the panel and above everything else; clicking it is the
              gesture most people try first. */}
          <button
            type="button"
            className={styles.scrim}
            aria-label="閉じる"
            onClick={() => setOpen(false)}
          />

          <div
            id={panelId}
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label="AIチャット"
          >
            <header className={styles.panelHead}>
              <span className={styles.panelTitle}>
                <ChatIcon />
                AIチャット
              </span>
              <button
                ref={closeRef}
                type="button"
                className={styles.close}
                onClick={() => setOpen(false)}
                aria-label="チャットを閉じる"
              >
                ✕
              </button>
            </header>

            <div className={styles.transcript}>
              <p className={styles.notice}>
                現在準備中です。
                <br />
                お急ぎの方は
                <a href="/contact" className={styles.noticeLink}>
                  お問い合わせフォーム
                </a>
                または
                <a href="/faq" className={styles.noticeLink}>
                  よくあるご質問
                </a>
                をご利用ください。
              </p>
            </div>

            <form
              className={styles.composer}
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor={`${panelId}-input`} className="visually-hidden">
                メッセージ
              </label>
              <input
                id={`${panelId}-input`}
                className={styles.input}
                placeholder="準備中です"
                disabled={PENDING}
                autoComplete="off"
              />
              <button type="submit" className={styles.send} disabled={PENDING} aria-label="送信">
                ▶
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}

function ChatIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
    </svg>
  );
}
