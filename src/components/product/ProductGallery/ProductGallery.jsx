import Image from 'next/image';
import GalleryThumbs from './GalleryThumbs';
import GalleryLightbox from './GalleryLightbox';
import styles from './ProductGallery.module.css';

/**
 * ProductGallery — product imagery.
 *
 * Server Component: the images form a scroll-snap strip that swipes on touch
 * and scrolls on desktop. The thumbnails are anchors to each slide, so the
 * gallery still works with no JavaScript; GalleryThumbs is the one client
 * piece, and only so that choosing a photo does not push
 * `#product-image-2` into the address bar and the back button.
 *
 * The first image is `priority` — it is the LCP element on this page.
 *
 * @param {Object} props
 * @param {import('@/lib/types').ProductImage[]} props.images
 * @param {string} props.productName
 */
export default function ProductGallery({ images = [], productName }) {
  if (!images.length) return null;

  return (
    <div className={styles.gallery}>
      {/* data-gallery-strip: how GalleryThumbs finds the element to scroll,
          without either component knowing the other's class names. */}
      <div
        className={styles.strip}
        data-gallery-strip
        aria-label={`${productName}の商品画像`}
      >
        {images.map((image, i) => (
          <div key={image.url} id={`product-image-${i}`} className={styles.slide}>
            {/* unoptimized, so the main photo is served at its real address —
                .../storage/products/dsc06931.webp rather than
                /_next/image?url=…&w=640&q=75. This is the image people open in
                a new tab, and an opaque optimiser URL is not where that photo
                lives. medicine.shop serves its photos the same way.

                Measured before doing it: the stored files are ALREADY WebP and
                already about the size this renders at, so the optimiser was
                saving roughly 12% here (39.5KB -> 34.9KB) — it also removes a
                CDN hazard, since Hostinger caches /_next/image without
                honouring Vary: Accept and has served the wrong format for it.

                The THUMBNAILS below stay optimised, and so do the cards: at
                w=128 the optimiser turns that same 39.5KB file into 2.6KB, so
                a listing page depends on it. */}
            {/* A BUTTON around the photo, so tapping it opens the full-size
                view — the pack, the blister and the printed strength are
                often only legible there, and this square tops out at 480px.

                `data-gallery-open` is how GalleryLightbox finds which photo
                was hit, by delegation on the strip; this file stays a Server
                Component and the strip keeps working with no JavaScript, the
                same arrangement `data-gallery-strip` uses for the thumbnails.
                With JS off the button simply does nothing and every photo is
                still in the page and still swipeable. */}
            <button
              type="button"
              className={styles.slideButton}
              data-gallery-open={i}
              aria-label={`${productName}の商品画像 ${i + 1} を拡大表示`}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName}の商品画像 ${i + 1}`}
                width={image.width || 600}
                height={image.height || 600}
                className={styles.image}
                sizes="(max-width: 1023px) 100vw, 480px"
                priority={i === 0}
                unoptimized
              />
              <span className={styles.zoomHint} aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5M11 8v6M8 11h6" />
                </svg>
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Renders nothing until a photo is tapped. */}
      <GalleryLightbox images={images} productName={productName} />

      {images.length > 1 && (
        <>
          <GalleryThumbs images={images} />
          <p className={styles.count}>画像 {images.length} 枚（横スクロールでご覧いただけます）</p>
        </>
      )}
    </div>
  );
}
