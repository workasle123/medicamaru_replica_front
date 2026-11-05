import { getImageProps } from 'next/image';

import styles from './LineBanner.module.css';

/**
 * LineBanner — the LINE友だち追加 promotion in the homepage lead.
 *
 * Supplied artwork, not composed markup: the offer, the mascot and the CTA
 * button are all baked into the image, so this only has to place it.
 *
 * Wrapped in a link when `LINE_ACCOUNT_URL` is set. Without it the banner still
 * renders — the offer is worth showing either way — but nothing is clickable,
 * which is better than a button that goes nowhere. Server-side env var: this is
 * a Server Component, so it never reaches the browser bundle.
 *
 * The artwork comes from the admin panel — banner_position `homepage_line` —
 * so the promotion can be changed without a deploy. The bundled file is the
 * fallback for when no banner is assigned, which keeps the slot filled rather
 * than collapsing the column next to the product rail.
 *
 * ## Two crops, one slot
 *
 * The slot is 2.5:1 in the desktop column and 2.05:1 stacked on a phone, and
 * it is the SAME element — so a single file has to survive both, and the width
 * it spans swings from 288px to 672px on the way. Art direction rather than
 * one compromise crop: the admin's banner form already has two upload fields,
 * 「Banner Image」 and 「Mobile Image」, so each size gets a file composed for it.
 *
 *   desktop  1500 × 600  (2.5:1)   ← 「Banner Image」  / asset_path
 *   mobile    900 × 440  (2.05:1)  ← 「Mobile Image」  / thumbnail_path
 *
 * Each is comfortably 2x the largest box it has to fill — 672 × 269 at a 1920
 * viewport, 436 × 213 at the top of the stacked range.
 *
 * These two ratios are the ones the CSS pins the box to, and they are not
 * arbitrary: they are the shapes of the files actually in the admin. A box
 * that disagrees with its artwork can only crop it.
 *
 * `<picture>` rather than two `<Image>` elements, because a hidden <img> is
 * still fetched — the browser would download both files on every visit.
 * `getImageProps` gives each source the optimiser's srcset without rendering
 * an <img>, which is what makes a <picture> possible at all here.
 *
 * Without a mobile upload the desktop artwork is used at both sizes and gets
 * cropped at the sides on a phone. That is the degraded path, not the design;
 * the bundled fallback file (1330 × 300) is in it too.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Banner} [props.banner]  From the admin panel.
 */

const ALT = 'LINE友だち追加で500円OFFクーポンプレゼント';

/* Where the lead stops being two columns — LeadIntro.module.css. Below it the
   banner runs the full container width, above it it sits in the 40% column. */
const STACK_BREAKPOINT = '(min-width: 1024px)';

export default function LineBanner({ banner }) {
  /* An assigned banner brings its own destination; the env var is only the
     fallback file’s link. */
  const url = banner?.href || process.env.LINE_ACCOUNT_URL;
  const desktopSrc = banner?.image?.url || '/banners/line-friend.webp';
  const mobileSrc = banner?.imageMobile?.url;
  const alt = banner?.image?.alt || banner?.title || ALT;

  /* eager, not `priority`: lazy meant the banner did not load until something
     scrolled, and it sits in the first screenful on a desktop. Stopping short
     of fetchpriority=high leaves the real LCP candidate — the first product
     card — ahead of it in the queue. */
  const common = { alt, loading: 'eager' };

  const { props: desktop } = getImageProps({
    ...common,
    src: desktopSrc,
    width: banner?.image?.width || 1500,
    height: banner?.image?.height || 600,
    sizes: '40vw',
  });

  const { props: mobile } = mobileSrc
    ? getImageProps({
        ...common,
        src: mobileSrc,
        width: banner?.imageMobile?.width || 900,
        height: banner?.imageMobile?.height || 440,
        sizes: '100vw',
      })
    : { props: null };

  /* The <img> carries the crop used when no <source> matches, so the mobile
     file is the img and the desktop one is the source — the way round that
     leaves a browser ignoring <picture> with the smaller download. With only
     one file there is nothing to choose between, so no <source> is emitted. */
  const image = mobile ? (
    <picture>
      <source
        media={STACK_BREAKPOINT}
        srcSet={desktop.srcSet}
        sizes={desktop.sizes}
      />
      <img {...mobile} className={styles.image} />
    </picture>
  ) : (
    <img {...desktop} className={styles.image} />
  );

  if (!url) return <div className={styles.banner}>{image}</div>;

  return (
    <a
      className={styles.banner}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {image}
    </a>
  );
}
