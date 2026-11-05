import styles from './SpecTable.module.css';

/**
 * SpecTable — the product's key facts, above the fold.
 *
 * A real <table> because this is genuinely tabular data (label/value pairs),
 * which gives screen readers the right structure for free.
 *
 * Only renders rows the backend actually supplies — the brief is explicit
 * that we must not invent fields the data does not support.
 *
 * @param {Object} props
 * @param {import('@/lib/types').SpecRow[]} props.specs
 */
export default function SpecTable({ specs = [] }) {
  if (!specs.length) return null;

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className="visually-hidden">商品の基本情報</caption>
        <tbody>
          {specs.map((spec) => (
            <tr key={spec.label} className={styles.row}>
              <th scope="row" className={styles.label}>
                {spec.label}
              </th>
              <td className={styles.value}>
                {spec.value}
                {spec.href && (
                  <a href={spec.href} className={styles.jump}>
                    → 詳しく見る
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
