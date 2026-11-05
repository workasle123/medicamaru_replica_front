import Image from 'next/image';
import Link from 'next/link';

import SideBox from '../SideBox/SideBox';
import { IconCrown } from '../icons';
import { formatYenPrefix, formatPerUnit } from '@/lib/format';
import styles from './RankingBox.module.css';

/**
 * RankingBox — the best sellers as a numbered side-column list: rank, photo,
 * name and starting price, each linking to the product.
 *
 * The same ranking as the homepage's 売れ筋ランキング rail (the backend's
 * rankedProducts). Nothing renders when it is empty.
 *
 * @param {Object} props
 * @param {import('@/lib/types').ProductSummary[]} props.products
 */
export default function RankingBox({ products }) {
  if (products.length === 0) return null;

  return (
    <SideBox id="side-ranking" title="売れ筋ランキング" icon={<IconCrown />} flush>
      <ol className={styles.list}>
        {products.map((product, index) => (
          <li key={product.id}>
            <Link href={`/product/${product.slug}`} className={styles.link}>
              <span className={`${styles.rank} ${styles[`rank${index + 1}`] ?? ''}`}>
                <span className="visually-hidden">第</span>
                {index + 1}
                <span className="visually-hidden">位</span>
              </span>
              {/* Empty alt: the name beside it says the same thing. Fixed
                  width with no `sizes`, so next/image emits just 1x and 2x. */}
              {product.image?.url ? (
                <Image
                  src={product.image.url}
                  alt=""
                  width={56}
                  height={56}
                  className={styles.image}
                />
              ) : (
                <span className={styles.image} aria-hidden="true" />
              )}
              <span className={styles.text}>
                <span className={styles.name}>{product.name}</span>
                <span className={styles.price}>
                  <span className="numeric">{formatYenPrefix(product.fromUnitPrice)}</span>
                  <span className={styles.perUnit}>{formatPerUnit(product.unitLabel)}</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </SideBox>
  );
}
