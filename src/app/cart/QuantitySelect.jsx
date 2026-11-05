'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './Cart.module.css';
import { updateQuantityAction } from './actions';
import { notifyCartChanged } from '@/lib/cart-events';

/** How long a change waits for the next one before it is sent. */
const SETTLE_MS = 550;

/**
 * The quantity control on a cart line.
 *
 * A dropdown, replacing the − / + stepper, its typed box and the 変更 button
 * that applied it. Those three existed together for a reason — stepping suits
 * one or two more, and a typed box was the answer to a limit that runs to
 * dozens — but a select does both jobs in one control and is what the rest of
 * the cart was designed against.
 *
 * Changing it submits. A select cannot submit a form on its own, so that part
 * needs JavaScript; 変更 remains in the markup as the fallback and hides itself
 * once this component mounts. Rendering it and then hiding it, rather than
 * deciding on the server, is the only order that works — the server cannot know
 * whether the browser will run scripts.
 *
 * ONE REQUEST PER SETTLED CHOICE, NOT ONE PER CHANGE.
 * Submitting on every change is what produced 「問題が発生しました」 after two or
 * three quick adjustments. Each change costs three backend calls — the update,
 * the cart re-read that revalidatePath forces, and /api/cart/count — and takes
 * well over a second to come back; measured on this page, one change was a
 * 1.5–2.1s round trip. Four taps therefore put a dozen calls and four
 * overlapping page renders in flight against a backend capped at 100
 * concurrent connections. One of them fails, and a REJECTED SERVER ACTION is
 * not a value this component can inspect — it lands in the route error
 * boundary, which replaces the whole cart with that message. Reloading worked
 * because a fresh GET is one request.
 *
 * So a change is held for SETTLE_MS and only the last one is sent: a run of
 * adjustments now costs exactly what a single one does. Measured against the
 * real backend, a seven-change burst sends one request.
 *
 * THE SELECT STAYS UNCONTROLLED, and the `key` stays with it.
 * Making it controlled looked tidier and is wrong here. React 19 resets a form
 * once its action completes, and a reset puts every control back to its DOM
 * default — for a controlled select that means the browser moves the value
 * while React still believes its own, so the two silently disagree and the
 * displayed quantity stops matching the cart. Keyed on the server's figure,
 * the select simply remounts onto the confirmed value, which is what a reset
 * lands on anyway. The reason that used to misbehave was the burst, not the
 * key: with one submit per settled choice there is no longer a stream of
 * server values to be yanked between.
 *
 * THE LIMIT WARNS, IT DOES NOT BLOCK.
 * The options deliberately run past the purchase cap. The backend has no cap
 * check and answers a larger order by splitting the delivery
 * (`ceil(totalQuantity / subscription_limit)` in getNumberOfDeliveries), so a
 * dropdown that stopped at the cap would be the one thing preventing a flow the
 * server was built for. Picking an over-cap amount opens the same confirmation
 * the stepper used to.
 *
 * @param {Object} props
 * @param {import('@/lib/types').CartLine} props.line
 */
export default function QuantitySelect({ line }) {
  const capUnits = line.purchaseLimit ?? Infinity;
  const unitsPer = line.unitsPerVariant || 1;

  const formRef = useRef(null);
  const dialogRef = useRef(null);
  const wantedRef = useRef(null);
  /* Set by 続ける so the resubmit it triggers is not caught by the check that
     opened the dialog in the first place. */
  const confirmedRef = useRef(false);
  /* The submit that is waiting, or null when nothing is. */
  const settleRef = useRef(null);

  /* How many parcels the amount in the dialog would become. State, not a ref
     like wantedRef beside it: this one is rendered, so a ref would leave the
     dialog showing the count from the previous time it opened. Mirrors
     CommonHelper::getNumberOfDeliveries — ceil(totalUnits / cap) — which is
     exact here because a cart row is the unit that helper works on. */
  const [splitCount, setSplitCount] = useState(0);

  const [scripted, setScripted] = useState(false);
  /* eslint-disable-next-line react-hooks/set-state-in-effect --
     The one case the rule cannot express: this asks whether scripts are
     running at all, which is only knowable after hydration. Deciding it on
     the server is impossible, and the single extra render it costs happens
     once per mount. */
  useEffect(() => setScripted(true), []);

  /* Nothing queued outlives the component: removing the line while a change
     is waiting would otherwise submit a form no longer on the page. */
  useEffect(() => () => clearTimeout(settleRef.current), []);

  const exceeds = (quantity) =>
    Number.isFinite(capUnits) && quantity * unitsPer > capUnits;

  /* How far the list goes. It has to clear the cap — that is the point — and it
     has to include the quantity already in the cart, or the select would open
     showing a number nobody chose. */
  const capPacks = Number.isFinite(capUnits) ? Math.ceil(capUnits / unitsPer) : 0;
  const maxOption = Math.min(99, Math.max(20, capPacks * 2, line.quantity + 10));
  const options = Array.from({ length: maxOption }, (_, i) => i + 1);

  /**
   * A new choice from the select.
   *
   * Schedules the submit, replacing any submit already waiting. Nothing is
   * done to the displayed value: the select is uncontrolled, so it is already
   * showing what was picked.
   *
   * An over-limit amount is confirmed BEFORE the wait rather than after it, so
   * the dialog appears while the customer is still looking at the control they
   * just used.
   */
  function handleChange(wanted) {
    clearTimeout(settleRef.current);
    settleRef.current = null;

    if (exceeds(wanted)) {
      wantedRef.current = wanted;
      setSplitCount(Math.ceil((wanted * unitsPer) / capUnits));
      dialogRef.current?.showModal();
      return;
    }

    settleRef.current = setTimeout(() => {
      settleRef.current = null;
      formRef.current?.requestSubmit();
    }, SETTLE_MS);
  }

  /**
   * The real submit — a settled change, 続ける, or 変更 without scripts.
   *
   * The decision is already made by this point; all that is left is to tell
   * the header, once the write has had time to land.
   */
  function handleSubmit() {
    confirmedRef.current = false;
    setTimeout(notifyCartChanged, 900);
  }

  function proceed() {
    dialogRef.current?.close();
    const form = formRef.current;
    if (!form) return;

    form.elements.confirmedQuantity.value = String(wantedRef.current);
    confirmedRef.current = true;
    form.requestSubmit();

    /* Cleared straight away. requestSubmit dispatches the submit event
       synchronously, so the value is already in the FormData — whereas left in
       place it wins on EVERY later change to this line, because the action
       prefers it. Confirm 40, then ask for 2, and you would get 40 again. */
    form.elements.confirmedQuantity.value = '';
  }

  /* Cancelling has to put the select back. It still shows the rejected number,
     and leaving it there would say the cart holds an amount it does not. */
  function cancel() {
    dialogRef.current?.close();
    const select = formRef.current?.elements?.quantity;
    if (select) select.value = String(line.quantity);
  }

  return (
    <>
      <form
        ref={formRef}
        action={updateQuantityAction}
        onSubmit={handleSubmit}
        className={styles.qtyForm}
      >
        <input type="hidden" name="cartItemId" value={line.id} />
        {/* Filled only by 続ける; the action prefers it over the select, so a
            confirmed quantity cannot be second-guessed. */}
        <input type="hidden" name="confirmedQuantity" defaultValue="" />

        <QuantityField
          lineId={line.id}
          quantity={line.quantity}
          options={options}
          scripted={scripted}
          onPick={handleChange}
        />

        {/* The no-script path. Hidden once mounted rather than omitted, because
            whether scripts run is not knowable when this renders on the server. */}
        <ApplyButton hidden={scripted} />
      </form>

      {/* Outside the form on purpose: inside it, キャンセル would submit the
          very change it exists to call off. */}
      <dialog ref={dialogRef} className={styles.limitDialog}>
        <p className={styles.limitTitle}>購入数量の上限を超えています</p>

        <p className={styles.limitBody}>
          {line.productName}
          は、日本の法令で認められた数量の上限
          {line.limitLabel ? `（${line.limitLabel}）` : ''}
          を超えています。お届けを{splitCount > 1 ? splitCount : 2}
          回に分けて発送させていただく場合がございます。
          また、ご注文手続き画面で定期配送（自動お届け）をお選びいただくこともできます。
        </p>

        <div className={styles.limitActions}>
          <button type="button" className={styles.limitCancel} onClick={cancel}>
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
 * The select itself.
 *
 * `useFormStatus` is why this is split out — it reads the status of the nearest
 * form above it, so it has to sit inside the <form> rather than own it. Without
 * the pending state a slow round trip looks like a control that ignored the
 * change, and the customer picks again.
 */
function QuantityField({ lineId, quantity, options, scripted, onPick }) {
  const { pending } = useFormStatus();

  return (
    <select
      /* Keyed on the confirmed quantity, so a server-updated value remounts
         this and takes effect: `defaultValue` applies on mount only, and after
         a revalidation React keeps the existing node. See the note on the
         component — this is also what survives React 19's post-action form
         reset, which a controlled value does not. */
      key={quantity}
      id={`qty-${lineId}`}
      name="quantity"
      className={styles.qtySelect}
      defaultValue={quantity}
      /* NOT disabled while pending, however tempting. React disables it the
         moment the form submits, and a disabled control is left out of the
         FormData — so the one field carrying the value would never be sent and
         the action would bail on an empty quantity. aria-busy says the same
         thing to assistive tech without removing the value, and data-pending
         carries the visual state. Changing it again mid-flight is fine: the
         later submit wins, which is what the customer meant anyway. */
      aria-busy={pending || undefined}
      data-pending={pending ? '' : undefined}
      aria-label="数量"
      /* Only when scripts are running. Without them the change does nothing
         here and 変更 below is what submits. */
      onChange={
        scripted
          ? (event) => {
              const wanted = Number(event.currentTarget.value);
              if (Number.isFinite(wanted)) onPick(wanted);
            }
          : undefined
      }
    >
      {options.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

function ApplyButton({ hidden }) {
  const { pending } = useFormStatus();

  if (hidden) return null;

  return (
    <button type="submit" className={styles.qtyApply} disabled={pending}>
      {pending ? '更新中…' : '変更'}
    </button>
  );
}
