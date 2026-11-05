'use server';

import { rules, validate, field } from '@/lib/validation';
import { logError, toUserMessage } from '@/lib/api/errors';
import { subscribe } from '@/services/newsletter.service';

/** Newsletter sign-up from the side column (NewsletterSignup). */
export async function subscribeAction(prevState, formData) {
  const values = { email: field(formData, 'email') };

  const { valid, errors } = validate(values, {
    email: [(v) => rules.required(v, 'メールアドレス'), rules.email],
  });

  if (!valid) {
    return { errors, values };
  }

  try {
    const result = await subscribe(values.email);
    if (!result.ok) {
      return {
        errors: { email: 'このメールアドレスはすでに登録されています。' },
        values,
      };
    }
  } catch (error) {
    logError(error, { action: 'subscribeAction' });
    return { errors: { form: toUserMessage(error) }, values };
  }

  return {
    success: 'ご登録ありがとうございます。お得な情報をメールでお届けします。',
    errors: {},
    values: {},
  };
}
