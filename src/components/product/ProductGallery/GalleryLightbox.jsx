'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import styles from './ProductGallery.module.css';

/**
 * GalleryLightbox — the full-size view opened by tapping a product photo.
 *
 * On a pharmacy site the photo IS the product information: the pack, the
 * blister, the printed strength and the manufacturer's name are often only
 * legible at full size. The gallery renders each photo into a square that is
 * 480px at most on desktop and the width of the phone below that, with
 * `object-fit: contain` — so a wide packshot is letterboxed down to a few
 * hundred pixels and the dosage on the box becomes unreadable. Tapping it did
 * nothing at all.
 *
 * ## Why this is a separate client component
 *
 * ProductGallery is a Server Component on purpose — the strip is a
 * scroll-snap element that swipes and scrolls with no JavaScript, and the
 * whole file is written around keeping it that way. Making it a client
 * component to add a modal would throw that away for every visitor in order
 * to serve the ones who tap.
 *
 * So this listens on the strip by DELEGATION instead. The server still
 * renders the markup; this attaches one listener to the container and reads
 * which photo was hit from `data-gallery-open`. Neither component needs the
 * other's class names, which is the same arrangement `data-gallery-strip`
 * already uses for the thumbnails.
 *
 * Without JavaScript the buttons do nothing and every photo is still in the
 * page, still swipeable, exactly as before — the trade GalleryThumbs already
 * documents and accepts.
 *
 * ## Behaviour
 *
 * Escape closes, ← and → move between photos, the backdrop closes, focus is
 * trapped while open and returned to the photo that was tapped. The page
 * behind does not scroll.
 *
 * @param {Object} props
 * @param {import('@/lib/types').ProductImage[]} props.images
 * @param {string} props.productName
 */
export default function GalleryLightbox({ images = [], productName }) {
  /* null = closed. The index doubles as the open flag, so the two can never
     disagree about whether something is showing. */
  const [index, setIndex] = useState(null);

  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const close = useCallback(() => {
    setIndex(null);
    restoreFocusRef.current?.focus?.();
  }, []);

  const step = useCallback(
    (delta) => {
      setIndex((current) => {
        if (current === null) return current;
        /* Wraps, so the last photo's → returns to the first rather than
           dead-ending on a button that looks live. */
        return (current + delta + images.length) % images.length;
      });
    },
    [images.length]
  );

  /* --- Open on a tap anywhere in the strip ------------------------------ */
  useEffect(() => {
    if (!images.length) return undefined;

    const strip = document.querySelector('[data-gallery-strip]');
    if (!strip) return undefined;

    function onClick(event) {
      const trigger = event.target.closest('[data-gallery-open]');
      if (!trigger || !strip.contains(trigger)) return;

      const i = Number(trigger.getAttribute('data-gallery-open'));
      if (!Number.isInteger(i) || i < 0 || i >= images.length) return;

      restoreFocusRef.current = trigger;
      setIndex(i);
    }

    strip.addEventListener('click', onClick);
    return () => strip.removeEventListener('click', onClick);
  }, [images.length]);

  /* --- Modal behaviour while open --------------------------------------- */
  useEffect(() => {
    if (index === null) return undefined;

    closeRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll('button:not([disabled])');
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

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
       width is replaced as padding so the layout does not jump sideways —
       on Windows that shift is ~15px and very visible. */
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
  }, [index, close, step]);

  if (index === null) return null;

  const image = images[index];
  const many = images.length > 1;

  return (
    <div
      className={styles.lightbox}
      onMouseDown={(e) => {
        /* Only the backdrop itself. The check stops a drag that started on
           the photo and released outside from closing the view. */
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.lightboxInner}
        role="dialog"
        aria-modal="true"
        aria-label={`${productName}の商品画像${many ? ` ${index + 1} / ${images.length}` : ''}`}
      >
        <button
          type="button"
          ref={closeRef}
          className={`${styles.lightboxBtn} ${styles.lightboxClose}`}
          onClick={close}
          aria-label="閉じる"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {many && (
          <button
            type="button"
            className={`${styles.lightboxBtn} ${styles.lightboxPrev}`}
            onClick={() => step(-1)}
            aria-label="前の画像"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        )}

        {/* The photo. `fill` rather than the stored width and height: the
            files are not a consistent shape, and the job here is to be as
            large as the viewport allows without cropping anything. Loaded
            unoptimized to match the strip, so it is the file the browser
            already has rather than a second fetch of a different URL. */}
        <div className={styles.lightboxFrame}>
          <Image
            key={image.url}
            src={image.url}
            alt={image.alt || `${productName}の商品画像 ${index + 1}`}
            fill
            sizes="100vw"
            className={styles.lightboxImage}
            unoptimized
          />
        </div>

        {many && (
          <button
            type="button"
            className={`${styles.lightboxBtn} ${styles.lightboxNext}`}
            onClick={() => step(1)}
            aria-label="次の画像"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {many && (
          <p className={styles.lightboxCount} aria-hidden="true">
            {index + 1} / {images.length}
          </p>
        )}
      </div>
    </div>
  );
}
