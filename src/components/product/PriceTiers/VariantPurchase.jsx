'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import Button from '@/components/ui/Button/Button';
import { addToCartAction, updateQuantityAction, removeItemAction } from '@/app/cart/actions';
import { addToWishlistAction } from '@/app/product/[slug]/actions';
import { notifyCartChanged } from '@/lib/cart-events';

import styles from './PriceTiers.module.css';

/**
 * Buying one pack: favourite, add, and then quantity.
 *
 * ## The row shows a quantity only once there is one
 *
 * A stepper on every pack before anything is in the cart asked the customer to
 * decide "how many" before deciding "whether", and it made each row 239px tall
 * — three packs filled a 939px panel. So a row offers カートに入れる, and the
 * button becomes the quantity control once the pack is actually in the cart.
 * The number then means something real: it is the cart line, not a draft.
 *
 * ## So the controls edit the cart, not a form
 *
 * − and ＋ post updateQuantityAction against the cart ROW id, exactly as the
 * cart page does, and − at 1 removes the line and gives the カートに入れる
 * button back. Nothing here keeps a private copy of the quantity to get out of
 * step with the cart.
 *
 * ## The limit is the product's, and it interrupts
 *
 * The cap counts base units across every variant, so the figure checked is
 * what the cart holds for this product MINUS this line, plus whatever the row
 * is about to become. Past it, the same modal the cart page uses — not a line
 * of text under the row, which is easy to miss at the moment of deciding.
 *
 * It names the limit and says a split MAY happen, without a number.
 * getNumberOfDeliveries works per cart row, while the figure checked here is
 * assembled across every variant of the product — so a total reached with two
 * pack sizes splits differently from one reached with a single pack size, and
 * sometimes not at all. The cart dialog, which is genuinely per row, is the
 * one place a count can be stated. Naming a count here would be a promise the
 * backend does not keep.
 */

const CartStateContext = createContext({ units: 0, lines: [], reload: () => {} });

/**
 * One request for the whole panel, shared — eight packs would otherwise mean
 * eight fetches of the same answer.
 *
 * @param {Object} props
 * @param {string|number} props.productId
 * @param {React.ReactNode} props.children
 */
export function CartStateProvider({ productId, children }) {
  const [state, setState] = useState({ units: 0, lines: [] });
  /* A counter rather than calling the fetch directly, so there is one place
     that reads the endpoint and one place that can set state from it. */
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    /* Guarded against a response landing after this unmounts — leaving a
       product page mid-request is the ordinary case, not the exotic one. */
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/cart/product-units?productId=${encodeURIComponent(productId)}`,
          { cache: 'no-store' }
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) {
          setState({ units: Number(data.units) || 0, lines: data.lines ?? [] });
        }
      } catch {
        /* Offline, or the cart is unreadable. Every pack then offers to be
           added and the quantity is still checked on its own, which beats no
           warning at all. */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId, nonce]);

  const reload = useCallback(() => {
    setNonce((n) => n + 1);
    /* Same moment, same reason: the header badge reads the same cart and has
       no other way to hear that this panel just changed it. */
    notifyCartChanged();
  }, []);

  return (
    <CartStateContext.Provider value={{ ...state, reload }}>
      {children}
    </CartStateContext.Provider>
  );
}

/**
 * @param {Object} props
 * @param {string|number} props.productId
 * @param {string} props.productName
 * @param {import('@/lib/types').Variant} props.variant
 * @param {string} props.slug
 */
export default function VariantPurchase({ productId, productName, variant, slug }) {
  const { units, lines, reload } = useContext(CartStateContext);

  const line = lines.find((l) => String(l.variantId) === String(variant.id)) ?? null;
  const unitsPer = variant.unitsPerVariant || 1;
  const limit = variant.purchaseLimit;

  /* What the rest of the product contributes — this line's own units come out,
     because the quantity being proposed replaces them rather than adding to
     them. */
  const otherUnits = units - (line ? line.quantity * unitsPer : 0);

  const addFormRef = useRef(null);
  const stepFormRef = useRef(null);
  const dialogRef = useRef(null);
  const pendingRef = useRef(null);
  const confirmedRef = useRef(false);
  const [proposed, setProposed] = useState(0);

  const wouldExceed = (packs) => Boolean(limit) && otherUnits + packs * unitsPer > limit;

  /* Staying on the page is the point: the quantity control only appears after
     something is added, and you cannot see it from the cart. */
  const returnTo = `/product/${slug}`;

  function openDialog(packs, submit) {
    setProposed(otherUnits + packs * unitsPer);
    pendingRef.current = submit;
    dialogRef.current?.showModal();
  }

  function guard(event, packs, form) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    if (!wouldExceed(packs)) return;

    event.preventDefault();
    openDialog(packs, () => {
      confirmedRef.current = true;
      form.current?.requestSubmit();
    });
  }

  function proceed() {
    dialogRef.current?.close();
    pendingRef.current?.();
    pendingRef.current = null;
    /* The row lands server-side; re-reading keeps every other row's arithmetic
       honest without a reload. */
    setTimeout(reload, 700);
  }

  return (
    <>
      <div className={styles.actions}>
        {/* Per pack, because a customer who wants the 3-sheet box saved does
            not want the 1-sheet one. */}
        <form action={addToWishlistAction} className={styles.wishForm}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="variantId" value={variant.id} />
          <input type="hidden" name="slug" value={slug} />
          <FavouriteButton />
        </form>

        {line ? (
          <QuantityControl
            line={line}
            formRef={stepFormRef}
            onGuard={guard}
            onDone={reload}
          />
        ) : (
          <form
            ref={addFormRef}
            action={addToCartAction}
            onSubmit={(e) => {
              guard(e, 1, addFormRef);
              /* The add redirects, so nothing after the action runs here. The
                 delay lets the write land before the badge asks for a count,
                 and matches what the quantity controls already use. */
              setTimeout(notifyCartChanged, 700);
            }}
            className={styles.addForm}
          >
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="variantId" value={variant.id} />
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="quantity" value="1" />
            <AddButton />
          </form>
        )}
      </div>

      <dialog ref={dialogRef} className={styles.limitDialog}>
        <p className={styles.limitTitle}>購入数量の上限を超えています</p>
        <p className={styles.limitBody}>
          {productName}は、日本の法令で認められた数量の上限（{limit}
          {variant.unitLabel}）を超えています（合計{proposed}
          {variant.unitLabel}）。お届けを複数回に分けて発送させていただく場合がございます。
          また、ご注文手続き画面で定期配送（自動お届け）をお選びいただくこともできます。
        </p>
        <div className={styles.limitActions}>
          <button
            type="button"
            className={styles.limitCancel}
            onClick={() => {
              pendingRef.current = null;
              dialogRef.current?.close();
            }}
          >
            キャンセル
          </button>
          <button type="button" className={styles.limitProceed} onClick={proceed}>
            続ける
          </button>
        </div>
      </dialog>
    </>
  );
}

/**
 * − quantity ＋, editing the cart row directly.
 *
 * Three forms rather than one with three submits: − and ＋ post a quantity,
 * and − at 1 posts to a different action entirely. Separate forms keep each
 * button's payload obvious, which is what the cart page's shared-name bug was
 * about.
 */
function QuantityControl({ line, formRef, onGuard, onDone }) {
  /* THE POSTED NUMBER IS WRITTEN AT SUBMIT TIME.

     Every button posts an ABSOLUTE quantity through a hidden input rendered
     from `line.quantity` — the figure CartStateProvider fetched, which only
     reloads 700ms after a submit. Taps inside that window all serialise the
     SAME value and last-write-wins throws the rest away. Measured before
     this: 4 with three ＋ taps landed on 5; 5 with three − taps landed on 4.

     React state cannot carry the running total, because three taps dispatched
     before a re-render all read the same state AND the DOM input still holds
     the old value when the form serialises. So the total lives in a ref,
     which updates synchronously, and `advance` writes it into the input
     during the submit handler — before the browser serialises the form.

     The ref is seeded once and never read during render — the reconciliation
     below decides when a server figure replaces it, using state only.
     A `key={line.quantity}` remount was the first attempt at that reset and
     is why this is not one: a reload landing mid-burst remounted the control
     and snapped the row back to a quantity two taps out of date, while the
     cart itself was already correct.

     The rendered defaultValue still has to be right on its own: without
     JavaScript onSubmit never runs and that value is what posts. */
  const intendedRef = useRef(line.quantity);
  const [shown, setShown] = useState(line.quantity);
  /* What we last sent, and the last server figure we reacted to — both state,
     so this reconciliation happens during render without touching a ref. */
  const [posted, setPosted] = useState(line.quantity);
  const [seen, setSeen] = useState(line.quantity);

  if (seen !== line.quantity) {
    setSeen(line.quantity);

    /* Adopt the server's number only when it agrees with the last one we
       sent. Mid-burst it does not: CartStateProvider reloads on a 700ms
       timer, so a tap or two later its answer describes a quantity that is
       already superseded. Adopting that is what made the row snap backwards
       while the cart itself was correct. */
    if (line.quantity === posted) {
      /* The ref already equals this: advance() moves it and `posted`
         together, and we only get here when posted matches. */
      setShown(line.quantity);
    }
  }

  /**
   * Move the running total and put it in the form that is about to submit.
   *
   * @param {HTMLFormElement} form
   * @param {number} by  +1 or -1
   * @returns {number} the quantity this submit will carry
   */
  function advance(form, by) {
    const to = Math.max(1, intendedRef.current + by);
    intendedRef.current = to;

    const input = form?.querySelector('input[name="quantity"]');
    if (input) input.value = String(to);

    setShown(to);
    setPosted(to);
    return to;
  }

  return (
    <div className={styles.qtyGroup}>
      {shown > 1 ? (
        <form
          action={updateQuantityAction}
          onSubmit={(e) => {
            advance(e.currentTarget, -1);
            setTimeout(onDone, 700);
          }}
        >
          <input type="hidden" name="cartItemId" value={line.id} />
          <input type="hidden" name="quantity" defaultValue={Math.max(1, shown - 1)} />
          <StepButton label="数量を1つ減らす">−</StepButton>
        </form>
      ) : (
        /* At 1, − empties the row rather than refusing. The alternative is a
           disabled button and a trip to the cart to undo a mis-click. */
        <form action={removeItemAction} onSubmit={() => setTimeout(onDone, 700)}>
          <input type="hidden" name="cartItemId" value={line.id} />
          <StepButton label="カートから削除">−</StepButton>
        </form>
      )}

      <span className={`${styles.qtyValue} numeric`} aria-live="polite">
        {shown}
      </span>

      <form
        ref={formRef}
        action={updateQuantityAction}
        onSubmit={(e) => {
          const form = e.currentTarget;

          /* The limit is checked against what this tap actually makes it —
             the queued total plus one, not line.quantity plus one. */
          onGuard(e, shown + 1, formRef);

          /* Only count a tap that is going to the server. The guard calls
             preventDefault() when this would cross the purchase limit and
             opens the dialog instead; 続ける resubmits this same form and that
             submit is the one that counts. */
          if (!e.defaultPrevented) {
            advance(form, 1);
            setTimeout(onDone, 700);
          }
        }}
      >
        <input type="hidden" name="cartItemId" value={line.id} />
        <input type="hidden" name="quantity" defaultValue={shown + 1} />
        <StepButton label="数量を1つ増やす">＋</StepButton>
      </form>
    </div>
  );
}

function StepButton({ children, label }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.qtyStep} aria-label={label} disabled={pending}>
      {children}
    </button>
  );
}

function AddButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="md" block disabled={pending}>
      {pending ? '追加中…' : 'カートに入れる'}
    </Button>
  );
}

function FavouriteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={styles.favButton}
      disabled={pending}
      aria-label="お気に入りに追加"
      title="お気に入りに追加"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1Z" />
      </svg>
    </button>
  );
}
