import Link from 'next/link';
import CategoryBanner from '@/components/banner/CategoryBanner/CategoryBanner';
import styles from './OrderGuideAside.module.css';

/**
 * OrderGuideAside — the column beside the homepage FAQs.
 *
 * Built to hold an order-guide banner from the admin panel. That banner does
 * not exist yet, so until it does this renders the same information as a
 * card: an empty column next to the FAQs would read as a layout fault, and
 * the three steps are worth having regardless.
 *
 * Passing `banner` swaps the card for the artwork with no other change.
 *
 * `wide` is for when there are no homepage FAQs to sit beside: the card then
 * spans the page, with the three steps side by side from tablet width up.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Banner} [props.banner]
 * @param {boolean} [props.wide]
 */
export default function OrderGuideAside({ banner, wide = false }) {
  if (banner?.image) return <CategoryBanner banner={banner} />;

  // A section of its own when it stands alone; an aside beside the FAQs.
  const Tag = wide ? 'section' : 'aside';

  return (
    <Tag className={wide ? `${styles.card} ${styles.wide}` : styles.card}>
      <h2 className={styles.title}>ご注文の流れ</h2>

      <ol className={styles.steps}>
        <li className={styles.step}>
          <span className={styles.num} aria-hidden="true">1</span>
          <span>
            <span className={styles.stepTitle}>商品を選ぶ</span>
            <span className={styles.stepBody}>症状・カテゴリー・商品名から探せます。</span>
          </span>
        </li>
        <li className={styles.step}>
          <span className={styles.num} aria-hidden="true">2</span>
          <span>
            <span className={styles.stepTitle}>カートに入れて注文</span>
            <span className={styles.stepBody}>会員登録なしでもご注文いただけます。</span>
          </span>
        </li>
        <li className={styles.step}>
          <span className={styles.num} aria-hidden="true">3</span>
          <span>
            <span className={styles.stepTitle}>お届け</span>
            <span className={styles.stepBody}>海外発送のため通常10〜14日かかります。</span>
          </span>
        </li>
      </ol>

      <Link href="/faq" className={styles.cta}>
        よくあるご質問を見る
        <span aria-hidden="true">→</span>
      </Link>
    </Tag>
  );
}
