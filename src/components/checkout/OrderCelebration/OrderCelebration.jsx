'use client';

import { useEffect, useState } from 'react';

import styles from './OrderCelebration.module.css';

/** Enough to read as a burst, few enough that a cheap phone still paints it. */
const COUNT = 28;

/** Brand colours only — a rainbow here would belong to a different shop. */
const COLOURS = [
  'var(--c-primary-500)',
  'var(--c-primary-600)',
  'var(--c-primary-300)',
  'var(--c-accent-400)',
  'var(--c-accent-500)',
  'var(--c-highlight-400)',
  'var(--c-highlight-500)',
];

/** Long enough for the last ribbon to leave the screen. */
const CLEAR_AFTER_MS = 4600;

/**
 * OrderCelebration — ribbons, once, when an order lands.
 *
 * ## Why it is built by hand
 *
 * A confetti library would be a dependency, and this build is already memory
 * constrained enough on Hostinger that the storefront compiles with `--webpack`
 * rather than Turbopack. Twenty-eight absolutely positioned spans and two
 * keyframes cost nothing by comparison, and the whole thing is removed from the
 * DOM when it finishes rather than sitting there compositing forever.
 *
 * ## Why nothing renders on the server
 *
 * Every ribbon's position, delay, colour and spin is random. Generating that
 * during render would give the server one set of numbers and the client
 * another, which is a hydration mismatch. So the first paint is deliberately
 * `null` on both sides and the pieces are made in an effect, after mount.
 *
 * ## It must not get in the way
 *
 * The customer is here to read an account number and send money, so: strictly
 * `pointer-events: none`, `aria-hidden`, nothing announced, no scroll lock, and
 * gone in under five seconds. `prefers-reduced-motion` renders nothing at all —
 * not a slower version, nothing. Someone who asked the OS not to animate things
 * is not asking for gentler confetti.
 */
export default function OrderCelebration() {
  const [pieces, setPieces] = useState(null);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    setPieces(
      Array.from({ length: COUNT }, (_, i) => ({
        id: i,
        /* Spread across the width, with a little jitter so the columns do not
           read as a grid. */
        left: (i / COUNT) * 100 + (Math.random() * 6 - 3),
        drift: Math.random() * 24 - 12,
        delay: Math.random() * 0.9,
        duration: 2.6 + Math.random() * 1.4,
        spin: 360 + Math.random() * 540,
        colour: COLOURS[i % COLOURS.length],
        /* A third of them round, the rest ribbons — the mix is what stops it
           looking like falling bricks. */
        round: i % 3 === 0,
        width: 6 + Math.random() * 5,
        height: 10 + Math.random() * 8,
      })),
    );

    const timer = setTimeout(() => setPieces(null), CLEAR_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!pieces) return null;

  return (
    <div className={styles.sky} aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={styles.fall}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}vw`,
          }}
        >
          {/* Two elements, because the fall and the spin are different motions:
              one element doing both ends up tumbling around the wrong centre. */}
          <span
            className={`${styles.piece} ${p.round ? styles.round : ''}`}
            style={{
              width: `${p.width}px`,
              height: `${p.round ? p.width : p.height}px`,
              backgroundColor: p.colour,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--spin': `${p.spin}deg`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
