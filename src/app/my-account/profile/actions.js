'use server';

import { revalidatePath } from 'next/cache';

import { rules, validate, field } from '@/lib/validation';
import { isPhoneCountry } from '@/constants/phone';
import { updateProfile, changePassword } from '@/services/auth.service';

/**
 * 会員情報 mutations.
 *
 * Two separate actions rather than one form with a mode flag: the details and
 * the password have nothing in common, need different validation, and a
 * failure in one must not throw away what was typed in the other.
 */

/* The backend has every name half and the date of birth as `required` — not
   `sometimes` — so a partial save is not possible and these mirror that. The
   18-year rule is the backend's too (before_or_equal on today minus 18
   years); checking it here as well means the customer hears about it without
   a round trip, and the server still refuses if this is bypassed. */
const PROFILE_RULES = {
  familyName: [(v) => rules.required(v, '姓'), (v) => rules.maxLength(v, 50, '姓')],
  givenName: [(v) => rules.required(v, '名'), (v) => rules.maxLength(v, 50, '名')],
  familyNameKana: [
    (v) => rules.required(v, 'せい'),
    (v) => rules.maxLength(v, 50, 'せい'),
    (v) => rules.kana(v, 'せい'),
  ],
  givenNameKana: [
    (v) => rules.required(v, 'めい'),
    (v) => rules.maxLength(v, 50, 'めい'),
    (v) => rules.kana(v, 'めい'),
  ],
  /* birthDate already applies the backend's own 18-year gate, along with
     format and real-date checks — 2026-02-31 is rejected rather than rolled
     over into March. Using it rather than a second age check here keeps the
     two from drifting apart. */
  dob: [(v) => rules.required(v, '生年月日'), (v) => rules.birthDate(v)],
  /* REQUIRED since 2026-10-16, matching registration and the backend. */
  phone: [(v) => rules.required(v, '電話番号'), (v) => rules.maxLength(v, 20, '電話番号'), rules.phone],
  phoneCountry: [(v) => (!v || isPhoneCountry(v) ? null : '国番号を選択してください。')],
  /* OPTIONAL here, unlike registration. Every customer who signed up before
     these existed has none, and requiring them would lock such a customer out
     of changing their phone number until they romanised their name too. */
  familyNameEnglish: [(v) => rules.maxLength(v, 60, '姓（English）')],
  givenNameEnglish: [(v) => rules.maxLength(v, 60, '名（English）')],
  nickname: [(v) => rules.maxLength(v, 50, 'ニックネーム')],
};

export async function updateProfileAction(prevState, formData) {
  const values = {
    familyName: field(formData, 'familyName'),
    givenName: field(formData, 'givenName'),
    familyNameKana: field(formData, 'familyNameKana'),
    givenNameKana: field(formData, 'givenNameKana'),
    familyNameEnglish: field(formData, 'familyNameEnglish'),
    givenNameEnglish: field(formData, 'givenNameEnglish'),
    dob: field(formData, 'dob'),
    phone: field(formData, 'phone'),
    phoneCountry: field(formData, 'phoneCountry'),
    gender: field(formData, 'gender'),
    nickname: field(formData, 'nickname'),
  };

  const { valid, errors } = validate(values, PROFILE_RULES);

  if (!valid) return { errors, values };

  const result = await updateProfile(values);

  /* `values` goes back on failure so a long form is not cleared by a backend
     error the customer can do nothing about. */
  if (!result.ok) return { errors: { form: result.error }, values };

  /* The sidebar greets them by name and the checkout prefills from the same
     record, so neither may keep showing the old one. */
  revalidatePath('/my-account', 'layout');
  revalidatePath('/checkout');

  return { success: '会員情報を更新しました。', errors: {}, values };
}

const PASSWORD_RULES = {
  currentPassword: [(v) => rules.required(v, '現在のパスワード')],
  /* min 6 is the backend's rule. Matching it here rather than imposing a
     stricter one keeps the two from disagreeing about what is acceptable. */
  newPassword: [
    (v) => rules.required(v, '新しいパスワード'),
    (v) => rules.minLength(v, 6, '新しいパスワード'),
  ],
  confirmPassword: [(v) => rules.required(v, '新しいパスワード（確認）')],
};

export async function changePasswordAction(prevState, formData) {
  const values = {
    currentPassword: field(formData, 'currentPassword'),
    newPassword: field(formData, 'newPassword'),
    confirmPassword: field(formData, 'confirmPassword'),
  };

  const { valid, errors } = validate(values, PASSWORD_RULES);
  if (!valid) return { errors };

  if (values.newPassword !== values.confirmPassword) {
    return { errors: { confirmPassword: '新しいパスワードが一致しません。' } };
  }

  const result = await changePassword(values);
  if (!result.ok) return { errors: { form: result.error } };

  /* Nothing is echoed back on success — a password must not survive in the
     state React hands to the next render. */
  return { success: 'パスワードを変更しました。', errors: {} };
}
