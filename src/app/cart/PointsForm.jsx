'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './Cart.module.css';
import Alert from '@/components/ui/Alert/Alert';
import Link from 'next/link';

import { applyPointsAction, removePointsAction } from './actions';
import { formatNumber } from '@/lib/format';

/**
 * PointsForm.
 *
 * Points are a wallet, not a counter: the balance is the sum of credits minus
 * debits in wallet_transaction_history, and **1 point spends as 1 yen**.
 *
 * Nothing here decides how many points may be used. `maxUsable` is the
 * backend's own cap — min(balance, cart × point_usages%, cart − coupon) — and
 * it moves whenever the cart or the coupon changes. The input is capped to it
 * for the customer's benefit, and the Server Action re-clamps against a fresh
 * cart before sending, because this panel was rendered from an earlier state.
 *
 * ## It always renders
 *
 * It used to return null whenever there was nothing to spend, which emptied
 * its half of the panel and collapsed the coupon beside it to full width — so
 * the one case every signed-out visitor sees was also the case where the two
 * columns disappeared. It now says something in every state, and the balance
 * is stated as a figure rather than buried in a sentence.
 *
 * A zero balance is ambiguous on its own: it is what a guest looks like and
 * what a signed-in customer who has not earned any looks like. `signedIn`
 * tells them apart, because they need different words — telling someone who
 * is already logged in to log in is worse than saying nothing.
 *
 * @param {Object} props
 * @param {number} props.balance    Wallet balance in points (= yen)
 * @param {number} props.maxUsable  Most that may be spent on THIS cart
 * @param {number} props.applied    Currently redeemed against this cart
 * @param {boolean} props.disabled  Admin has switched redemption off
 * @param {boolean} props.signedIn  There is a customer behind this cart
 */
export default function PointsForm({ balance, maxUsable, applied, disabled, signedIn }) {
  const [state, formAction] = useActionState(applyPointsAction, {});

  /* Nothing to offer, but the column still has to hold its side of the grid. */
  if (!signedIn) {
    return (
      <div className={styles.coupon}>
        <p className={styles.couponTitle}>ポイントを使う</p>
        <p className={styles.couponHint}>
          ご注文ごとにポイントがたまり、次回以降のお買い物に1pt&nbsp;=&nbsp;1円としてご利用いただけます。
        </p>
        <p className={styles.pointsCta}>
          <Link href="/login?next=/cart">ログインしてポイントを使う</Link>
        </p>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className={styles.coupon}>
        <p className={styles.couponTitle}>ポイントを使う</p>
        <Balance value={balance} />
        <p className={styles.couponHint}>
          現在、ポイントのご利用を停止しております。
        </p>
      </div>
    );
  }

  if (applied > 0) {
    return (
      <div className={styles.coupon}>
        <p className={styles.couponTitle}>ポイント</p>
        <div className={styles.couponApplied}>
          <span>{formatNumber(applied)}pt を利用中（−{formatNumber(applied)}円）</span>
          <form action={removePointsAction}>
            <button type="submit" className={styles.couponRemove}>
              削除
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.coupon}>
      <p className={styles.couponTitle}>ポイントを使う</p>

      <Balance value={balance} />

      {state?.error && (
        <div className={styles.alertSlot}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      )}

      {maxUsable > 0 ? (
        <>
          <form action={formAction} className={styles.couponForm}>
            <label htmlFor="points-amount" className="visually-hidden">
              利用ポイント数
            </label>
            <input
              id="points-amount"
              name="points"
              className={`${styles.couponInput} numeric`}
              type="number"
              min={1}
              max={maxUsable}
              step={1}
              inputMode="numeric"
              placeholder={`1〜${maxUsable}`}
              autoComplete="off"
            />
            <ApplyButton />
          </form>
          <p className={styles.couponHint}>
            このご注文では {formatNumber(maxUsable)}pt までご利用いただけます（1pt = 1円）。
          </p>
        </>
      ) : (
        /* A balance with nothing usable against this cart — the cap is
           cart-relative, so a coupon covering the goods leaves nothing. */
        <p className={styles.couponHint}>
          {balance > 0
            ? 'このご注文ではポイントをご利用いただけません。'
            : 'ご注文ごとにポイントがたまり、次回以降のお買い物にご利用いただけます。'}
        </p>
      )}
    </div>
  );
}

function ApplyButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.qtyApply} disabled={pending}>
      {pending ? '適用中…' : '利用する'}
    </button>
  );
}

/**
 * The balance, as a figure.
 *
 * It was a clause inside a two-line sentence about caps, which is the wrong
 * shape for the one number a customer opens this panel to read.
 */
function Balance({ value }) {
  return (
    <p className={styles.pointsBalance}>
      <span className={styles.pointsBalanceLabel}>ご利用可能残高</span>
      <span className={`${styles.pointsBalanceValue} numeric`}>{formatNumber(value)}pt</span>
    </p>
  );
}
