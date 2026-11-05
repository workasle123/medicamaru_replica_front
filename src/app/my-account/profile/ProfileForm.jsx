'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from '../AccountLayout.module.css';
import Alert from '@/components/ui/Alert/Alert';
import Field from '@/components/ui/Field/Field';
import Select from '@/components/ui/Select/Select';
import Button from '@/components/ui/Button/Button';
import RequiredNote from '@/components/ui/RequiredNote/RequiredNote';
import { updateProfileAction } from './actions';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRY_OPTIONS } from '@/constants/phone';

const GENDERS = [
  { value: '', label: '回答しない' },
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
];

/**
 * 会員情報 — read by default, editable on request.
 *
 * Not a form that is always open. This page is visited far more often to
 * CHECK a detail than to change one, and a screen of inputs invites a
 * mis-keyed name saved by accident. 編集する swaps the same values into
 * fields; キャンセル puts them back.
 *
 * The displayed values come from the server on every render, so after a
 * successful save the view shows what was actually stored rather than what
 * was typed — if the backend normalised something, that is what appears.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Customer} props.customer
 */
export default function ProfileForm({ customer }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(updateProfileAction, {
    errors: {},
    values: {},
  });

  /* Split back into halves for the inputs. The customer object carries them
     joined for display — `name` is 「山田 太郎」 — because that is what every
     other screen needs; the form is the one place that wants the parts. */
  const [familyName = '', givenName = ''] = (customer.name || '').split(/\s+/);
  const [familyNameKana = '', givenNameKana = ''] = (customer.nameKana || '').split(/\s+/);

  /* Joined for the read view only; the inputs below edit the two halves. */
  const englishName =
    [customer.familyNameEnglish, customer.givenNameEnglish].filter(Boolean).join(' ') || null;

  /* The dialling code belongs in front of the number wherever it is shown —
     it is stored apart so the number keeps its own meaning, not so the two
     are presented apart. */
  const displayPhone = customer.phone
    ? [customer.phoneCountry, customer.phone].filter(Boolean).join(' ')
    : null;

  const v = state.values ?? {};
  const errors = state.errors ?? {};

  if (!editing) {
    return (
      <>
        {state.success && <Alert variant="success">{state.success}</Alert>}

        <div className={styles.definition}>
          <Row label="お名前" value={customer.name} />
          <Row label="お名前（かな）" value={customer.nameKana} />
          {/* The romanised name, which is what goes on the shipping label.
              Shown here so a customer can see whether we hold one — everyone
              who registered before it was collected has none, and 編集する is
              where they can add it. */}
          <Row
            label="お名前（English）"
            value={englishName}
            hint="海外発送時の宛名に使用します"
          />
          <Row label="ニックネーム" value={customer.nickname} hint="レビューに表示されます" />
          <Row label="メールアドレス" value={customer.email} />
          <Row label="電話番号" value={displayPhone} />
          <Row label="生年月日" value={customer.dob} />
          <Row label="性別" value={GENDERS.find((g) => g.value === customer.gender)?.label} />
        </div>

        <div className={styles.profileActions}>
          <Button type="button" onClick={() => setEditing(true)}>
            会員情報を編集する
          </Button>
        </div>
      </>
    );
  }

  return (
    <form action={formAction} className={styles.profileForm} noValidate>
      {errors.form && <Alert variant="error">{errors.form}</Alert>}

      {/* The form stays open after a save rather than snapping back to the
          read view. Closing it would be a second thing happening at the moment
          the customer is looking for confirmation, and useActionState keeps
          `success` until the next submit — so an auto-close would also have to
          clear state it does not own. The confirmation sits where the edit
          was made; 閉じる returns to the values as stored. */}
      {state.success && <Alert variant="success">{state.success}</Alert>}

      <RequiredNote />

      <div className={styles.nameRow}>
        <Field
          id="familyName"
          name="familyName"
          label="姓"
          required
          autoComplete="family-name"
          defaultValue={v.familyName ?? familyName}
          error={errors.familyName}
        />
        <Field
          id="givenName"
          name="givenName"
          label="名"
          required
          autoComplete="given-name"
          defaultValue={v.givenName ?? givenName}
          error={errors.givenName}
        />
      </div>

      <div className={styles.nameRow}>
        <Field
          id="familyNameKana"
          name="familyNameKana"
          label="せい"
          required
          defaultValue={v.familyNameKana ?? familyNameKana}
          error={errors.familyNameKana}
        />
        <Field
          id="givenNameKana"
          name="givenNameKana"
          label="めい"
          required
          defaultValue={v.givenNameKana ?? givenNameKana}
          error={errors.givenNameKana}
        />
      </div>

      {/* The romanised name printed on the shipping label.
          OPTIONAL here, unlike registration: everyone who signed up before it
          was collected has none, and making it mandatory would stop such a
          customer saving any other change until they filled it in. This form
          is how they supply it. */}
      <div className={styles.nameRow}>
        <Field
          id="familyNameEnglish"
          name="familyNameEnglish"
          label="姓（English）"
          hint="例：YAMADA"
          defaultValue={v.familyNameEnglish ?? customer.familyNameEnglish ?? ''}
          error={errors.familyNameEnglish}
        />
        <Field
          id="givenNameEnglish"
          name="givenNameEnglish"
          label="名（English）"
          hint="例：TARO"
          defaultValue={v.givenNameEnglish ?? customer.givenNameEnglish ?? ''}
          error={errors.givenNameEnglish}
        />
      </div>

      <Field
        id="nickname"
        name="nickname"
        label="ニックネーム"
        hint="レビューに表示されるお名前です。"
        defaultValue={v.nickname ?? customer.nickname ?? ''}
        error={errors.nickname}
      />

      {/* Required now, with the dialling code beside it — see the note on
          the registration form. */}
      <div className={styles.nameRow}>
        <Select
          id="phoneCountry"
          name="phoneCountry"
          label="国番号"
          required
          options={PHONE_COUNTRY_OPTIONS}
          /* No blank option: Japan is the default and an empty
             dialling code is not a choice. */
          placeholder={null}
          defaultValue={v.phoneCountry ?? customer.phoneCountry ?? DEFAULT_PHONE_COUNTRY}
          error={errors.phoneCountry}
        />
        <Field
          id="phone"
          name="phone"
          label="電話番号"
          type="tel"
          required
          autoComplete="tel"
          defaultValue={v.phone ?? customer.phone ?? ''}
          error={errors.phone}
        />
      </div>

      <Field
        id="dob"
        name="dob"
        label="生年月日"
        type="date"
        required
        hint="18歳以上の方のみご利用いただけます。"
        defaultValue={v.dob ?? customer.dob ?? ''}
        error={errors.dob}
      />

      <Select
        id="gender"
        name="gender"
        label="性別"
        options={GENDERS}
        defaultValue={v.gender ?? customer.gender ?? ''}
        error={errors.gender}
      />

      {/* The email is shown but not editable here. Changing it is a credential
          change — the address is how the account is recovered — so it needs
          its own verified flow rather than a field in a details form. */}
      <p className={styles.profileNote}>
        メールアドレス（{customer.email}）の変更をご希望の場合は、お問い合わせください。
      </p>

      <div className={styles.profileActions}>
        <SaveButton />
        <button
          type="button"
          className={styles.profileCancel}
          onClick={() => setEditing(false)}
        >
          {state.success ? '閉じる' : 'キャンセル'}
        </button>
      </div>
    </form>
  );
}

function Row({ label, value, hint }) {
  return (
    <div className={styles.defRow}>
      <div className={styles.defLabel}>{label}</div>
      <div className={styles.defValue}>
        {value || <span className={styles.defEmpty}>未登録</span>}
        {hint && <span className={styles.defHint}>{hint}</span>}
      </div>
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? '保存中…' : '保存する'}
    </Button>
  );
}
