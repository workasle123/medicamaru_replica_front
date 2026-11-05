'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './Addresses.module.css';
import Field from '@/components/ui/Field/Field';
import Select from '@/components/ui/Select/Select';
import Alert from '@/components/ui/Alert/Alert';
import Button from '@/components/ui/Button/Button';
import RequiredNote from '@/components/ui/RequiredNote/RequiredNote';
import { PREFECTURES } from '@/constants/checkout';
import { saveAddressAction } from './actions';

/**
 * Add or edit one address.
 *
 * One component for both: an edit is the same fields with values in them and a
 * hidden id, and splitting them would mean maintaining the same eight fields
 * twice. `editing` being null is what makes it an add form.
 *
 * Collapsed behind a button when adding, because the common case for a returning
 * customer is reading their list, not extending it — but open immediately when
 * editing, since the customer just asked to change something.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Address|null} [props.editing]
 * @param {() => void} [props.onDone]
 * @param {boolean} [props.isFirst] No addresses yet — hides the default toggle,
 *   since the first one becomes the default regardless.
 */
export default function AddressForm({ editing = null, onDone, isFirst = false }) {
  const [state, formAction] = useActionState(saveAddressAction, { errors: {}, values: {} });
  const [wantOpen, setWantOpen] = useState(Boolean(editing));
  /* The save token this form has already reacted to. Advancing it is how
     reopening the form works after a successful save. */
  const [seenSave, setSeenSave] = useState(null);
  const errors = state?.errors ?? {};
  const headingRef = useRef(null);

  /* Derived, not synced. A successful save closes the form because `savedAt`
     moved past what this component has seen — no effect, so no extra render
     pass and no chance of the two disagreeing. Reopening advances `seenSave`
     from the click handler, which is where a state change belongs. */
  const justSaved = Boolean(state?.savedAt) && state.savedAt !== seenSave;
  const open = wantOpen && !justSaved;

  const reopen = () => {
    setSeenSave(state?.savedAt ?? null);
    setWantOpen(true);
  };

  const close = () => {
    setSeenSave(state?.savedAt ?? null);
    setWantOpen(false);
    onDone?.();
  };

  // Opening a form the customer asked for should move focus into it.
  useEffect(() => {
    if (open) headingRef.current?.focus();
  }, [open]);

  const values = state?.values && Object.keys(state.values).length ? state.values : editing ?? {};

  if (!open) {
    /* An edit form closes on save and its card is about to be replaced by the
       revalidated list. Rendering the add button here would put a second one
       inside the card for the moment before that happens. */
    if (editing) return null;

    return (
      <div className={styles.addRow}>
        <Button type="button" variant="secondary" onClick={reopen}>
          ＋ 新しいお届け先を追加
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      <h2 className={styles.formTitle} tabIndex={-1} ref={headingRef}>
        {editing ? 'お届け先を編集' : '新しいお届け先'}
      </h2>

      {errors.form && <Alert variant="error">{errors.form}</Alert>}

      <RequiredNote />

      {editing && <input type="hidden" name="id" value={editing.id} />}

      <Field
        id="addr-label"
        name="label"
        label="ラベル"
        hint="例：自宅、職場（お届け先を見分けるための名前です）"
        defaultValue={values.label}
        error={errors.label}
      />

      <div className={styles.pair}>
        <Field
          id="addr-recipient"
          name="recipient"
          label="お届け先氏名"
          required
          autoComplete="name"
          hint="例：山田 太郎"
          defaultValue={values.recipient}
          error={errors.recipient}
        />
        <Field
          id="addr-phone"
          name="phone"
          label="電話番号"
          type="tel"
          required
          autoComplete="tel"
          hint="例：090-1234-5678（配送業者からの連絡に使用します）"
          defaultValue={values.phone}
          error={errors.phone}
        />
      </div>

      <div className={styles.pair}>
        <Field
          id="addr-postal"
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
          id="addr-prefecture"
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
          id="addr-city"
          name="city"
          label="市区町村"
          required
          autoComplete="address-level2"
          hint="例：渋谷区渋谷"
          defaultValue={values.city}
          error={errors.city}
        />
        <Field
          id="addr-street"
          name="street"
          label="番地"
          required
          autoComplete="address-line1"
          hint="例：1-2-3"
          defaultValue={values.street}
          error={errors.street}
        />
      </div>

      <Field
        id="addr-building"
        name="building"
        label="建物名・部屋番号"
        autoComplete="address-line2"
        hint="例：メディカマンション101号室"
        defaultValue={values.building}
        error={errors.building}
      />

      {/* Hidden for the first address: it becomes the default whatever this says,
          so offering the choice would be offering a lie. */}
      {!isFirst && (
        <label className={styles.checkboxRow} htmlFor="addr-default">
          <input
            className={styles.checkbox}
            id="addr-default"
            name="isDefault"
            type="checkbox"
            value="1"
            defaultChecked={Boolean(values.isDefault)}
          />
          <span>このお届け先を既定にする</span>
        </label>
      )}

      <div className={styles.formActions}>
        <SubmitButton editing={Boolean(editing)} />
        <Button type="button" variant="ghost" onClick={close}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}

function SubmitButton({ editing }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? '保存中…' : editing ? '変更を保存' : 'このお届け先を保存'}
    </Button>
  );
}
