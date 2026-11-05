import styles from './PriceTiers.module.css';
import Badge from '@/components/ui/Badge/Badge';
import VariantPurchase, { CartStateProvider } from './VariantPurchase';
import { formatYenSuffix, formatDiscount, formatNumber } from '@/lib/format';

/**
 * PriceTiers — pack selection and add-to-cart.
 *
 * Still a Server Component: every price, badge and label here is rendered on
 * the server. Only the quantity control and the add button inside each row are
 * client-side, because they need state and a submit handler.
 *
 * All monetary values are rendered exactly as the backend supplied them.
 * Nothing here computes a price, a discount or a total: the backend is the
 * sole source of truth for commerce maths (brief §17).
 *
 * ## One button per row
 *
 * This used to be a radio group with a single quantity and a single
 * カートに入れる at the foot of the panel. With several pack sizes that made
 * buying a three-step action — select the tier, set the quantity, scroll down
 * to the button — and the selection was invisible by the time you reached the
 * button. Each row now carries its own quantity and its own button.
 *
 * The radios are gone with it. They existed only to tell that one shared form
 * which variant to post; a form per row says so directly.
 *
 * The form posts `productId` as well as `variantId`, because the cart endpoint
 * validates the variant against its product and refuses a variant id alone.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Product} props.product
 */
export default function PriceTiers({ product }) {
  const { variants, id: productId, slug, name } = product;
  const available = variants.filter((v) => v.inStock);


  if (!available.length) {
    return (
      <div className={styles.panel}>
        <p className={styles.outOfStock}>
          申し訳ございません。現在この商品は在庫切れです。
        </p>
      </div>
    );
  }

  return (
    /* Wraps the whole panel so the cart figure behind the limit check is
       fetched once and shared, rather than once per row. */
    <CartStateProvider productId={productId}>
      <div className={styles.panel}>
        <h2 className={styles.heading}>数量別価格</h2>
        <p className={styles.subheading}>
          まとめ買いで1{variants[0].unitLabel}あたりの価格が下がります。
        </p>

        <ul className={styles.tiers}>
          {variants.map((variant) => (
            <li key={variant.id} className={styles.tier}>
              <div className={styles.tierHead}>
                <span className={styles.tierMain}>
                  <span className={styles.packLabel}>{variant.packLabel}</span>
                  <span className={styles.tierMeta}>
                    {variant.discountPct > 0 && (
                      <Badge variant="sale">{formatDiscount(variant.discountPct)}</Badge>
                    )}
                    {variant.inStock ? (
                      <Badge variant="inStock">在庫あり</Badge>
                    ) : (
                      <Badge variant="outOfStock">在庫なし</Badge>
                    )}
                    {variant.points > 0 && (
                      <span>ポイント {formatNumber(variant.points)}pt</span>
                    )}
                  </span>
                </span>

                <span className={`${styles.tierPricing} numeric`}>
                  {variant.listPrice > variant.price && (
                    <span className={styles.wasPrice}>{formatYenSuffix(variant.listPrice)}</span>
                  )}
                  <span className={styles.price}>{formatYenSuffix(variant.price)}</span>
                  <span className={styles.unitPrice}>
                    1{variant.unitLabel} {formatYenSuffix(variant.unitPrice)}
                  </span>
                </span>
              </div>

              {variant.inStock ? (
                <VariantPurchase
                  productId={productId}
                  productName={name}
                  variant={variant}
                  slug={slug}
                />
              ) : (
                <p className={styles.tierUnavailable}>この数量は現在お取り扱いできません。</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </CartStateProvider>
  );
}
