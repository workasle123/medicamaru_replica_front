'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './Checkout.module.css';
import Field from '@/components/ui/Field/Field';
import Select from '@/components/ui/Select/Select';
import Alert from '@/components/ui/Alert/Alert';
import Button from '@/components/ui/Button/Button';
import RequiredNote from '@/components/ui/RequiredNote/RequiredNote';
import { placeOrderAction } from '@/app/cart/actions';
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS, PREFECTURES } from '@/constants/checkout';
import { formatYenSuffix, formatNumber } from '@/lib/format';

/** The "type it in fresh" option, kept distinct from any address id. */
const NEW_ADDRESS = 'new';

/**
 * CheckoutForm.
 *
 * One form spanning the address, payment selection and the order summary, so
 * the totals sit inside the same submit and cannot drift from what is being
 * agreed to.
 *
 * The summary renders the backend's figures verbatim. No monetary value is
 * submitted — the backend rebuilds the order from the cart it holds, so
 * editing a number in the DOM changes nothing (brief §17).
 *
 * @param {Object} props
 * @param {import('@/lib/types').Cart} props.cart
 * @param {import('@/lib/types').Address[]} [props.addresses] Saved addresses,
 *   offered as selectable delivery options.
 * @param {Object} [props.defaultAddress]
 * @param {string} [props.defaultEmail]
 * @param {boolean} [props.isGuest] Nobody signed in — ask for the email twice.
 */
export default function CheckoutForm({
  cart,
  addresses = [],
  defaultAddress,
  defaultEmail,
  isGuest = false,
}) {
  const [state, formAction] = useActionState(placeOrderAction, { errors: {}, values: {} });
  const errors = state?.errors ?? {};
  const values = state?.values ?? {};

  const [selectedId, setSelectedId] = useState(
    defaultAddress ? String(defaultAddress.id) : NEW_ADDRESS
  );
  /* Whether the customer has picked from the list since the page loaded.
     Choosing a saved address is an explicit instruction to replace what is in
     the fields; before that, anything they had typed into a submission that
     failed validation must survive. */
  const [picked, setPicked] = useState(false);

  /* Told to the customer the moment they leave the confirmation field, rather
     than after a submit and a round trip. The server still decides — see
     placeOrderAction — this only saves them finding out at the end of a long
     form that the first thing they typed was wrong. */
  const [confirmError, setConfirmError] = useState('');

  const chosen =
    selectedId === NEW_ADDRESS
      ? null
      : addresses.find((a) => String(a.id) === selectedId) ?? null;

  const from = (key) =>
    (picked ? chosen?.[key] : values[key] ?? chosen?.[key]) ?? '';

  const initial = {
    recipient: from('recipient'),
    recipientEnglish: from('recipientEnglish'),
    postalCode: from('postalCode'),
    prefecture: from('prefecture'),
    city: from('city'),
    street: from('street'),
    building: from('building'),
    phone: from('phone'),
    email: values.email ?? defaultEmail ?? '',
    emailConfirm: values.emailConfirm ?? '',
  };

  /* Compared on blur of EITHER field, so correcting the first one clears an
     error raised against the second. Read off the form rather than held in
     state: both inputs are uncontrolled, and mirroring them into React would
     mean re-rendering the whole checkout on every keystroke to police one
     field. */
  const checkEmailsMatch = (event) => {
    const form = event.currentTarget.form;
    if (!form) return;

    const email = (form.elements.email?.value ?? '').trim();
    const confirm = (form.elements.emailConfirm?.value ?? '').trim();

    /* Nothing to compare against yet. Saying "they do not match" to someone
       who has not finished typing the second one is just noise. */
    if (!email || !confirm) {
      setConfirmError('');
      return;
    }

    setConfirmError(
      email.toLowerCase() === confirm.toLowerCase()
        ? ''
        : 'メールアドレスが一致しません。もう一度ご確認ください。'
    );
  };

  /* The one method on offer, looked up for its name and note rather than
     written out twice. PAYMENT_METHODS still lists the withdrawn ones so the
     completion page can name an older order's method, so this has to find
     its entry rather than take the first. */
  const paymentMethod =
    PAYMENT_METHODS.find((m) => m.id === DEFAULT_PAYMENT_METHOD) ?? PAYMENT_METHODS[0];

  return (
    <form action={formAction} className={styles.layout} noValidate>
      <div>
        {errors.form && (
          <div className={styles.alertSlot}>
            <Alert variant="error">{errors.form}</Alert>
          </div>
        )}

        <RequiredNote />

        <section className={styles.section}>
          {/* Not numbered. The reference checkout numbers its six cards 1-6,
              which works because they are one stacked column. Ours is two
              columns, and measured on a 1280px screen the confirmation block
              renders at y=534 in the right column while お支払い方法 is at
              y=1222 in the left — so a "3" would sit ABOVE the "2". A number
              that lies about the order is worse than no number. */}
          <h2 className={styles.sectionTitle}>お届け先</h2>

          {/* Saved addresses, when there are any. Radios rather than a select:
              each option is four lines of address, which a select cannot show
              without truncating to the point of being unrecognisable. */}
          {addresses.length > 0 && (
            <fieldset className={styles.picker}>
              <legend className={styles.pickerLegend}>登録済みのお届け先から選ぶ</legend>

              {addresses.map((address) => (
                <label key={address.id} className={styles.pickerOption}>
                  <input
                    type="radio"
                    name="savedAddress"
                    className={styles.pickerRadio}
                    value={String(address.id)}
                    checked={selectedId === String(address.id)}
                    onChange={() => {
                      setSelectedId(String(address.id));
                      setPicked(true);
                    }}
                  />
                  <span className={styles.pickerBody}>
                    <span className={styles.pickerLabel}>
                      {address.label}
                      {address.isDefault && <span className={styles.pickerBadge}>既定</span>}
                    </span>
                    <span className={styles.pickerText}>
                      {address.recipient} 様 ／ 〒{address.postalCode}
                      <br />
                      {address.prefecture}
                      {address.city}
                      {address.street}
                      {address.building ? ` ${address.building}` : ''}
                    </span>
                  </span>
                </label>
              ))}

              <label className={styles.pickerOption}>
                <input
                  type="radio"
                  name="savedAddress"
                  className={styles.pickerRadio}
                  value={NEW_ADDRESS}
                  checked={selectedId === NEW_ADDRESS}
                  onChange={() => {
                    setSelectedId(NEW_ADDRESS);
                    setPicked(true);
                  }}
                />
                <span className={styles.pickerBody}>
                  <span className={styles.pickerLabel}>新しい住所を入力する</span>
                </span>
              </label>
            </fieldset>
          )}

          {/* Keyed on the selection so the uncontrolled inputs below remount
              with the chosen address's values. Without the key they would keep
              whatever was first rendered, and picking a different address would
              visibly do nothing. */}
          <div className={styles.fields} key={selectedId}>
            <Field
              id="checkout-recipient"
              name="recipient"
              label="お届け先氏名"
              required
              autoComplete="name"
              defaultValue={initial.recipient}
              error={errors.recipient}
            />

            {/* Romanised, for the shipping label. The parcel is dispatched
                from overseas and the carrier's paperwork cannot carry 漢字,
                so the label prints 「山田 太郎 / YAMADA TARO」.
                One box, matching 氏名 above rather than the 姓/名 pair on the
                registration form — this form asks for the name once and a
                second split field here would be the odd one out. */}
            <Field
              id="checkout-recipient-english"
              name="recipientEnglish"
              label="お届け先氏名（English）"
              required
              autoComplete="off"
              hint="例：YAMADA TARO"
              defaultValue={initial.recipientEnglish}
              error={errors.recipientEnglish}
            />

            <Field
              id="checkout-postal"
              name="postalCode"
              label="郵便番号"
              required
              autoComplete="postal-code"
              /* A postcode is seven digits and a hyphen, but the field was
                 plain text with no keyboard hint, so a phone opened the full
                 QWERTY for it. inputMode rather than type="number", which
                 would reject the hyphen, add stepper arrows and drop a leading
                 zero — and 0 starts a great many Japanese postcodes. */
              inputMode="numeric"
              hint="例：150-0001"
              defaultValue={initial.postalCode}
              error={errors.postalCode}
            />

            <Select
              id="checkout-prefecture"
              name="prefecture"
              label="都道府県"
              required
              autoComplete="address-level1"
              options={PREFECTURES.map((p) => ({ value: p, label: p }))}
              defaultValue={initial.prefecture}
              error={errors.prefecture}
            />

            <Field
              id="checkout-city"
              name="city"
              label="市区町村"
              required
              autoComplete="address-level2"
              defaultValue={initial.city}
              error={errors.city}
            />

            <Field
              id="checkout-street"
              name="street"
              label="番地"
              required
              autoComplete="address-line1"
              defaultValue={initial.street}
              error={errors.street}
            />

            <Field
              id="checkout-building"
              name="building"
              label="建物名・部屋番号"
              autoComplete="address-line2"
              defaultValue={initial.building}
              error={errors.building}
            />

            <Field
              id="checkout-phone"
              name="phone"
              label="電話番号"
              type="tel"
              required
              autoComplete="tel"
              hint="配送時のご連絡に使用します。"
              defaultValue={initial.phone}
              error={errors.phone}
            />

            <Field
              id="checkout-email"
              name="email"
              label="メールアドレス"
              type="email"
              required
              autoComplete="email"
              hint={
                isGuest
                  ? 'ご注文確認メールとお振込先をお送りします。お間違いのないようご確認ください。'
                  : 'ご注文確認メールをお送りします。'
              }
              defaultValue={initial.email}
              error={errors.email}
              onBlur={isGuest ? checkEmailsMatch : undefined}
            />

            {/* Guests only. A signed-in customer's address is already
                prefilled and already proven — asking them to retype it would
                be a field that can only ever be wrong.

                Paste is deliberately NOT blocked, which is the opposite of
                what many Japanese checkouts do. Blocking it breaks password
                managers and makes the field hostile on a phone, and it does
                not buy much: someone who pastes the same address twice had it
                right in their clipboard to begin with. The typos this is for
                are the ones made while typing. */}
            {isGuest && (
              <Field
                id="checkout-email-confirm"
                name="emailConfirm"
                label="メールアドレス（確認用）"
                type="email"
                required
                /* Not `email` — that would offer the browser's saved address
                   and let autofill tick both boxes without the customer ever
                   reading either one. */
                autoComplete="off"
                hint="確認のため、もう一度ご入力ください。"
                defaultValue={initial.emailConfirm}
                error={errors.emailConfirm ?? confirmError}
                onBlur={checkEmailsMatch}
              />
            )}
          </div>
        </section>

        {/* No chooser: 銀行振込 is the only method live, and a radio group of
            one is a question with a single answer. The value still posts, and
            the server still checks it against the known ids — a hidden field
            is as editable as a radio.

            The method is not simply dropped from the page, though. It is
            stated in the summary beside the total: how a customer pays is
            something they have to be told before they commit, not after. */}
        <input type="hidden" name="paymentMethod" value={DEFAULT_PAYMENT_METHOD} />

        {errors.paymentMethod && (
          <div className={styles.alertBelow}>
            <Alert variant="error">{errors.paymentMethod}</Alert>
          </div>
        )}
      </div>

      <aside className={styles.summary} aria-label="ご注文内容">
        <h2 className={styles.summaryTitle}>ご注文内容</h2>

        <ul className={styles.miniLines} role="list">
          {cart.lines.map((line) => (
            <li key={line.variantId} className={styles.miniLine}>
              <span className={styles.miniName}>
                {line.productName}
                <span className={styles.miniPack}>
                  {line.packLabel}／{line.quantity}点
                </span>
              </span>
              <span className="numeric">{formatYenSuffix(line.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <div className={styles.row}>
          <span>小計</span>
          <span className="numeric">{formatYenSuffix(cart.subtotal)}</span>
        </div>

        {cart.discount > 0 && (
          <div className={`${styles.row} ${styles.rowDiscount}`}>
            <span>割引</span>
            <span className="numeric">−{formatYenSuffix(cart.discount)}</span>
          </div>
        )}

        <div className={styles.row}>
          <span>送料</span>
          <span className="numeric">
            {cart.shipping === 0 ? '無料' : formatYenSuffix(cart.shipping)}
          </span>
        </div>

        {/* 特定商取引法 aside, a customer about to commit needs to know how
            they are paying. It was the selected radio before; with nothing to
            select it belongs here, with the figures. */}
        <div className={styles.paymentLine}>
          <span>お支払い方法</span>
          <span className={styles.paymentLineValue}>{paymentMethod.name}</span>
        </div>

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>合計</span>
          <span className={`${styles.totalValue} numeric`}>{formatYenSuffix(cart.total)}</span>
        </div>

        <p className={styles.paymentNoteSummary}>{paymentMethod.note}</p>

        {cart.pointsEarned > 0 && (
          <p className={styles.pointsNote}>{formatNumber(cart.pointsEarned)}pt が貯まります</p>
        )}

        {/* 「ご確認事項」 rather than 「ご注文内容の確認」: the summary heading
            directly above this one is 「ご注文内容」, and two headings a screen
            apart differing by three characters is not a distinction anyone
            reads. */}
        <h2 className={styles.sectionTitle}>ご確認事項</h2>

        {/* Three separate confirmations, not one combined tick.

            The personal-use one is the reason this site is lawful to operate:
            個人輸入 permits import for the importer's OWN use, and resale is
            prohibited outright. Asking the customer to state that explicitly —
            rather than burying it inside a link to the terms — is what makes it
            an attestation rather than a formality, and it is what the reference
            checkout does.

            The address one is about international shipping: a parcel that fails
            at a Japanese address after clearing customs is expensive to put
            right and often simply lost. A deliberate second look at the address
            is cheap by comparison. */}
        <label className={styles.terms} htmlFor="checkout-personal-use">
          <input
            className={styles.checkbox}
            id="checkout-personal-use"
            name="personalUse"
            type="checkbox"
            value="1"
          />
          <span>
            この注文の商品は<strong>ご本人が使用する目的</strong>で購入し、第三者への
            譲渡・販売はいたしません。
          </span>
        </label>

        {errors.personalUse && (
          <div className={styles.alertBelow}>
            <Alert variant="error">{errors.personalUse}</Alert>
          </div>
        )}

        <label className={styles.terms} htmlFor="checkout-address-confirmed">
          <input
            className={styles.checkbox}
            id="checkout-address-confirmed"
            name="addressConfirmed"
            type="checkbox"
            value="1"
          />
          <span>お届け先の氏名・住所・電話番号に誤りがないことを確認しました。</span>
        </label>

        {errors.addressConfirmed && (
          <div className={styles.alertBelow}>
            <Alert variant="error">{errors.addressConfirmed}</Alert>
          </div>
        )}

        <label className={styles.terms} htmlFor="checkout-terms">
          <input
            className={styles.checkbox}
            id="checkout-terms"
            name="terms"
            type="checkbox"
            value="1"
          />
          <span>
            ご注文内容を確認し、<Link href="/terms">利用規約</Link>および
            <Link href="/about-personal-import">個人輸入に関する注意事項</Link>に同意します。
          </span>
        </label>

        {errors.terms && (
          <div className={styles.alertBelow}>
            <Alert variant="error">{errors.terms}</Alert>
          </div>
        )}

        <div className={styles.submitWrap}>
          <SubmitButton />
        </div>

        <p className={styles.legalNote}>
          本注文は日本の個人輸入制度に基づくものであり、ご本人の使用に限られます。
          第三者への譲渡・販売は法律で禁止されています。
        </p>
      </aside>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {pending ? '注文を確定しています…' : '注文を確定する'}
    </Button>
  );
}
