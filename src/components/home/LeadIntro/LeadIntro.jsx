import Link from 'next/link';

import styles from './LeadIntro.module.css';

/**
 * LeadIntro — the block that opens the homepage: the page's H1, the LINE
 * banner and a button into the catalogue. The best-seller rail that used to
 * sit beside them was removed; the ranking is still shown further down.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.banner]  Sits between the headline and the CTA.
 */
export default function LeadIntro({ banner }) {
  return (
    <section className={styles.lead}>
      <div className={styles.intro}>
        <h1 className={styles.heading}>
          海外の医薬品・ジェネリック医薬品の通販
        </h1>

        {/* Slot for the LINE banner. Rendered only when one is supplied, so
            the column collapses cleanly rather than reserving empty space. */}
        {banner}

        <Link href="/category" className={styles.cta}>
          カテゴリーから探す
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
