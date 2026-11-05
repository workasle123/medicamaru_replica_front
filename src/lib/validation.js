/**
 * Medicamaru — form validation.
 *
 * Client-side validation is a convenience, never a control. Every rule here
 * MUST also be enforced by the backend; this exists to give fast, clear
 * feedback, not to protect anything (brief §17).
 *
 * Messages are Japanese and specific — "メールアドレスの形式が正しくありません"
 * tells the user what to fix; "入力エラー" does not.
 */

/** Deliberately permissive. Over-strict email regexes reject valid addresses. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Japanese domestic numbers, allowing spaces and hyphens. */
const PHONE_RE = /^0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}$/;

/** 7 digits, with or without the hyphen: 123-4567 or 1234567 */
const POSTAL_RE = /^\d{3}-?\d{4}$/;

/**
 * Kana — hiragana OR katakana, plus the long vowel mark ー and the middle dot ・
 * that appear in transliterated names.
 *
 * Katakana is ACCEPTED even though the backend column is `*_hiragana`. Japanese
 * forms conventionally ask for フリガナ in katakana and people type it from habit;
 * rejecting it refused a perfectly correct-looking entry. `toHiragana` converts
 * on the way out, so what is stored is still hiragana and stays sortable.
 */
const KANA_RE = /^[ぁ-ゖァ-ヺー・\s]+$/;

/**
 * Katakana → hiragana. The two blocks sit 0x60 apart in Unicode and are laid
 * out identically, so the mapping is a straight offset. Anything outside the
 * katakana block (ー, ・, spaces) is left untouched.
 */
export function toHiragana(value) {
  return String(value ?? '').replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

/** The minimum age the backend enforces on customer_dob. */
const MIN_AGE_YEARS = 18;

export const rules = {
  required(value, label) {
    if (value === undefined || value === null || String(value).trim() === '') {
      return `${label}を入力してください。`;
    }
    return null;
  },

  email(value) {
    if (!value) return null;
    return EMAIL_RE.test(String(value).trim())
      ? null
      : 'メールアドレスの形式が正しくありません。';
  },

  minLength(value, min, label) {
    if (!value) return null;
    return String(value).length >= min
      ? null
      : `${label}は${min}文字以上で入力してください。`;
  },

  maxLength(value, max, label) {
    if (!value) return null;
    return String(value).length <= max
      ? null
      : `${label}は${max}文字以内で入力してください。`;
  },

  phone(value) {
    if (!value) return null;
    return PHONE_RE.test(String(value).replace(/\s/g, ''))
      ? null
      : '電話番号の形式が正しくありません。（例：090-1234-5678）';
  },

  postalCode(value) {
    if (!value) return null;
    return POSTAL_RE.test(String(value).trim())
      ? null
      : '郵便番号の形式が正しくありません。（例：123-4567）';
  },

  /**
   * Length and character-class variety, no arbitrary symbol requirement.
   * Forced symbols push people toward weaker, more memorable passwords.
   */
  password(value) {
    if (!value) return null;
    const s = String(value);
    if (s.length < 8) return 'パスワードは8文字以上で入力してください。';
    if (s.length > 128) return 'パスワードは128文字以内で入力してください。';
    if (!/[a-zA-Z]/.test(s) || !/\d/.test(s)) {
      return 'パスワードは英字と数字を組み合わせて入力してください。';
    }
    return null;
  },

  matches(value, other, label) {
    if (!value) return null;
    return value === other ? null : `${label}が一致しません。`;
  },

  /** Furigana. Accepts either kana; see KANA_RE and toHiragana. */
  kana(value, label) {
    if (!value) return null;
    return KANA_RE.test(String(value).trim())
      ? null
      : `${label}はひらがなまたはカタカナで入力してください。`;
  },

  /**
   * Date of birth: YYYY-MM-DD, a real date, not in the future, and at least 18
   * years ago. The backend applies the same age gate
   * (`before_or_equal:` today − 18 years) and rejects the registration outright,
   * so catching it here is the difference between a clear message and a 500.
   */
  birthDate(value, label = '生年月日') {
    if (!value) return null;
    const text = String(value).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return `${label}は正しい形式で入力してください。`;
    }

    // Compare the parts back, so 2026-02-31 is rejected rather than rolled over.
    const [year, month, day] = text.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return `${label}が正しくありません。`;
    }

    const today = new Date();
    if (date.getTime() > today.getTime()) {
      return `${label}が正しくありません。`;
    }

    const cutoff = new Date(
      Date.UTC(today.getUTCFullYear() - MIN_AGE_YEARS, today.getUTCMonth(), today.getUTCDate())
    );
    if (date.getTime() > cutoff.getTime()) {
      return `ご登録は${MIN_AGE_YEARS}歳以上のお客様に限らせていただきます。`;
    }

    return null;
  },
};

/**
 * Run a field→validators map over form values.
 *
 * @param {Record<string, unknown>} values
 * @param {Record<string, Array<(v: unknown) => string|null>>} schema
 * @returns {{valid: boolean, errors: Record<string, string>}}
 */
export function validate(values, schema) {
  const errors = {};

  for (const [field, validators] of Object.entries(schema)) {
    for (const validator of validators) {
      const message = validator(values[field]);
      if (message) {
        // First error per field only — a wall of messages helps nobody.
        errors[field] = message;
        break;
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Convenience: pull a trimmed string out of FormData. */
export function field(formData, name) {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
