'use client';

import { useActionState, useId, useState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './Cart.module.css';
import Alert from '@/components/ui/Alert/Alert';
import { applyCouponAction, removeCouponAction } from './actions';
import { formatBenefit, formatDate, formatDiscountCap, formatYen } from '@/lib/format';

/**
 * CouponForm.
 *
 * Client Component only for the inline success/error message. The form posts
 * to a Server Action, so it still applies a coupon with JavaScript disabled.
 *
 * The client never learns what a coupon is worth — it submits a code and
 * re-renders whatever totals the backend returns.
 *
 * ## The picker
 *
 * Typing a code from memory was the only way in, which meant leaving the cart
 * for the campaign page and coming back. The dropdown lists what is actually
 * on offer and fills the field; the field stays, because a code can arrive by
 * email or LINE and never appear in this list.
 *
 * Eligibility is stated, not enforced. The backend decides whether a coupon
 * applies — this only repeats the conditions the campaign already publishes,
 * and says how far off the basket is when there is a minimum. Guessing
 * locally would be a second source of truth for commerce rules (brief §17).
 *
 * @param {Object} props
 * @param {string|null} props.appliedCoupon
 * @param {string|null} props.couponLabel
 * @param {import('@/lib/types').Campaign[]} [props.coupons]
 * @param {number} [props.subtotal]
 */
export default function CouponForm({ appliedCoupon, couponLabel, coupons = [], subtotal = 0 }) {
  const [state, formAction] = useActionState(applyCouponAction, {});
  const [code, setCode] = useState('');
  const pickerId = useId();

  const picked = coupons.find((c) => c.couponCode === code) ?? null;

  if (appliedCoupon) {
    return (
      <div className={styles.coupon}>
        <p className={styles.couponTitle}>クーポン</p>
        <div className={styles.couponApplied}>
            <span>{couponLabel ?? appliedCoupon}</span>
          <form action={removeCouponAction}>
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
      <p className={styles.couponTitle}>クーポンをお持ちの方</p>

      {state?.error && (
        <div className={styles.alertSlot}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      )}

      {coupons.length > 0 && (
        <div className={styles.couponPick}>
          <label htmlFor={pickerId} className={styles.couponPickLabel}>
            実施中のクーポンから選ぶ
          </label>
          <select
            id={pickerId}
            className={styles.couponSelect}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          >
            <option value="">選択してください</option>
            {coupons.map((c) => (
              <option key={c.id} value={c.couponCode}>
                {optionLabel(c)}
              </option>
            ))}
          </select>
        </div>
      )}

      <form action={formAction} className={styles.couponForm}>
        <label htmlFor="coupon-code" className="visually-hidden">
          クーポンコード
        </label>
        <input
          id="coupon-code"
          name="code"
          className={styles.couponInput}
          placeholder="クーポンコード"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <ApplyButton />
      </form>

      {picked && <Eligibility campaign={picked} subtotal={subtotal} />}

      <p className={styles.couponHint}>
        クーポンは1回のご注文につき1つまでご利用いただけます。
      </p>
    </div>
  );
}

function ApplyButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.qtyApply} disabled={pending}>
      {pending ? '適用中…' : '適用する'}
    </button>
  );
}

/**
 * One line in the dropdown: the code, then what it is worth.
 *
 * The code leads because it is what the customer is choosing; the value is
 * what tells two of them apart. A campaign with neither a percentage nor an
 * amount — a points bonus, a LINE add — falls back to its title rather than
 * showing a bare code with nothing after it.
 */
function optionLabel(c) {
  const worth = formatBenefit(c.benefit) || c.title;
  return worth ? `${c.couponCode}　—　${worth}` : c.couponCode;
}

/**
 * The conditions attached to the selected coupon.
 *
 * The shortfall line is the useful part: 「あと¥550でご利用いただけます」
 * turns a refusal the customer would otherwise meet at the apply button into
 * something they can act on while still looking at the basket. It is phrased
 * as information, not as a block — the button stays live, because only the
 * backend decides whether a coupon is good.
 */
function Eligibility({ campaign, subtotal }) {
  const { minSpend, endsAt, benefit } = campaign;
  const short = minSpend ? minSpend - subtotal : 0;

  const facts = [];
  if (benefit) facts.push(formatBenefit(benefit));
  /* The ceiling, right after the percentage it limits. This is the last
     screen before the customer commits, so it is the one place the figure
     must not be missing. Contributes nothing when the coupon is uncapped. */
  const cap = formatDiscountCap(benefit);
  if (cap) facts.push(cap);
  if (minSpend) facts.push(`${formatYen(minSpend)}以上のご注文`);
  if (endsAt) facts.push(`${formatDate(endsAt)}まで`);

  return (
    <div className={styles.couponTerms}>
      <p className={styles.couponFacts}>{facts.join('／')}</p>
      {short > 0 && (
        <p className={styles.couponShort}>
          あと{formatYen(short)}でご利用いただけます。
        </p>
      )}
    </div>
  );
}
