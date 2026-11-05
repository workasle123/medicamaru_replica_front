'use client';

import { useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

import styles from './Cart.module.css';
import { setDeliveryTypeAction } from './actions';

/**
 * The split-delivery choice for one cart row.
 *
 * ## Why it exists at all
 *
 * A row over the personal-import limit cannot lawfully leave as one parcel.
 * The backend has always been able to split it — getNumberOfDeliveries works
 * out ceil(totalUnits / subscription_limit) — but only for a row whose
 * delivery_type is 'recurring', and nothing ever set that: the storefront sent
 * a hardcoded 'one_time' at checkout. So the dialog warned about a split that
 * then did not happen. This is the control that makes the warning true.
 *
 * ## Why the label is not simply the server's value
 *
 * It was, and on live that looked broken. The Server Action's POST response
 * does not reliably reach the browser here: the write lands and the backend
 * answers 200 — confirmed by calling the endpoint directly — but the response
 * arrives aborted (net::ERR_ABORTED), so the re-render never applies. A label
 * read straight off the server render then goes on showing the OLD choice,
 * and the next page load silently "corrects" it. Intermittent, and
 * indistinguishable from the click not working.
 *
 * QuantitySelect beside this never had the problem because its select is
 * uncontrolled — it shows what the customer picked, not what came back.
 *
 * So the state is taken from useFormStatus while the submit is in flight, and
 * the cart is re-read with router.refresh() once it settles. The refresh is a
 * plain GET, which is the point: it does not depend on the action response
 * that is the whole problem above.
 *
 * ## The optimistic state is NOT held after the submit settles
 *
 * Once `pending` drops, the server's value is shown again even if the refresh
 * has not landed yet. A sticky local flag would be the one lie that matters
 * here, because this choice carries a postage charge: better a label that
 * lags by a moment than one that claims a split the cart does not have.
 *
 * ## The form stays bound to the Server Action
 *
 * `action` is the Server Action itself, not a client wrapper around it, so the
 * control still works with scripts off — the native POST reloads the page and
 * shows the new state the slow way. An earlier attempt set React state inside
 * `onSubmit` to do the same job; that re-rendered the form before React had
 * dispatched the action, and the submit was dropped silently — the label moved
 * and nothing was ever written.
 *
 * ## It never computes money
 *
 * The parcel count comes from the backend as `mayBeDeliveryCount`, and the new
 * postage with the refreshed cart. Multiplying the shipping here to preview it
 * would be this side inventing a figure the backend owns — and
 * getShippingAmount does not simply multiply: it re-bands the basket on the
 * per-parcel slice FIRST, so a split can lose free shipping as well as add to
 * it. Saying 「送料が{n}回分かかります」 is the honest shape of that without
 * naming a number the cart has not been told.
 *
 * @param {Object} props
 * @param {import('@/lib/types').CartLine} props.line
 */
export default function DeliverySplitToggle({ line }) {
  const parcels = line.mayBeDeliveryCount ?? 1;

  /* Nothing to choose for a row inside the limit — and showing a disabled
     control there would advertise a split that does not apply to it. */
  if (parcels < 2) return null;

  const splitting = line.deliveryType === 'recurring';
  const target = splitting ? 'one_time' : 'recurring';

  return (
    <form action={setDeliveryTypeAction} className={styles.splitForm}>
      <input type="hidden" name="cartItemId" value={line.id} />
      <input type="hidden" name="deliveryType" value={target} />
      <SplitBody splitting={splitting} parcels={parcels} target={target} />
    </form>
  );
}

/**
 * The visible half, separated only so it can call useFormStatus — which reads
 * the status of the form it is rendered INSIDE, and so cannot live in the
 * component that renders the form.
 */
function SplitBody({ splitting, parcels, target }) {
  const { pending } = useFormStatus();
  const router = useRouter();
  const wasPending = useRef(false);

  /* The submit has settled: re-read the cart so the postage catches up. */
  useEffect(() => {
    if (wasPending.current && !pending) router.refresh();
    wasPending.current = pending;
  }, [pending, router]);

  const shown = pending ? target === 'recurring' : splitting;

  return (
    <>
      <p className={styles.splitState}>
        {shown ? (
          <>
            <span className={styles.splitOn}>分割配送</span>
            {parcels}回に分けてお届けします（送料{parcels}回分）
          </>
        ) : (
          <>
            法令で認められた数量を超えるため、{parcels}
            回に分けてのお届けをお選びいただけます。
          </>
        )}
      </p>

      <button type="submit" className={styles.splitButton} disabled={pending}>
        {shown
          ? '1回のお届けに戻す'
          : `${parcels}回に分けて受け取る（送料${parcels}回分）`}
      </button>
    </>
  );
}
