'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from '../AuthLayout.module.css';
import Field from '@/components/ui/Field/Field';
import Select from '@/components/ui/Select/Select';
import Alert from '@/components/ui/Alert/Alert';
import Button from '@/components/ui/Button/Button';
import RequiredNote from '@/components/ui/RequiredNote/RequiredNote';
import { PREFECTURES } from '@/constants/checkout';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRY_OPTIONS } from '@/constants/phone';
import { registerAction } from '../actions';

/**
 * RegisterForm.
 *
 * ONE flat form. No customer type, no doctor/pharmacist/wholesale branches,
 * no conditional fields, no verification step — see docs/DECISIONS.md D7.
 * The source platform splits registration across customerRegister and
 * medicalRegister; Medicamaru does not.
 *
 * Twelve of these fields are required by the backend, which is why the form is
 * this long: it previously asked for four and every submission was rejected
 * with a 500. Grouped into fieldsets so it reads as four short steps rather
 * than one long list.
 *
 * `gender` is the only genuinely optional-by-design field, and it offers only
 * these two values because the column is `enum('male','female')` — anything
 * else is rejected outright. The column is nullable, so leaving the placeholder
 * selected stores null, which is what 回答しない means here.
 */

const GENDER_OPTIONS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
];

/**
 * @param {Object} props
 * @param {string} [props.referralCode]  From ?ref= on the invitation link.
 */
export default function RegisterForm({ referralCode = '' }) {
  const [state, formAction] = useActionState(registerAction, { errors: {}, values: {} });
  const errors = state?.errors ?? {};
  const values = state?.values ?? {};

  /* An address with earlier guest orders: registration finishes from the link
     the backend has just emailed to it (see confirmRegistrationAction). */
  if (state?.success) {
    return (
      <Alert variant="success" title="確認メールを送信しました">
        {state.success}
      </Alert>
    );
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      {errors.form && <Alert variant="error">{errors.form}</Alert>}

      {/* The asterisk needs a key. On its own it is a convention someone either
          knows or does not, and this form asks for twelve required fields — a
          reader who misreads the mark misreads the whole page. */}
      <RequiredNote />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>お客様情報</legend>

        {/* Kanji name, family first — the order Japanese forms use. The script
            is named in the label rather than left to be inferred: 姓 and せい
            differ by two characters and are otherwise identical rows, and the
            example underneath is what actually tells them apart at a glance. */}
        <div className={styles.pair}>
          <Field
            id="register-family-name"
            name="familyName"
            label="姓（漢字）"
            required
            autoComplete="family-name"
            hint="例：山田"
            defaultValue={values.familyName}
            error={errors.familyName}
          />
          <Field
            id="register-given-name"
            name="givenName"
            label="名（漢字）"
            required
            autoComplete="given-name"
            hint="例：太郎"
            defaultValue={values.givenName}
            error={errors.givenName}
          />
        </div>

        {/* Romanised name, for the shipping label.
            Parcels are dispatched from overseas and the carrier's paperwork
            cannot carry 漢字, so the label prints 「山田 太郎 / YAMADA TARO」.
            Asked here rather than transliterated from the furigana because a
            reading has several valid spellings — こうの is Kono, Kouno or
            Kohno — and the one on the customer's own ID is the one that has
            to match. */}
        <div className={styles.pair}>
          <Field
            id="register-family-english"
            name="familyNameEnglish"
            label="姓（English）"
            required
            autoComplete="off"
            hint="例：YAMADA"
            defaultValue={values.familyNameEnglish}
            error={errors.familyNameEnglish}
          />
          <Field
            id="register-given-english"
            name="givenNameEnglish"
            label="名（English）"
            required
            autoComplete="off"
            hint="例：TARO"
            defaultValue={values.givenNameEnglish}
            error={errors.givenNameEnglish}
          />
        </div>

        {/* Furigana. Either kana is accepted — katakana is what most people
            type here — and the action converts to hiragana before storing. */}
        <div className={styles.pair}>
          <Field
            id="register-family-kana"
            name="familyNameKana"
            label="せい（ひらがな・カタカナ）"
            required
            autoComplete="off"
            hint="例：やまだ"
            defaultValue={values.familyNameKana}
            error={errors.familyNameKana}
          />
          <Field
            id="register-given-kana"
            name="givenNameKana"
            label="めい（ひらがな・カタカナ）"
            required
            autoComplete="off"
            hint="例：たろう"
            defaultValue={values.givenNameKana}
            error={errors.givenNameKana}
          />
        </div>

        <div className={styles.pair}>
          {/* A date input rather than three selects, and `max` set to the
              18-years-ago cutoff so the picker cannot offer an ineligible
              date. The rule is still enforced in the action and the backend. */}
          <Field
            id="register-dob"
            name="dob"
            label="生年月日"
            type="date"
            required
            autoComplete="bday"
            hint="18歳以上のお客様に限らせていただきます。"
            max={eighteenYearsAgo()}
            defaultValue={values.dob}
            error={errors.dob}
          />

          <Select
            id="register-gender"
            name="gender"
            label="性別"
            options={GENDER_OPTIONS}
            placeholder="回答しない"
            defaultValue={values.gender}
            error={errors.gender}
          />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>ご連絡先</legend>

        <div className={styles.pair}>
          <Field
            id="register-email"
            name="email"
            label="メールアドレス"
            type="email"
            required
            autoComplete="email"
            hint="例：yamada@example.com（ご注文確認メールの送信先になります）"
            defaultValue={values.email}
            error={errors.email}
          />

          {/* REQUIRED since 2026-10-16. It was optional, and a parcel that
              needs a customs declaration and a delivery attempt is the wrong
              place to find there is no number to call — 日本郵便's own form
              treats it as mandatory.

              The dialling code sits in its own select, defaulting to Japan,
              and is stored in its own column: the number itself goes on
              meaning the national number it always has. */}
          <div className={styles.pair}>
            <Select
              id="register-phone-country"
              name="phoneCountry"
              label="国番号"
              required
              options={PHONE_COUNTRY_OPTIONS}
              /* No blank option: Japan is the default and an empty
                 dialling code is not a choice. */
              placeholder={null}
              defaultValue={values.phoneCountry || DEFAULT_PHONE_COUNTRY}
              error={errors.phoneCountry}
            />
            <Field
              id="register-phone"
              name="phone"
              label="電話番号"
              type="tel"
              required
              autoComplete="tel"
              hint="例：090-1234-5678"
              defaultValue={values.phone}
              error={errors.phone}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>ご住所</legend>

        <div className={styles.pair}>
          <Field
            id="register-postal"
            name="postalCode"
            label="郵便番号"
            required
            autoComplete="postal-code"
            inputMode="numeric"
            hint="例：123-4567"
            defaultValue={values.postalCode}
            error={errors.postalCode}
          />

          <Select
            id="register-prefecture"
            name="prefecture"
            label="都道府県"
            required
            options={PREFECTURES.map((p) => ({ value: p, label: p }))}
            defaultValue={values.prefecture}
            error={errors.prefecture}
          />
        </div>

        <div className={styles.pair}>
          <Field
            id="register-city"
            name="city"
            label="市区町村"
            required
            autoComplete="address-level2"
            hint="例：渋谷区渋谷"
            defaultValue={values.city}
            error={errors.city}
          />

          <Field
            id="register-address1"
            name="address1"
            label="番地"
            required
            autoComplete="address-line1"
            hint="例：1-2-3"
            defaultValue={values.address1}
            error={errors.address1}
          />
        </div>

        <Field
          id="register-address2"
          name="address2"
          label="建物名・部屋番号"
          autoComplete="address-line2"
          hint="例：メディカマンション101号室"
          defaultValue={values.address2}
          error={errors.address2}
        />
      </fieldset>

      {/* Optional, and last before the password: someone without a code should
          meet it after everything that is actually required, not in the middle
          of their address. Whether a code is real is the backend's call
          (`exists:customers,referral_code`), so nothing is checked here. */}
      <fieldset className={styles.group}>
        <legend className={styles.legend}>紹介コード（任意）</legend>

        <Field
          id="register-referral-code"
          name="referralCode"
          label="紹介コード"
          autoComplete="off"
          hint="お持ちの方のみご入力ください。"
          /* The invited code, unless a submission came back with one typed
             over it — then the customer's own value wins. */
          defaultValue={values.referralCode ?? referralCode}
          error={errors.referralCode}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>パスワード</legend>

        <div className={styles.pair}>
          <Field
            id="register-password"
            name="password"
            label="パスワード"
            type="password"
            required
            autoComplete="new-password"
            hint="8文字以上で、英字と数字を組み合わせてください。"
            error={errors.password}
          />

          <Field
            id="register-password-confirm"
            name="passwordConfirm"
            label="パスワード（確認）"
            type="password"
            required
            autoComplete="new-password"
            error={errors.passwordConfirm}
          />
        </div>
      </fieldset>

      <div>
        <label className={styles.checkboxRow} htmlFor="register-terms">
          <input
            className={styles.checkbox}
            id="register-terms"
            name="terms"
            type="checkbox"
            value="1"
            aria-describedby={errors.terms ? 'register-terms-error' : undefined}
          />
          <span>
            <Link href="/terms">利用規約</Link>および
            <Link href="/privacy">プライバシーポリシー</Link>に同意します。
          </span>
        </label>
        {errors.terms && (
          <div id="register-terms-error" className={styles.checkboxError}>
            <Alert variant="error">{errors.terms}</Alert>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <SubmitButton />
      </div>
    </form>
  );
}

/**
 * The latest date that still satisfies the 18+ gate, as YYYY-MM-DD.
 *
 * Computed in the browser, so it is only a convenience for the date picker —
 * a clock set back would widen it, which is exactly why the same rule is
 * applied again in the Server Action and once more by the backend.
 */
function eighteenYearsAgo() {
  const now = new Date();
  const cutoff = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  const month = String(cutoff.getMonth() + 1).padStart(2, '0');
  const day = String(cutoff.getDate()).padStart(2, '0');
  return `${cutoff.getFullYear()}-${month}-${day}`;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {pending ? '登録しています…' : '同意して登録する'}
    </Button>
  );
}
