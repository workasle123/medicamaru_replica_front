import Image from 'next/image';
import Link from 'next/link';
import styles from './PromoTiles.module.css';

/**
 * PromoTiles — evergreen entry points into the site.
 *
 * Distinct from the carousel: these are not time-limited campaigns but
 * permanent routes in (symptom search, ranking, first-time guide), which is
 * why they get a stable grid rather than a scrollable strip.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Banner[]} props.banners
 */
export default function PromoTiles({ banners = [] }) {
  if (!banners.length) return null;

  return (
    <ul className={styles.grid} role="list">
      {banners.map((banner) => (
        <li key={banner.id}>
          <Link href={banner.href} className={`${styles.tile} ${styles[banner.theme] ?? ''}`}>
            <div className={styles.media}>
              {banner.image && (
                <Image
                  src={banner.image.url}
                  alt=""
                  width={banner.image.width || 720}
                  height={banner.image.height || 400}
                  className={styles.image}
                  sizes="(max-width: 767px) 100vw, min(33vw, 580px)"
                />
              )}
            </div>

            <div className={styles.overlay}>
              <span className={styles.title}>{banner.title}</span>
              {banner.subtitle && <span className={styles.subtitle}>{banner.subtitle}</span>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
