'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './SitePopup.module.css';
import { pickPopup } from '@/lib/popup-match';
import {
  MANAGED_POPUP,
  claimPopupSlot,
  canPopupShowThisVisit,
  releasePopupSlot,
  reservePopupSlot,
} from '@/lib/popup-slot';

/**
 * An admin-managed campaign popup (Admin → Popups).
 *
 * The whole message is an uploaded image, which is the point: running a
 * campaign should not need a developer. That also sets the constraints —
 * there is no text to lay out, so the component's entire job is deciding
 * WHETHER to show, waiting the right amount of time, and being a correct
 * modal once it does.
 *
 * Takes the full live list and picks the match itself rather than being
 * handed one. The server cannot do the picking: this mounts in the root
 * layout, shared by statically rendered routes, so at render time there is no
 * reliable current path. See the backend's getPopups.
 *
 * ## Why it follows the router
 *
 * `usePathname()`, with the path in the effect's dependencies, so a
 * client-side navigation re-evaluates. This replaced
 * `window.location.pathname` read once on mount, which was chosen on the
 * belief that a router hook in the root layout costs the site its
 * prerendering.
 *
 * THAT IS TRUE OF A SERVER COMPONENT, NOT OF THIS ONE. Measured before
 * changing it: with `usePathname()` here, 21 routes are still statically
 * prerendered and `/` is still `○` in the build output — an identical route
 * table. The hazard is dynamic APIs in a Server Component; a Client
 * Component reading the path is prerendered like any other.
 *
 * What the old approach cost: this component lives in the ROOT LAYOUT, which
 * does not remount on a client-side navigation, so a mount-only effect ran
 * exactly once per full page load. Click any internal link and no popup ever
 * armed again. The free-shipping popup targets `/product/*`, a page reached
 * by clicking, so it could essentially never fire — and the only way to see
 * any popup was to press reload, which is how the bug was reported.
 *
 * Keeping a visit from turning into a popup on every page was the intent,
 * and it still holds — now enforced deliberately by `canPopupShowThisVisit`
 * rather than as a side effect of the timer being unable to re-arm, and
 * ranked so a targeted campaign is not starved by the standing registration
 * offer firing first on some page in between.
 *
 * ## Dismissal
 *
 * Per popup id, in localStorage, for DISMISS_DAYS. Keyed by id so dismissing
 * last month's campaign does not silently suppress this month's. Every access
 * is wrapped: the accessor THROWS rather than returning null in a Safari
 * private window, and an unhandled throw in the root layout takes the site
 * down with it. A visitor whose storage is blocked sees the popup every
 * visit — annoying, not broken, which is the right way for this to fail.
 */

/** How long a dismissal is respected. */
const DISMISS_DAYS = 30;

const storageKey = (id) => `medicamaru:popup-dismissed:${id}`;

export default function SitePopup({ popups }) {
  /* ONE piece of state: the popup currently on screen, or null for none.
     An earlier version kept `popup` and `open` separately, which meant
     setting state in the effect body to stash the match before the timer —
     a cascading render, and two values that could disagree about whether
     anything was showing. The match is a local until the moment it opens. */
  const [active, setActive] = useState(null);

  /* The current path, from the router rather than from `window`, so a
     client-side navigation re-runs the effect below. See the header note. */
  const pathname = usePathname();

  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const dismiss = useCallback(() => {
    releasePopupSlot(MANAGED_POPUP);

    if (active?.id) {
      try {
        window.localStorage.setItem(storageKey(active.id), String(Date.now()));
      } catch {
        /* Storage unavailable. The popup simply returns next visit. */
      }
    }

    setActive(null);
    restoreFocusRef.current?.focus?.();
  }, [active]);

  /* --- Decide, reserve the slot, then arm the timer --------------------- */
  useEffect(() => {
    if (!popups?.length) return undefined;

    /* One invitation per visit. Checked before anything else so no timer is
       armed and — the part that matters — no slot is reserved, which would
       otherwise sit there blocking the registration popup for the rest of
       the visit. */
    if (!canPopupShowThisVisit(MANAGED_POPUP)) return undefined;

    const match = pickPopup(popups, pathname ?? window.location.pathname);
    if (!match) return undefined;

    try {
      const last = Number(window.localStorage.getItem(storageKey(match.id)));
      if (last && Date.now() - last < DISMISS_DAYS * 86400000) return undefined;
    } catch {
      /* Unreadable storage is treated as "never dismissed". */
    }

    /* Reserved on MOUNT, not when the timer fires. The registration popup is
       on a fixed 4.5s fuse; if this one waited until its own timer to speak
       up, any delay longer than that would quietly lose the slot and the
       admin would have no way to tell why their campaign never appeared. */
    reservePopupSlot(MANAGED_POPUP);

    const t = window.setTimeout(() => {
      if (claimPopupSlot(MANAGED_POPUP)) setActive(match);
    }, match.delayMs);

    return () => {
      window.clearTimeout(t);
      releasePopupSlot(MANAGED_POPUP);

      /* Close anything this run opened. A popup still on screen when the path
         changes belongs to the page that was left — normally its CTA
         dismisses it on the way out, but back and forward move the path with
         it still up. The cleanup is the right home for this: it runs exactly
         when the path changes or the component goes away, and only for a run
         that got far enough to open something. */
      setActive(null);
    };
  }, [popups, pathname]);

  /* --- Modal behaviour while open --------------------------------------- */
  useEffect(() => {
    if (!active) return undefined;

    restoreFocusRef.current = document.activeElement;
    /* The close button, not the image link: focus on the link puts a
       navigation under the next Enter keypress of someone who has not looked
       at the dialog yet. */
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

      /* Wrap at both ends — without this, Tab from the last control moves to
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

    /* The page behind must not scroll under the overlay. The scrollbar's
       width is replaced as padding so the layout does not jump sideways when
       it disappears — on Windows that shift is ~15px and very visible. */
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
  }, [active, dismiss]);

  if (!active) return null;

  /* Plain <img> inside a <picture>, not next/image.
     The admin uploads artwork of any shape and we never learn its dimensions,
     so next/image would need width and height we do not have — and guessing
     them is how a campaign image ends up stretched. Inside an overlay there
     is nothing below to reflow, so the layout-shift argument for the
     optimiser does not apply here either. <picture> does the art direction
     with no JavaScript at all. */
  const image = (
    <picture>
      {active.imageMobile && active.imageMobile !== active.imageDesktop && (
        <source media="(max-width: 640px)" srcSet={active.imageMobile} />
      )}
      <img
        src={active.imageDesktop}
        alt={active.altText || active.title || ''}
        className={styles.image}
        /* It is already on screen when this renders — lazy would mean an
           empty frame for the first moment of a modal that interrupted
           someone on purpose. */
        loading="eager"
      />
    </picture>
  );

  return (
    <div
      className={styles.overlay}
      /* Only the backdrop itself dismisses. The check stops a click that
         STARTED inside the card and drifted out on release — a text
         selection, usually — from closing it. */
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.card}
        role="dialog"
        aria-modal="true"
        /* The image's own description names what the interruption is FOR at
           the moment it steals focus. There is no heading to point at —
           the popup is artwork — so without this a screen reader announces
           nothing but "dialog". */
        aria-label={active.altText || active.title || 'お知らせ'}
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

        {active.linkUrl ? (
          /* An external campaign target — a LINE landing page, say — is a
             plain anchor; an internal one goes through Link so it is a client
             navigation like every other link on the site. Dismissed on the
             way out, so returning with the back button does not land the
             visitor straight back under the popup they just acted on. */
          isExternal(active.linkUrl) ? (
            <a
              href={active.linkUrl}
              className={styles.link}
              target="_blank"
              rel="noopener"
              onClick={dismiss}
            >
              {image}
            </a>
          ) : (
            <Link href={active.linkUrl} className={styles.link} onClick={dismiss}>
              {image}
            </Link>
          )
        ) : (
          image
        )}
      </div>
    </div>
  );
}

/**
 * Anything with a scheme, plus protocol-relative URLs.
 *
 * Checked rather than assumed: `next/link` with an absolute URL renders a
 * plain anchor anyway, but it also tries to prefetch it, and pointing the
 * prefetcher at someone else's domain on every page load is not something to
 * do by accident.
 */
function isExternal(url) {
  return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(String(url));
}
