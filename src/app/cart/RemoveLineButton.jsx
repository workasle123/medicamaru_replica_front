'use client';

import { useFormStatus } from 'react-dom';

import styles from './Cart.module.css';
import { removeItemAction } from './actions';
import { notifyCartChanged } from '@/lib/cart-events';

/**
 * The 削除 button on a cart line.
 *
 * A Client Component for one reason: the header's count has to be told. The
 * badge reads /api/cart/count after hydration and re-reads on navigation or on
 * a CART_CHANGED event — and removing a line is neither. The action revalidates
 * /cart, so the page itself was always correct; the number beside the cart icon
 * simply went on claiming the removed item until the next page the customer
 * opened. Its sibling QuantitySelect already did this; the remove button was
 * the one write on this page that did not.
 *
 * Being a Client Component also buys the pending state. A removal is a round
 * trip to the backend, and a bin that does nothing visible for a second reads
 * as a click that missed — which is how a customer ends up removing two lines
 * when they meant one.
 *
 * Still a real <form> bound to the Server Action, so it works without
 * JavaScript; the signal and the pending state are the enhancement, not the
 * function.
 *
 * @param {Object} props
 * @param {string|number} props.cartItemId  The cart ROW id, which is what the
 *   remove endpoint is keyed on — not a variant id.
 * @param {string} props.productName  For the accessible name.
 */
export default function RemoveLineButton({ cartItemId, productName }) {
  return (
    <form
      action={removeItemAction}
      /* The delay lets the write land before /api/cart/count is asked for a
         fresh total — the same wait QuantitySelect uses for the same reason. */
      onSubmit={() => setTimeout(notifyCartChanged, 900)}
    >
      <input type="hidden" name="cartItemId" value={cartItemId} />
      <SubmitButton productName={productName} />
    </form>
  );
}

/** Split out because useFormStatus must be called inside the <form>. */
function SubmitButton({ productName }) {
  const { pending } = useFormStatus();

  return (
    /* The word 削除 became a button with a bin on it. The label stays as the
       accessible name — an icon-only control with no name is unusable with a
       screen reader, and `aria-hidden` on the drawing is what stops it being
       read twice. */
    <button
      type="submit"
      className={styles.removeButton}
      aria-label={`${productName} を削除`}
      disabled={pending}
      aria-busy={pending || undefined}
    >
      {pending ? <Spinner /> : <TrashIcon />}
    </button>
  );
}

/** The bin. Decorative — the button carries the name. */
function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />
    </svg>
  );
}

/** Replaces the bin while the removal is in flight. */
function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={styles.removeSpinner}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}
