'use client';

import Image from 'next/image';
import styles from './ProductGallery.module.css';

/**
 * GalleryThumbs — the thumbnail row under the product images.
 *
 * Buttons, NOT anchors to `#product-image-N`. An href put that hash in three
 * places the user never asked to go: the address bar after a click, the
 * status bar on hover, and "open link in new tab" on a right-click. Choosing
 * which photo to look at is not navigation, so it leaves no trace.
 *
 * The cost of dropping the href is that these do nothing with JavaScript off.
 * The images themselves are unaffected: the strip is a horizontally
 * scrollable, swipeable element, every photo is in the page and reachable by
 * dragging it, and the line under these thumbnails says so
 * (「横スクロールでご覧いただけます」).
 *
 * The strip is scrolled directly rather than through scrollIntoView, which
 * also scrolls ancestors — here that meant the page jumping vertically to
 * bring the gallery into view when all you did was tap a thumbnail.
 *
 * @param {Object} props
 * @param {import('@/lib/types').ProductImage[]} props.images
 */
export default function GalleryThumbs({ images }) {
  function show(index) {
    const slide = document.getElementById(`product-image-${index}`);
    const strip = slide?.closest('[data-gallery-strip]');
    if (!slide || !strip) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    strip.scrollTo({
      left: slide.offsetLeft - strip.offsetLeft,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  return (
    <ul className={styles.thumbs} role="list">
      {images.map((image, i) => (
        <li key={image.url}>
          <button
            type="button"
            className={styles.thumb}
            aria-label={`商品画像 ${i + 1} を表示`}
            onClick={() => show(i)}
          >
            {/* unoptimized, matching the strip above — and it costs nothing.
                The strip already loads this exact file at full size, so an
                optimised thumbnail was a SECOND download of the same photo at
                a different URL. Sharing the URL means the browser fetches each
                image once and takes the thumbnail from cache.

                It also makes right-click → open image in new tab give the real
                .../storage/products/triqular_ed_3.webp from the thumbnail,
                the same address the big view gives, instead of
                /_next/image?url=…&w=128&q=75.

                Listing CARDS are a different case and stay optimised: there
                the small version is the only one loaded, and w=128 turns a
                39.5KB file into 2.6KB. */}
            <Image
              src={image.url}
              alt=""
              width={64}
              height={64}
              className={styles.thumbImage}
              unoptimized
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
