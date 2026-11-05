import Link from 'next/link';

import styles from './ProductHighlights.module.css';

/**
 * ProductHighlights — the block under the price: what the purchase means,
 * three assurances, the composition and the delivery estimate.
 *
 * Modelled on medicine.shop's product page, which carries the same four
 * pieces between the price and the pack list. The personal-import and resale
 * lines used to sit as a paragraph inside the pack panel, where they made the
 * panel taller than the first screen; as bullets here they are read before
 * the packs rather than after them.
 *
 * Server Component — text and links only.
 *
 * @param {Object} props
 * @param {string} [props.composition]       e.g. 'Gokshura, Kokilaksha, Almond'
 * @param {string} [props.shippingEstimate]  e.g. '通常10〜14日で発送予定'
 */
export default function ProductHighlights({ composition, shippingEstimate }) {
  return (
    <div className={styles.block}>
      <ul className={styles.notes}>
        <li>日本の個人輸入制度に基づき、ご本人の使用を目的としてご提供します。</li>
        <li>数量限定でのお取り扱いです。</li>
        <li>第三者への譲渡・転売は法律で禁止されています。</li>
      </ul>

      <ul className={styles.assurances}>
        <li className={styles.assurance}>
          <IconShield />
          正規品保証
        </li>
        <li className={styles.assurance}>
          <IconGlobe />
          海外からの発送
        </li>
        <li className={styles.assurance}>
          <Link href="/about-personal-import" className={styles.assuranceLink}>
            <IconDoc />
            個人輸入ガイド
          </Link>
        </li>
      </ul>

      {composition && (
        <p className={styles.composition}>
          <span className={styles.compositionLabel}>商品構成</span>
          <span>{composition}</span>
        </p>
      )}

      {shippingEstimate && (
        <p className={styles.shipping}>
          <IconTruck />
          {shippingEstimate}
        </p>
      )}
    </div>
  );
}

/* Outline icons on a 24px grid, as elsewhere. Decorative: each sits beside
   its own label. */
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function IconShield() {
  return (
    <svg {...iconProps} className={styles.icon}>
      <path d="M12 3 19 6v5c0 4.5-3 8.4-7 10-4-1.6-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg {...iconProps} className={styles.icon}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18-2.5-2.7-2.5-15.3 0-18Z" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg {...iconProps} className={styles.icon}>
      <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M15 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg {...iconProps} className={styles.icon}>
      <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}
