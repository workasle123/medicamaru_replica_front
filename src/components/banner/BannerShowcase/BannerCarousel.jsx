'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Frame, Copy } from './BannerParts';
import styles from './BannerShowcase.module.css';

/* Long enough to read a slide's Japanese headline, short enough that a
   five-slide loop comes back round in half a minute. */
const INTERVAL_MS = 6000;

/* Scroll fires continuously while a swipe or a smooth scroll is in flight.
   Waiting for it to settle means the slide index updates once per move
   instead of once per frame, so the autoplay timer is not reset repeatedly
   mid-animation. */
const SETTLE_MS = 140;

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Whether focus arrived by keyboard rather than by a tap.
 *
 * This matters because the focus brake is permanent on a touch screen: tapping
 * a dot or the pause button leaves that control focused, with no pointer to
 * move away and no later tap guaranteed to blur it, so `held` would stay true
 * and the carousel would never resume. `:focus-visible` is false for a tap and
 * true for Tab, which is exactly the distinction the brake wants.
 *
 * A browser too old to know the selector throws on it; falling back to `true`
 * keeps the previous, more cautious behaviour there. */
const isKeyboardFocus = (element) => {
  try {
    return element.matches(':focus-visible');
  } catch {
    return true;
  }
};

/**
 * The campaign carousel.
 *
 * The track itself is a plain scroll-snap list, so it swipes on touch and
 * scrolls on desktop with no JavaScript at all, and the dots stay anchor
 * links that work before hydration. Everything this client component adds —
 * auto-advance, the active dot, the pause control — is an enhancement on top
 * of markup that already works without it.
 *
 * Auto-advance obeys three brakes: `prefers-reduced-motion`, a mouse hovering
 * or keyboard focus inside the carousel, and a background tab. Both interaction
 * brakes are deliberately scoped to those input types — see `isKeyboardFocus`
 * for why a tap must not engage them. The visible pause button exists because
 * WCAG 2.2.2 requires a way to stop content that moves on its own; pausing on
 * hover alone does not satisfy it, and on a phone there is no hover at all.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Banner[]} props.banners
 */
export default function BannerCarousel({ banners }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  /* Hover, keyboard focus or a hidden tab. Separate from `playing` so that
     moving the pointer away does not override an explicit pause. */
  const [held, setHeld] = useState(false);

  const count = banners.length;
  const loops = count > 1;

  /* `index` is set here rather than left to the scroll listener below. The
     autoplay effect is keyed on it, so deriving it from scroll alone would
     mean one dropped scroll event stops the rotation for good.

     `target` may be `count` — the trailing clone — which is how the wrap is
     kept moving forwards. It is deliberately not wrapped with a modulo. */
  const goTo = useCallback(
    (target) => {
      const track = trackRef.current;
      if (!track) return;
      const last = loops ? count : count - 1;
      const next = Math.max(0, Math.min(target, last));
      setIndex(next % count);
      track.scrollTo({
        left: next * track.clientWidth,
        behavior: reducedMotion() ? 'auto' : 'smooth',
      });
    },
    [count, loops]
  );

  /* Corrects `index` after a swipe or a trackpad scroll, so a manual move and
     an automatic one converge on the same state — and closes the loop when
     the track settles on the trailing clone. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    let timer;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!track.clientWidth) return;
        const settled = Math.round(track.scrollLeft / track.clientWidth);

        /* The clone is pixel-identical to the first slide, so jumping back to
           the real one is invisible — provided it does not animate. The CSS
           sets scroll-behavior: smooth, which would play the whole rewind the
           clone exists to avoid, so it is suspended for this one assignment. */
        if (loops && settled >= count) {
          const previous = track.style.scrollBehavior;
          track.style.scrollBehavior = 'auto';
          track.scrollLeft = 0;
          track.style.scrollBehavior = previous;
          setIndex(0);
          return;
        }

        setIndex((prev) => (prev === settled ? prev : settled));
      }, SETTLE_MS);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      track.removeEventListener('scroll', onScroll);
    };
  }, [count, loops]);

  /* A background tab should not burn through the whole rotation unseen. */
  useEffect(() => {
    const onVisibility = () => setHeld(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /* A timeout rather than an interval: keyed on `index`, it restarts whenever
     the slide changes, so a manual swipe gets a full window before the next
     auto-advance rather than however much was left on a shared clock. */
  useEffect(() => {
    if (!playing || held || banners.length < 2 || reducedMotion()) return undefined;
    const id = setTimeout(() => goTo(index + 1), INTERVAL_MS);
    return () => clearTimeout(id);
  }, [playing, held, index, banners.length, goTo]);

  return (
    <div
      className={styles.carousel}
      /* Mouse only. Hover has no meaning on a touch screen, and a touch
         pointer that ends in `pointercancel` rather than `pointerleave` — a
         swipe that turns into a page scroll — would leave the brake on with
         nothing to release it. */
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHeld(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setHeld(false);
      }}
      onFocus={(event) => {
        if (isKeyboardFocus(event.target)) setHeld(true);
      }}
      onBlur={() => setHeld(false)}
    >
      <ul className={styles.track} ref={trackRef} role="list" aria-label="キャンペーンバナー">
        {/* A copy of the first banner is appended so the wrap from the last
            slide keeps moving FORWARD into something identical to slide one,
            instead of rewinding past every slide in between. The jump back to
            the real first slide happens after it settles, without animation.

            It is inert and carries no id, so assistive technology and the dot
            anchors only ever see the real slides — inert rather than merely
            aria-hidden, because the slide contains a link, and a focusable
            control inside a hidden element is a keyboard trap waiting to
            happen. Without JavaScript it is simply one extra slide at the end
            of a manual scroll. */}
        {(loops ? [...banners, banners[0]] : banners).map((banner, i) => {
          const isClone = i === count;
          return (
          <li
            key={isClone ? 'clone' : banner.id}
            id={isClone ? undefined : `banner-slide-${banner.id}`}
            className={styles.slide}
            inert={isClone || undefined}
          >
            <Frame banner={banner} className={styles.slideLink}>
              <div className={styles.media}>
                {banner.image && (
                  <Image
                    src={banner.image.url}
                    /* Decorative: <Copy> carries the same message as text, so
                       alt would make it announce twice. */
                    alt=""
                    width={banner.image.width || 1120}
                    height={banner.image.height || 400}
                    className={styles.image}
                    /* Was a hardcoded 1120px, left over from the 1280px
                       container. The container is 1760px now and this renders
                       at ~1665px on a 16" Mac, so Next was picking a variant
                       far smaller than the display size. */
                    sizes="(max-width: 1023px) 100vw, min(100vw, 1720px)"
                    priority={i === 0}
                  />
                )}
              </div>

              <Copy banner={banner} />
            </Frame>
          </li>
          );
        })}
      </ul>

      {banners.length > 1 && (
        <div className={styles.controls}>
          <ul className={styles.dots} role="list">
            {banners.map((banner, i) => (
              <li key={banner.id}>
                <a
                  href={`#banner-slide-${banner.id}`}
                  className={styles.dotHit}
                  aria-current={i === index ? 'true' : undefined}
                  aria-label={`バナー ${i + 1} / ${banners.length}：${banner.title}`}
                  onClick={(event) => {
                    /* Scrolling the track directly keeps the slide id out of
                       the address bar and avoids the page jumping to it. The
                       href stays put so the dots still work unhydrated. */
                    event.preventDefault();
                    goTo(i);
                  }}
                >
                  <span className={styles.dot} />
                </a>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className={styles.playToggle}
            onClick={() => setPlaying((on) => !on)}
            aria-label={playing ? 'バナーの自動切り替えを停止' : 'バナーの自動切り替えを再開'}
            aria-pressed={!playing}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>
      )}
    </div>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
      <rect x="3" y="2" width="4" height="12" rx="1" fill="currentColor" />
      <rect x="9" y="2" width="4" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
      <path d="M4 2.5 13 8l-9 5.5z" fill="currentColor" />
    </svg>
  );
}
