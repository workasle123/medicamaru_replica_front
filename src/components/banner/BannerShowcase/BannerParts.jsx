import Link from 'next/link';
import styles from './BannerShowcase.module.css';

/**
 * Pieces shared by the carousel slides and the static tiles.
 *
 * No "use client" directive: this module is pulled into both the server
 * component (BannerShowcase) and the client one (BannerCarousel), and is
 * compiled for whichever graph imports it.
 */

/**
 * A banner is a link when it has somewhere to go, and plain artwork when it
 * does not — one live banner has a null link_url, and a tile that navigates
 * to the page the visitor is already on is worse than one that does nothing.
 */
export function Frame({ banner, className, children }) {
  const classes = `${className} ${styles[banner.theme] ?? ''}`;
  return banner.href ? (
    <Link href={banner.href} className={classes}>
      {children}
    </Link>
  ) : (
    <div className={classes}>{children}</div>
  );
}

/**
 * Banner copy.
 *
 * Uploaded artwork already carries the campaign's own typography, so printing
 * our title over it would double-print the message and bury the design under
 * a scrim. When there is artwork the copy is therefore exposed to assistive
 * technology only — it is still the link's accessible name, which is why the
 * <Image> alt is empty.
 *
 * With no artwork the same copy becomes the visible banner, so an editor who
 * saves a banner without an image still gets a usable one.
 */
export function Copy({ banner }) {
  if (banner.image) {
    return (
      <span className="visually-hidden">
        {[banner.badge, banner.title, banner.subtitle].filter(Boolean).join('。')}
      </span>
    );
  }

  return (
    <div className={styles.overlay}>
      {banner.badge && <span className={styles.badge}>{banner.badge}</span>}
      <span className={styles.title}>{banner.title}</span>
      {banner.subtitle && <span className={styles.subtitle}>{banner.subtitle}</span>}
      {banner.ctaLabel && (
        <span className={styles.cta}>
          {banner.ctaLabel}
          <span aria-hidden="true">→</span>
        </span>
      )}
    </div>
  );
}
