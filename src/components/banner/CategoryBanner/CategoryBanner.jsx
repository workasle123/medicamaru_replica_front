import Image from 'next/image';
import { Frame, Copy } from '../BannerShowcase/BannerParts';
import styles from './CategoryBanner.module.css';

/**
 * CategoryBanner — a single full-width banner introducing a category rail.
 *
 * Same width and aspect as the campaign carousel, so the page reads as one
 * rhythm rather than two competing banner sizes.
 *
 * There is no per-category banner placement in the admin panel yet, so the
 * homepage currently feeds these from the carousel set. When a real
 * placement exists this component does not change — only its source does.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Banner} [props.banner]
 */
export default function CategoryBanner({ banner }) {
  if (!banner?.image) return null;

  return (
    <Frame banner={banner} className={styles.banner}>
      <div className={styles.media}>
        <Image
          src={banner.image.url}
          /* Decorative: <Copy> carries the same message as text. */
          alt=""
          width={banner.image.width || 1330}
          height={banner.image.height || 300}
          className={styles.image}
          sizes="(max-width: 1023px) 100vw, min(100vw, 1720px)"
        />
      </div>

      <Copy banner={banner} />
    </Frame>
  );
}
