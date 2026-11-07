import Image from 'next/image';
import CardImage from './CardImage';
import Link from 'next/link';
import styles from './ProductCard.module.css';
import Badge from '@/components/ui/Badge/Badge';
import Rating from '@/components/ui/Rating/Rating';
import { formatYenPrefix, formatPerUnit, formatDiscount } from '@/lib/format';

/**
 * ProductCard — the catalogue's atom.
 *
 * Server Component: it is pure presentation, so it ships zero JavaScript.
 *
 * Design notes from Phase 2 research:
 *  - One price: the per-unit rate, `¥1,910 /1錠あたり` (2026-09-23). It
 *    replaced a `1錠 1,910円〜` unit price over a `15,000円〜` pack price —
 *    two numbers and two 〜 on a card that has room for one figure. For a
 *    product with tiered packs this is the cheapest tier's rate.
 *  - NO description. `shortDescription` is a 120-character cut of the body
 *    HTML, so every one began with the literal 「商品詳細」 heading followed by a
 *    mid-sentence truncation — noise rather than a summary. Removing it also
 *    took ~51 KB off the homepage, since each one is serialised twice (markup
 *    plus the RSC payload). It is still used as the meta-description fallback
 *    for the handful of products with no admin meta.
 *  - Stock and review count are shown; both are trust signals shoppers in
 *    this market look for before clicking.
 *
 * @param {Object} props
 * @param {import('@/lib/types').ProductSummary} props.product
 * @param {boolean} [props.compact]  For the homepage headline rail — a
 *   shallower 2:1 image box.
 * @param {boolean} [props.priority] Set on above-the-fold images only
 */
export default function ProductCard({ product, compact = false, priority = false, preferPack = false }) {
  const {
    slug, name, brand, image,
    fromUnitPrice, unitLabel,
    maxDiscountPct, inStock, rating,
  } = product;
  // The homepage asks for the pack photo; everywhere else shows the primary image.
  const packs = preferPack ? product.packImages : null;
  const shown = image;

  return (
    <article className={[styles.card, compact ? styles.compact : ''].filter(Boolean).join(' ')}>
      <div className={styles.media}>
        {/* 在庫なし only. The discount moved down beside the price, where the
            number it is a discount ON actually is — over the packshot it was
            a figure with nothing to relate to. */}
        <div className={styles.badges}>
          {!inStock && <Badge variant="outOfStock">在庫なし</Badge>}
        </div>

        {/* GUARDED. `image` is undefined for a product whose asset_path is
            null — the normaliser says so explicitly — and reading .url off it
            threw inside a Server Component, which takes down the whole
            listing with 「問題が発生しました」 rather than losing one thumbnail.
            An empty box is the right failure here: the name, price and link
            are all still usable. */}
        {packs?.length ? (
          <CardImage
            sources={packs}
            name={name}
            className={styles.image}
            missingClassName={styles.imageMissing}
            sizes="(max-width: 767px) 45vw, (max-width: 1023px) 30vw, 240px"
            priority={priority}
          />
        ) : shown?.url ? (
        <Image
          src={shown.url}
          alt={shown.alt || name}
          width={shown.width || 600}
          height={shown.height || 600}
          className={styles.image}
          sizes="(max-width: 767px) 45vw, (max-width: 1023px) 30vw, 240px"
          priority={priority}
        />
        ) : (
          <div className={styles.imageMissing} aria-hidden="true" />
        )}
      </div>

      {/* Brand, name, price, stars — centred, the order the market uses
          (okusurinavi, medicine.shop) — with 在庫あり below the stars, which
          those sites do not carry. */}
      <div className={styles.body}>
        {brand && <span className={styles.brand}>{brand}</span>}

        <h3 className={styles.name}>
          <Link href={`/product/${slug}`} className={styles.nameLink}>
            {name}
          </Link>
        </h3>

        {/* Wrapped together, and the WRAPPER carries the margin that pins
            this to the foot of the card. Putting it on the badge instead
            would leave cards without a discount unpinned, and their prices
            would stop lining up with the rest of the row. */}
        <div className={styles.priceGroup}>
          {maxDiscountPct > 0 && (
            <Badge variant="sale">{formatDiscount(maxDiscountPct)}</Badge>
          )}

          <p className={styles.priceBlock}>
            <span className={`${styles.unitPrice} numeric`}>{formatYenPrefix(fromUnitPrice)}</span>
            <span className={styles.perUnit}>{formatPerUnit(unitLabel)}</span>
          </p>
        </div>

        <div className={styles.meta}>
          <Rating average={rating.average} count={rating.count} />
          {inStock && <Badge variant="inStock">在庫あり</Badge>}
        </div>
      </div>
    </article>
  );
}
