'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './Wishlist.module.css';
import { moveToCartAction } from './actions';
import { formatYenSuffix } from '@/lib/format';
import { notifyWishlistChanged } from '@/lib/wishlist-events';
import { notifyCartChanged } from '@/lib/cart-events';

/**
 * Pack, quantity and add-to-cart, on one favourites card.
 *
 * A saved product is not a cart line — it has no quantity of its own, and no
 * chosen pack. Both have to be picked here before anything can be added, which
 * is why this is a small form rather than a bare + button: "one more" is not a
 * meaningful instruction when a product sells in three pack sizes at three
 * prices.
 *
 * The quantity is local state until submitted. Nothing exists server-side to
 * increment yet, so − and + are ordinary buttons adjusting a number, and only
 * the submit reaches the server. That is the opposite of the cart's stepper,
 * where every press updates a row that already exists.
 *
 * THE LIST HOLDS EVERY PACK, not only the saved one. The favourites endpoint
 * used to return just the pack that had been wishlisted, which left this
 * select with a single option — a control that looked interactive and could
 * not be changed. It now returns the product's full pack list with the saved
 * ones named separately, so the select opens on what the customer saved and
 * still lets them switch size before re-buying.
 *
 * @param {Object} props
 * @param {import('@/lib/types').ProductSummary} props.product
 */
export default function WishlistAddToCart({ product }) {
  const variants = (product.variants ?? []).filter((v) => v.inStock);

  /* Opens on the pack the customer actually saved. Falls back to the first in
     stock — which is what happens when the saved pack has since been
     withdrawn, and is better than opening on nothing. */
  const saved = (product.wishlistedVariantIds ?? []).map(String);
  const savedInStock = variants.find((v) => saved.includes(String(v.id)));

  const [variantId, setVariantId] = useState((savedInStock ?? variants[0])?.id ?? '');
  const [qty, setQty] = useState(1);

  /* Nothing to add. Rather than a disabled control that does not say why, the
     card keeps its link through to the product page. */
  if (!variants.length) {
    return <p className={styles.unavailable}>現在お取り扱いがありません</p>;
  }

  const selected = variants.find((v) => String(v.id) === String(variantId)) ?? variants[0];
  const limit = selected?.purchaseLimit ?? 99;

  return (
    <form
      action={moveToCartAction}
      className={styles.addForm}
      /* Both badges change: the cart gains a line and the saved list loses
         one. The action redirects back to /wishlist, the same pathname — and
         after the first move the query string does not change either — so
         neither badge would notice without being told. The delay lets the
         writes land before the counts are re-read. */
      onSubmit={() => {
        setTimeout(notifyCartChanged, 900);
        setTimeout(notifyWishlistChanged, 900);
      }}
    >
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="quantity" value={qty} />
      {/* The packs the endpoint said were saved, so the action knows which
          rows to clear once the product is in the cart. */}
      <input type="hidden" name="wishlistVariantIds" value={saved.join(',')} />

      {/* A select, not the product page's tier cards. There is room for one
          control on a card in a four-across grid, and the price beside it is
          what makes the choice legible. */}
      <label className="visually-hidden" htmlFor={`pack-${product.id}`}>
        容量を選択
      </label>
      <select
        id={`pack-${product.id}`}
        name="variantId"
        className={styles.packSelect}
        value={variantId}
        onChange={(e) => {
          setVariantId(e.target.value);
          /* A new pack can carry a lower limit than the quantity already
             chosen, so it is clamped rather than left invalid. */
          setQty((q) => {
            const next = variants.find((v) => String(v.id) === String(e.target.value));
            return Math.min(q, next?.purchaseLimit ?? 99);
          });
        }}
      >
        {variants.map((v) => (
          <option key={v.id} value={v.id}>
            {v.packLabel} ／ {formatYenSuffix(v.price)}
          </option>
        ))}
      </select>

      <div className={styles.addRow}>
        <div className={styles.stepper} role="group" aria-label="数量">
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="数量を減らす"
          >
            <span aria-hidden="true">−</span>
          </button>

          <span className={`${styles.qtyValue} numeric`} aria-live="polite">
            {qty}
          </span>

          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => setQty((q) => Math.min(limit, q + 1))}
            disabled={qty >= limit}
            aria-label="数量を増やす"
          >
            <span aria-hidden="true">＋</span>
          </button>
        </div>

        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.addBtn} disabled={pending}>
      {pending ? '追加中…' : 'カートに入れる'}
    </button>
  );
}
