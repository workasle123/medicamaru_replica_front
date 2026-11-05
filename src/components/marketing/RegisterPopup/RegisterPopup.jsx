'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './RegisterPopup.module.css';
import { BLOCKED_PATHS, DELAY_MS, DISMISS_DAYS, STORAGE_KEY } from '@/constants/register-offer';
import {
  REGISTER_POPUP,
  claimPopupSlot,
  canPopupShowThisVisit,
  isPopupSlotTaken,
  releasePopupSlot,
} from '@/lib/popup-slot';

/**
 * 新規会員登録キャンペーン — shown a few seconds after someone arrives.
 *
 * Replaces the LINE friend-add popup, which was held back because it promised
 * 30% against a 10% coupon. This one advertises points, and points are the one
 * thing the backend credits automatically on registration — so the promise and
 * the mechanism are the same event rather than two things to keep in step.
 *
 * `points` comes from Admin → Settings via RegisterPopupMount, which is also
 * what decides whether this renders at all. It is a required prop with no
 * default on purpose: a default is a second figure to keep in step with the
 * admin, which is the problem this is solving.
 *
 * It takes its look from the 新規会員登録キャンペーン banner in the homepage rail:
 * the number at display size in the banner's red, on a soft green wash, above
 * a filled red pill. Rebuilt in CSS rather than reusing the artwork — that
 * file is 1116×252 and would be unreadable cropped into a 24rem card, and it
 * still carries the old 「お薬ショップへようこそ！」 wording baked into the image.
 *
 * ## Why this is not a hook away from the router
 *
 * It reads `window.location.pathname` inside the effect rather than calling
 * `usePathname()`. This component mounts in the ROOT layout, and a router hook
 * there is how the whole site lost its prerendering once already — a
 * `useSearchParams()` in the header forced a Suspense bail-out and un-STATICed
 * every prerendered page, surfacing as a build error on /404 rather than
 * anywhere near the component that caused it. Nothing here needs to re-render
 * on navigation: the popup is decided once, on mount.
 *
 * The flip side is that a client-side navigation does not re-arm the timer. A
 * visitor who lands on /cart and then browses to a product page will not see
 * it until their next visit. That is the intended trade: one invitation per
 * visit, not one per route change.
 *
 * ## Dismissal
 *
 * Remembered in localStorage for DISMISS_DAYS. Every read and write is wrapped
 * — the accessor THROWS rather than returning null in a Safari private window
 * and wherever site data is blocked, and an unhandled throw here would take the
 * whole layout down. A visitor whose storage is unavailable sees the popup
 * every visit, which is the right way for this to fail: annoying, not broken.
 *
 * ## Accessibility
 *
 * A real modal: `role="dialog"` with `aria-modal`, focus moved in on open and
 * returned on close, Escape closes, Tab trapped inside. Without the trap a
 * keyboard user tabs straight out into a page that is visually behind an
 * overlay and cannot find their way back.
 *
 * `aria-labelledby` points at the offer heading rather than a generic word, so
 * a screen reader announces what the interruption is FOR at the moment it
 * steals focus.
 */
export default function RegisterPopup({ points }) {
  const [open, setOpen] = useState(false);

  /* From the router, not `window`, so a client-side navigation re-evaluates.
     See the long note in SitePopup: a Client Component reading the path does
     NOT cost the site its prerendering, which is what the previous
     mount-only approach was guarding against. */
  const pathname = usePathname();

  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const dismiss = useCallback(() => {
    setOpen(false);
    releasePopupSlot(REGISTER_POPUP);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* Storage unavailable. The popup simply returns next visit. */
    }
    restoreFocusRef.current?.focus?.();
  }, []);

  /* --- Decide whether to arm the timer at all --------------------------- */
  useEffect(() => {
    /* The standing offer yields to anything already shown this visit, and to
       a campaign that has not yet had its turn — see canPopupShowThisVisit.
       The limit used to be
       enforced by the effect being unable to re-run, which also meant a
       client-side navigation never armed it at all. */
    if (!canPopupShowThisVisit(REGISTER_POPUP)) return undefined;

    const path = pathname ?? window.location.pathname;
    if (BLOCKED_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return undefined;

    try {
      const last = Number(window.localStorage.getItem(STORAGE_KEY));
      if (last && Date.now() - last < DISMISS_DAYS * 86400000) return undefined;
    } catch {
      /* Unreadable storage is treated as "never dismissed". */
    }

    /* An admin-managed campaign popup reserves the slot on mount, before any
       timer fires, so by the time this runs the answer is already known. Two
       modals stacked on one page is not a design anyone chose — it is what
       two components each owning their own timer produces by default.

       Checked here rather than inside the timeout so no timer is armed at
       all, and checked AGAIN at fire time below, because a managed popup
       whose own effect is torn down releases the slot and this one should
       then be free to take it. */
    if (isPopupSlotTaken(REGISTER_POPUP)) return undefined;

    const t = window.setTimeout(() => {
      if (claimPopupSlot(REGISTER_POPUP)) setOpen(true);
    }, DELAY_MS);

    return () => {
      window.clearTimeout(t);
      releasePopupSlot(REGISTER_POPUP);

      /* Close anything this run opened — an open popup belongs to the page it
         was raised on, and back/forward change the path with it still up. In
         the cleanup rather than the effect body so no cascading render is
         triggered on every navigation. */
      setOpen(false);
    };
  }, [pathname]);

  /* --- Modal behaviour while open --------------------------------------- */
  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement;
    /* The close button, not the CTA. Focus landing on the CTA
       puts a navigation under the next Enter keypress of someone who has not
       read the dialog yet. */
    closeRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismiss();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      /* Wrap at both ends. Without this, Tab from the last control moves to
         the browser chrome and then into the page behind the overlay. */
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);

    /* The page behind must not scroll under the overlay. The scrollbar's width
       is replaced as padding so the layout does not jump sideways when it
       disappears — on Windows that shift is ~15px and very visible. */
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const barWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (barWidth > 0) body.style.paddingRight = `${barWidth}px`;

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      /* Clicking the backdrop dismisses, but only the backdrop itself — the
         check stops a click that STARTED inside the card and drifted out on
         release (a text selection, usually) from closing it. */
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-popup-title"
        aria-describedby="register-popup-terms"
      >
        <button
          type="button"
          ref={closeRef}
          className={styles.close}
          onClick={dismiss}
          aria-label="閉じる"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className={styles.head}>
          <p className={styles.eyebrow}>新規会員登録キャンペーン</p>
        </div>

        <div className={styles.body}>
          <h2 id="register-popup-title" className={styles.title}>
            新規登録で
            {/* The number carries the whole message, so it is its own element
                rather than a <strong> inside a sentence — it is set at display
                size without the Japanese around it inheriting that. */}
            {/* 「ポイントプレゼント」 sits on the figure's own line rather than a
                third line below it. Three lines of heading was the single
                biggest block on a phone — 98px of a 392px card. */}
            <span className={styles.points}>
              <span className={styles.pointsNum}>{points}</span>
              <span className={styles.pointsUnit}>ポイントプレゼント</span>
            </span>
          </h2>

          <p className={styles.lead}>
            ご登録はメールアドレスだけ。
            <br />
            1ポイント = 1円としてお使いいただけます。
          </p>

          <Link href="/register" className={styles.cta} onClick={dismiss}>
            登録して{points}ポイントをもらう
          </Link>

          <button type="button" className={styles.later} onClick={dismiss}>
            あとで
          </button>

          {/* 景品表示法: the conditions travel with the claim. A headline
              figure shown without what limits it is 有利誤認 whether or not the
              terms exist somewhere else on the site. */}
          <p id="register-popup-terms" className={styles.terms}>
            ※ご登録完了後に進呈。お一人様一回限り有効です。
          </p>
        </div>
      </div>
    </div>
  );
}
