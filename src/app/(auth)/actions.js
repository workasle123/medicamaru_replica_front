'use server';

import { redirect } from 'next/navigation';

import {
  login,
  register,
  confirmRegistration,
  requestPasswordReset,
  resetPassword,
  resendVerification,
} from '@/services/auth.service';
import { setSessionToken, clearSessionToken } from '@/lib/auth/session';
import { getCartId, clearCartId } from '@/lib/cart/session';
import { rules, validate, field, toHiragana } from '@/lib/validation';
import { DEFAULT_PHONE_COUNTRY, isPhoneCountry } from '@/constants/phone';
import { toUserMessage, logError } from '@/lib/api/errors';

/**
 * Medicamaru — authentication Server Actions.
 *
 * Server Actions rather than client fetch calls, so:
 *  - the forms work without JavaScript,
 *  - credentials never pass through client-side code,
 *  - and the session cookie is set server-side as httpOnly.
 *
 * Every action returns `{ errors, values }` on failure so the form can
 * re-render with messages AND the user's input intact — except passwords,
 * which are never echoed back.
 *
 * Server-side validation here duplicates the client rules deliberately: the
 * client copy is convenience, this is the control.
 */

/** Only allow same-origin relative paths, so `?next=` cannot become an open redirect. */
function safeRedirect(target, fallback = '/my-account') {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) {
    return fallback;
  }
  return target;
}

export async function loginAction(prevState, formData) {
  const values = {
    email: field(formData, 'email'),
    password: formData.get('password') ?? '',
  };
  const next = safeRedirect(field(formData, 'next'));

  const { valid, errors } = validate(values, {
    email: [(v) => rules.required(v, 'メールアドレス'), rules.email],
    password: [(v) => rules.required(v, 'パスワード')],
  });

  if (!valid) {
    return { errors, values: { email: values.email } };
  }

  let result;
  try {
    /* The guest cart id goes with the credentials: the backend merges that
       cart into the account on a successful login, so signing in keeps
       whatever was assembled while browsing anonymously. */
    result = await login({ ...values, sessionId: await getCartId() });
  } catch (error) {
    logError(error, { action: 'loginAction' });
    return { errors: { form: toUserMessage(error) }, values: { email: values.email } };
  }

  /* The password was right; the address has not been confirmed. Flagged
     separately so the page can offer to resend the link — telling them their
     credentials are wrong would send them off to reset a password that is
     already correct. */
  if (!result.ok && result.unverified) {
    return {
      errors: { form: result.error },
      unverifiedEmail: result.email ?? values.email,
      values: { email: values.email },
    };
  }

  if (!result.ok) {
    return { errors: { form: result.error }, values: { email: values.email } };
  }

  // The customer id is stored alongside the token because the cart endpoints
  // key on it once signed in.
  await setSessionToken(result.token, result.customer?.id);
  redirect(next);
}

/**
 * Registration.
 *
 * The backend requires twelve fields, not the four this used to send: the name
 * split kanji/hiragana × family/given, a date of birth behind an 18+ gate, and
 * a full address. Every rule below mirrors one the backend enforces — the
 * client copy exists so a mistake produces a message next to the field instead
 * of a rejected request.
 */
export async function registerAction(prevState, formData) {
  const values = {
    familyName: field(formData, 'familyName'),
    givenName: field(formData, 'givenName'),
    familyNameKana: field(formData, 'familyNameKana'),
    givenNameKana: field(formData, 'givenNameKana'),
    familyNameEnglish: field(formData, 'familyNameEnglish'),
    givenNameEnglish: field(formData, 'givenNameEnglish'),
    email: field(formData, 'email'),
    phone: field(formData, 'phone'),
    phoneCountry: field(formData, 'phoneCountry'),
    gender: field(formData, 'gender'),
    dob: field(formData, 'dob'),
    postalCode: field(formData, 'postalCode'),
    prefecture: field(formData, 'prefecture'),
    city: field(formData, 'city'),
    address1: field(formData, 'address1'),
    address2: field(formData, 'address2'),
    referralCode: field(formData, 'referralCode'),
    password: formData.get('password') ?? '',
    passwordConfirm: formData.get('passwordConfirm') ?? '',
    terms: formData.get('terms'),
  };

  /* FORMAT checks on the name readings, phone and postal code were removed
     (2026-09-26): they turned away people whose input the shop would have
     accepted perfectly well. The backend enforces none of them —
     first_name_hiragana is `required|string`, customer_phone is
     `nullable|string`, zipcode is `required|string` — so nothing downstream
     depended on them.

     What stays is what the backend DOES require: the fields must be present
     and within the column lengths. Dropping `required` here would just move
     the rejection to a 422 after submit, which is a worse place to learn it. */
  const { valid, errors } = validate(values, {
    familyName: [(v) => rules.required(v, '姓'), (v) => rules.maxLength(v, 30, '姓')],
    givenName: [(v) => rules.required(v, '名'), (v) => rules.maxLength(v, 30, '名')],
    familyNameKana: [(v) => rules.required(v, 'せい'), (v) => rules.maxLength(v, 30, 'せい')],
    givenNameKana: [(v) => rules.required(v, 'めい'), (v) => rules.maxLength(v, 30, 'めい')],
    /* The romanised name the shipping label prints. 60 matches the column.
       No character-class rule: the backend accepts any string, and a pattern
       here would turn away the accented spellings that are on real passports
       — Ōno, Saitô — for a field whose only job is to be readable to a
       carrier abroad. */
    familyNameEnglish: [
      (v) => rules.required(v, '姓（English）'),
      (v) => rules.maxLength(v, 60, '姓（English）'),
    ],
    givenNameEnglish: [
      (v) => rules.required(v, '名（English）'),
      (v) => rules.maxLength(v, 60, '名（English）'),
    ],
    email: [(v) => rules.required(v, 'メールアドレス'), rules.email],
    /* REQUIRED since 2026-10-16, matching the backend. A parcel needing a
       customs declaration and a delivery attempt is the wrong place to find
       there is no number to call. No format rule — the backend imposes none
       and the field has to accept 090-1234-5678, 09012345678 and a foreign
       number alike. */
    phone: [(v) => rules.required(v, '電話番号'), (v) => rules.maxLength(v, 20, '電話番号')],
    /* Not required: the select always has a value, so an empty one means the
       form was tampered with and the backend's +81 default covers it. */
    phoneCountry: [
      (v) => (!v || isPhoneCountry(v) ? null : '国番号を選択してください。'),
    ],
    dob: [(v) => rules.required(v, '生年月日'), (v) => rules.birthDate(v)],
    postalCode: [(v) => rules.required(v, '郵便番号')],
    prefecture: [(v) => rules.required(v, '都道府県')],
    city: [(v) => rules.required(v, '市区町村'), (v) => rules.maxLength(v, 60, '市区町村')],
    address1: [(v) => rules.required(v, '番地'), (v) => rules.maxLength(v, 120, '番地')],
    address2: [(v) => rules.maxLength(v, 120, '建物名・部屋番号')],
    password: [(v) => rules.required(v, 'パスワード'), rules.password],
    passwordConfirm: [
      (v) => rules.required(v, 'パスワード（確認）'),
      (v) => rules.matches(v, values.password, 'パスワード'),
    ],
    terms: [(v) => (v ? null : '利用規約とプライバシーポリシーへの同意が必要です。')],
  });

  // Echo back everything except the passwords and the consent checkbox.
  const { password, passwordConfirm, terms, ...echo } = values;

  if (!valid) {
    return { errors, values: echo };
  }

  let result;
  try {
    result = await register({
      familyName: values.familyName,
      givenName: values.givenName,
      /* Converted, not just validated. The form accepts katakana because
         that is what people type for フリガナ, but the column is *_hiragana —
         storing both scripts would make the reading useless for sorting. */
      familyNameKana: toHiragana(values.familyNameKana),
      givenNameKana: toHiragana(values.givenNameKana),
      familyNameEnglish: values.familyNameEnglish,
      givenNameEnglish: values.givenNameEnglish,
      email: values.email,
      password: values.password,
      phone: values.phone,
      phoneCountry: values.phoneCountry || DEFAULT_PHONE_COUNTRY,
      gender: values.gender,
      dob: values.dob,
      address1: values.address1,
      address2: values.address2,
      city: values.city,
      prefecture: values.prefecture,
      postalCode: values.postalCode,
      /* Optional. The adapter already mapped this to `referral_by`; only the
         field was missing. Not validated here on purpose — the backend rule is
         `nullable|exists:customers,referral_code`, so whether a code is real is
         something only it can answer. */
      referralCode: values.referralCode,
      /* The backend requires a country and this storefront ships to Japan only,
         so it is fixed rather than asked for. */
      country: '日本',
      // Merges anything added before signing up into the new account's cart.
      sessionId: await getCartId(),
    });
  } catch (error) {
    logError(error, { action: 'registerAction' });
    return { errors: { form: toUserMessage(error) }, values: echo };
  }

  if (!result.ok) {
    return { errors: { form: result.error }, values: echo };
  }

  /* The address already has guest orders, so the backend emailed a link to it
     instead of signing anyone in — see confirmRegistrationAction. Worded
     neutrally: the page must not say what that address has ordered. */
  if (result.confirmationRequired) {
    return {
      success: `${values.email} 宛に確認メールをお送りしました。メール内のリンクからパスワードを設定すると、会員登録が完了します。リンクの有効期限は60分です。`,
    };
  }

  /* A new account must confirm its address before it can sign in, so there is
     no session to set. Same shape as the guest-claim branch above, and for the
     same reason: the next step is in their inbox, not on this page. */
  if (result.requiresVerification) {
    return {
      success: `${result.email ?? values.email} 宛に確認メールをお送りしました。メール内のリンクからメールアドレスのご確認を完了すると、ログインできるようになります。リンクの有効期限は60分です。`,
    };
  }

  await setSessionToken(result.token, result.customer?.id);
  redirect('/my-account');
}

/**
 * /register/confirm — the page behind the link emailed to an address with guest
 * orders. Setting the password here is what proves the inbox, finishes the
 * registration and signs the customer in, landing on the history that now
 * includes those orders.
 */
export async function confirmRegistrationAction(prevState, formData) {
  const values = {
    token: field(formData, 'token'),
    password: formData.get('password') ?? '',
    passwordConfirm: formData.get('passwordConfirm') ?? '',
  };

  const { valid, errors } = validate(values, {
    token: [(v) => (v ? null : 'リンクが正しくありません。メール内のリンクからもう一度開いてください。')],
    password: [(v) => rules.required(v, 'パスワード'), rules.password],
    passwordConfirm: [
      (v) => rules.required(v, 'パスワード（確認）'),
      (v) => rules.matches(v, values.password, 'パスワード'),
    ],
  });

  if (!valid) {
    return { errors: errors.token ? { form: errors.token } : errors };
  }

  let result;
  try {
    result = await confirmRegistration({
      token: values.token,
      password: values.password,
      passwordConfirm: values.passwordConfirm,
      sessionId: await getCartId(),
    });
  } catch (error) {
    logError(error, { action: 'confirmRegistrationAction' });
    return { errors: { form: toUserMessage(error) } };
  }

  if (!result.ok) {
    return { errors: { form: result.error } };
  }

  await setSessionToken(result.token, result.customer?.id);
  redirect('/my-account/orders');
}

/**
 * /reset-password — the page behind the link in the password-reset email.
 *
 * On success the backend has signed out every session for the account, so any
 * session cookie in this browser is stale too and is cleared; the customer
 * then signs in with the new password.
 */
export async function resetPasswordAction(prevState, formData) {
  const values = {
    token: field(formData, 'token'),
    password: formData.get('password') ?? '',
    passwordConfirm: formData.get('passwordConfirm') ?? '',
  };

  const { valid, errors } = validate(values, {
    token: [(v) => (v ? null : 'リンクが正しくありません。メール内のリンクからもう一度開いてください。')],
    password: [(v) => rules.required(v, 'パスワード'), rules.password],
    passwordConfirm: [
      (v) => rules.required(v, 'パスワード（確認）'),
      (v) => rules.matches(v, values.password, 'パスワード'),
    ],
  });

  if (!valid) {
    return { errors: errors.token ? { form: errors.token } : errors };
  }

  let result;
  try {
    result = await resetPassword({
      token: values.token,
      password: values.password,
      passwordConfirm: values.passwordConfirm,
    });
  } catch (error) {
    logError(error, { action: 'resetPasswordAction' });
    return { errors: { form: toUserMessage(error) } };
  }

  if (!result.ok) {
    return { errors: { form: result.error } };
  }

  await clearSessionToken();
  redirect('/login?reset=1');
}

export async function forgotPasswordAction(prevState, formData) {
  const email = field(formData, 'email');

  const { valid, errors } = validate({ email }, {
    email: [(v) => rules.required(v, 'メールアドレス'), rules.email],
  });

  if (!valid) return { errors, values: { email } };

  await requestPasswordReset(email);

  // Deliberately identical whether or not the address is registered —
  // anything else leaks which addresses have accounts.
  return {
    success:
      'ご入力のメールアドレス宛に、パスワード再設定のご案内をお送りしました。メールが届かない場合は、迷惑メールフォルダもご確認ください。',
    errors: {},
    values: {},
  };
}

/* `signOutExpiredAction` used to live here: recovery from a session cookie the
   backend no longer accepts. It is now GET /session-expired, a route handler.

   Its premise was right — /login had to have the cookie cleared first or it
   redirected straight back — but a Server Action was the wrong shape for it.
   The reply carried both the Set-Cookie that deletes the session and the
   redirect, so one dropped response left the server signed out while the
   browser kept the cookie, and the button became inert. Responses abort
   intermittently on this host. The real fix went further: /login and /register
   now verify the token rather than merely noticing the cookie, so the loop has
   no way to form in the first place. */

export async function logoutAction() {
  await clearSessionToken();
  /* The cart cookie goes too. Login merges the guest cart into the account, so
     after logout that same `session_id` still resolves to rows now owned by the
     customer — leaving it in place showed the previous customer's cart to
     whoever used the browser next. The rows themselves stay attached to the
     account, so nothing is lost; the browser simply starts a fresh guest cart. */
  await clearCartId();
  redirect('/');
}

/**
 * Send the verification link again.
 *
 * Reports success unconditionally, because the backend does: it will not say
 * whether an address is registered, and neither should this.
 */
export async function resendVerificationAction(prevState, formData) {
  const email = field(formData, 'email');

  if (!email) {
    return { errors: { email: 'メールアドレスを入力してください。' } };
  }

  await resendVerification(email);

  return {
    success: `${email} 宛に確認メールを再送信しました。メールが届かない場合は、迷惑メールフォルダもご確認ください。`,
    errors: {},
  };
}
