'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ScrollRail.module.css';

/**
 * ScrollRail — a single row of items that pages sideways.
 *
 * The track is a plain scroll-snap container, so it swipes on touch and
 * scrolls on a trackpad with no JavaScript at all. The arrows are an
 * enhancement layered on top: they page by exactly one viewport-width of
 * track, and they disappear entirely when everything already fits, so a rail
 * of three items in a three-wide row shows no controls.
 *
 * Item width comes from `perView` rather than a fixed pixel size, which is
 * what keeps "5 products then an arrow" true at every breakpoint instead of
 * only at the one it was designed against.
 *
 * `step` chooses how far an arrow moves. 'page' advances by a full row, which
 * suits product cards where the reader is done with the ones they have seen.
 * 'item' advances by a single item, which suits short chips where jumping a
 * whole row skips past things the reader was still scanning.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children  One element per item.
 * @param {number} props.perView            Items visible at >=1024px.
 * @param {number} [props.perViewWide]      Items visible at >=1400px.
 * @param {number} [props.perViewTablet]    Items visible at >=640px.
 * @param {number} [props.perViewMobile]    Items visible below 640px.
 * `fluid` sizes items to their own content instead of to `perView`, for rows
 * of variable-width things like tags. The arrows then appear based on whether
 * the row actually overflows, which is the honest test — eight short tags may
 * fit where five long ones do not.
 *
 * @param {'page'|'item'} [props.step]      Arrow distance. Defaults to 'page'.
 * @param {boolean} [props.fluid]           Size items to content, ignoring perView.
 * @param {string} props.label              Accessible name for the controls.
 */
export default function ScrollRail({
  children,
  perView,
  /* Defaults to `perView`, i.e. no change on wide screens. Rails whose items
     should get denser rather than larger — product cards — pass a higher
     number; banner tiles deliberately do not, because a wider banner is more
     legible where a wider product card is just wasted space. */
  perViewWide = perView,
  perViewTablet = Math.max(2, Math.round(perView / 2)),
  perViewMobile = 2,
  step = 'page',
  fluid = false,
  /* Advances on a timer BELOW this width, in px. Off by default: a rail that
     moves on its own is right for a short strip of banners and wrong for a long
     product list, where it would carry a card away mid-read.

     Implemented on top of the same paging the arrows use, rather than a CSS
     transform marquee. The track is a real scroll container, so a transform
     would fight the scroll position, break scroll-snap, and desynchronise the
     arrows. Driving the existing scroll keeps one source of truth. */
  autoPlayBelow = 0,
  autoPlayMs = 4000,
  /* Page dots under the rail, shown on PHONES ONLY — opt-in, because they
     are right for a short strip of banners and wrong for a long product
     rail, where a row of twenty dots is noise rather than navigation.

     Mobile-only because that is where the arrows are least useful: they sit
     over the artwork at phone width, there is no hover to reveal them, and a
     rail that advances on its own gives no clue how many banners there are
     or which one you are on. On desktop everything fits and the arrows are
     enough. */
  dots = false,
  label,
}) {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  /* How many pages the track holds and which one is showing. Only read when
     `dots` is on, but measured unconditionally — it comes from the same
     scroll numbers `sync` already has, so there is nothing to save by
     branching. */
  const [pages, setPages] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);

  /* `atEnd` starts true so the arrows stay hidden until measurement proves
     the track actually overflows — otherwise they flash in on first paint
     and then vanish for rails that fit. */
  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setAtStart(track.scrollLeft <= 1);
    setAtEnd(max <= 1 || track.scrollLeft >= max - 1);

    /* Derived from the track's own measurements rather than from the child
       count divided by perView. The rail shows a different number of items
       at every breakpoint, and the arrows already move by exactly one
       clientWidth — measuring keeps the dots counting the same pages the
       arrows traverse, at any width, without repeating the breakpoint table
       in JavaScript. */
    const width = track.clientWidth;
    if (!width) return;
    setPages(Math.max(1, Math.round(track.scrollWidth / width)));
    setPageIndex(Math.round(track.scrollLeft / width));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    sync();
    track.addEventListener('scroll', sync, { passive: true });

    // Item widths are percentages of the track, so a resize changes how many
    // fit and therefore whether the arrows are needed at all.
    const observer = new ResizeObserver(sync);
    observer.observe(track);

    return () => {
      track.removeEventListener('scroll', sync);
      observer.disconnect();
    };
  }, [sync]);

  const page = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';

    if (step === 'item') {
      /* Scroll to where the next item actually starts, rather than by a
         fixed distance. With variable-width items — tags, for instance — a
         fixed step eventually lands mid-item and skips one, because the
         width it was derived from is not the width of the item being moved
         past. Reading the real offsets makes "one forward" exactly true. */
      /* Content-start origin: the track's viewport left MINUS how far it is
         already scrolled. Adding instead of subtracting yields offsets that
         are correct only at scrollLeft 0 and drift thereafter. */
      const origin = track.getBoundingClientRect().left - track.scrollLeft;
      const offsets = [...track.children].map(
        (item) => item.getBoundingClientRect().left - origin
      );
      const current = track.scrollLeft;
      const target =
        direction > 0
          ? offsets.find((offset) => offset > current + 1)
          : [...offsets].reverse().find((offset) => offset < current - 1);

      if (target !== undefined) {
        track.scrollTo({ left: target, behavior });
        return;
      }
    }

    track.scrollBy({ left: direction * track.clientWidth, behavior });
  };


  /* Auto-advance, mobile only.
   *
   * Deliberately stops for: reduced-motion, a hidden tab (a rail advancing in a
   * background tab is wasted work and lands the user somewhere unexpected on
   * return), and any touch or pointer on the rail — once someone takes hold of
   * it, moving it under them is the thing that makes auto-carousels hated.
   */
  useEffect(() => {
    if (!autoPlayBelow) return undefined;

    const narrow = window.matchMedia(`(max-width: ${autoPlayBelow - 1}px)`);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const track = trackRef.current;
    if (!track) return undefined;

    let timer = null;
    let touched = false;

    const tick = () => {
      if (document.hidden || touched) return;

      /* At the end, return to the start rather than stalling — the loop is what
         makes it read as a slider rather than a rail that ran out. */
      const end = track.scrollWidth - track.clientWidth - 1;
      if (track.scrollLeft >= end) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      page(1);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    /* Re-evaluated whenever the breakpoint or the motion preference changes, so
       rotating a phone into landscape past 768px stops it and back again
       resumes it. */
    const start = () => {
      stop();
      if (narrow.matches && !still.matches) timer = setInterval(tick, autoPlayMs);
    };

    const hold = () => { touched = true; stop(); };

    track.addEventListener('pointerdown', hold, { passive: true });
    track.addEventListener('touchstart', hold, { passive: true });
    narrow.addEventListener('change', start);
    still.addEventListener('change', start);
    start();

    return () => {
      stop();
      track.removeEventListener('pointerdown', hold);
      track.removeEventListener('touchstart', hold);
      narrow.removeEventListener('change', start);
      still.removeEventListener('change', start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayBelow, autoPlayMs]);

  const hidden = atStart && atEnd;

  return (
    <div className={styles.wrap}>
      <ul
        ref={trackRef}
        className={`${styles.track} ${fluid ? styles.fluid : ''}`}
        role="list"
        /* Item count drives column width; it is data, not decoration, which
           is why it arrives as a custom property rather than a class. */
        style={
          fluid
            ? undefined
            : {
                '--per-view': perView,
                '--per-view-wide': perViewWide,
                /* One more again on very wide screens, but ONLY for rails that
                   opted into getting denser. Without this guard the extra step
                   applied to every rail, shrinking the banner tiles from 544px
                   to 404px on a 16-inch display — the opposite of what a
                   banner wants. */
                '--per-view-xwide': perViewWide > perView ? perViewWide + 1 : perViewWide,
                '--per-view-tablet': perViewTablet,
                '--per-view-mobile': perViewMobile,
              }
        }
      >
        {children}
      </ul>

      {!hidden && (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.prev}`}
            onClick={() => page(-1)}
            disabled={atStart}
            aria-label={`${label}：前へ`}
          >
            <Chevron direction="left" />
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            onClick={() => page(1)}
            disabled={atEnd}
            aria-label={`${label}：次へ`}
          >
            <Chevron direction="right" />
          </button>
        </>
      )}

      {/* One dot per page. Hidden above the phone breakpoint by CSS rather
          than by a media query in JavaScript, so there is no hydration
          mismatch and no listener to keep in step with the viewport. */}
      {dots && pages > 1 && (
        <ul className={styles.dots} role="list">
          {Array.from({ length: pages }, (_, i) => (
            <li key={i}>
              <button
                type="button"
                className={styles.dotHit}
                aria-current={i === pageIndex ? 'true' : undefined}
                aria-label={`${label}：${i + 1} / ${pages}`}
                onClick={() => {
                  const track = trackRef.current;
                  if (!track) return;
                  track.scrollTo({
                    left: i * track.clientWidth,
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                      ? 'auto'
                      : 'smooth',
                  });
                }}
              >
                <span className={styles.dot} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chevron({ direction }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d={direction === 'left' ? 'M15 5 8 12l7 7' : 'M9 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
