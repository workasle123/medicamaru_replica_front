import styles from './MobileBuyBar.module.css';

/**
 * MobileBuyBar — a fixed bar under 1024px that keeps the price in view and
 * scrolls to the pack panel.
 *
 * A plain anchor to #purchase, so it needs no JavaScript and works before
 * hydration. `data-bottom-bar` is the hook the chat launcher already watches
 * (see ChatLauncher.module.css), so the launcher steps up over this bar
 * instead of covering it.
 *
 * @param {Object} props
 * @param {string} props.price       Pre-formatted unit price, e.g. 「¥92」.
 * @param {string} props.perUnit     Pre-formatted unit, e.g. 「/1錠あたり」.
 * @param {boolean} props.inStock
 */
export default function MobileBuyBar({ price, perUnit, inStock }) {
  return (
    <div className={styles.bar} data-bottom-bar>
      <p className={styles.price}>
        <span className={`${styles.amount} numeric`}>{price}</span>
        <span className={styles.per}>{perUnit}</span>
      </p>
      <a href="#purchase" className={styles.btn} aria-disabled={!inStock || undefined}>
        {inStock ? '購入オプションを選ぶ' : '在庫なし'}
      </a>
    </div>
  );
}
