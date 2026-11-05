import styles from './ProductGrid.module.css';
import ProductCard from '../ProductCard/ProductCard';
import EmptyState from '@/components/ui/EmptyState/EmptyState';

/**
 * ProductGrid — responsive product grid with a built-in empty state.
 *
 * Every listing surface routes through this, so "no results" is handled once
 * rather than forgotten on individual pages (brief §16).
 *
 * @param {Object} props
 * @param {import('@/lib/types').ProductSummary[]} props.products
 * @param {number} [props.priorityCount] How many images to mark priority
 * @param {React.ReactNode} [props.empty] Custom empty state
 * @param {(product: import('@/lib/types').ProductSummary) => React.ReactNode}
 *   [props.renderActions] Extra controls beneath each card. Used by the
 *   favourites page for its add-to-cart form; every other listing passes
 *   nothing and renders exactly as before.
 */
export default function ProductGrid({ products, priorityCount = 4, empty, renderActions }) {
  if (!products?.length) {
    return (
      empty ?? (
        <EmptyState
          title="該当する商品が見つかりませんでした"
          body="検索条件を変更するか、カテゴリーからお探しください。"
          actionHref="/category"
          actionLabel="カテゴリーを見る"
        />
      )
    );
  }

  return (
    <ul className={styles.grid} role="list">
      {products.map((product, i) => (
        <li key={product.id} className={styles.item}>
          <ProductCard product={product} priority={i < priorityCount} />
          {renderActions?.(product)}
        </li>
      ))}
    </ul>
  );
}
