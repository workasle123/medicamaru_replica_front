import Link from 'next/link';
import styles from './NoticeBar.module.css';

/**
 * NoticeBar — site announcements.
 *
 * Text only, deliberately: an announcement that matters (a shipping pause, a
 * customs delay) needs to be readable and linkable, not baked into an image
 * where it cannot be selected, translated or read by a screen reader.
 *
 * Not dismissible. A dismiss control needs client state and persistence, and
 * for genuinely important operational notices, hiding them on first read is
 * the wrong default.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Banner[]} props.banners
 */
export default function NoticeBar({ banners = [] }) {
  if (!banners.length) return null;

  return (
    <div className={styles.wrap}>
      <div className="container">
        <aside className={styles.bar} aria-label="お知らせ">
          <ul className={styles.list} role="list">
            {banners.map((banner) => (
              <li key={banner.id} className={styles.item}>
                <span className={styles.icon} aria-hidden="true">!</span>

                <p className={styles.content}>
                  <span className={styles.title}>{banner.title}</span>
                  {banner.subtitle && <> {banner.subtitle}</>}
                </p>

                {banner.href && (
                  <Link href={banner.href} className={styles.link}>
                    詳しく見る ›
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
