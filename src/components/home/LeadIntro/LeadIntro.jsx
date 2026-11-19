import Link from 'next/link';

import styles from './LeadIntro.module.css';

/**
 * LeadIntro — the card that opens the homepage.
 *
 * Copy and the two ways into the catalogue on the left, the LINE banner on the
 * right (under the copy on a phone). The H1 text is unchanged. The element
 * keeps the `lead` class: the homepage-only theme in styles/theme-home.css is
 * scoped to it.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.aside]  Rendered beside (or under) the copy.
 */
export default function LeadIntro({ aside }) {
  return (
    <section className={styles.lead}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>お薬らく｜海外医薬品の個人輸入サポート</p>

        <h1 className={styles.heading}>
          海外の医薬品・ジェネリック医薬品の通販
        </h1>

        <p className={styles.sub}>
          お悩みや目的から、かんたんに商品をお探しいただけます。
        </p>

        <div className={styles.actions}>
          <Link href="/category" className={styles.cta}>
            カテゴリーから探す
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/symptom" className={styles.ctaGhost}>
            症状から探す
          </Link>
        </div>
      </div>

      {/* Rendered only when something is supplied, so the card collapses to
          one column instead of reserving an empty half. */}
      {aside && <div className={styles.visual}>{aside}</div>}
    </section>
  );
}
