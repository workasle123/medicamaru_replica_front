'use server';

import { rules, validate, field } from '@/lib/validation';
import { logError, toUserMessage } from '@/lib/api/errors';
import { submitInquiry } from '@/services/inquiry.service';
import { inquiryTopicLabel } from '@/constants/contact';

/**
 * Contact form submission → POST /api/contact, table `inquiry`,
 * read in Admin → Inquiry.
 *
 * This used to log the message and throw it away while telling the customer
 * "お問い合わせを受け付けました" — the backend endpoint did exist, nothing ever
 * called it. If the send fails now, the visitor is told so and keeps what they
 * typed; a success message is only ever returned after the backend accepted it.
 */
export async function submitInquiryAction(prevState, formData) {
  const values = {
    name: field(formData, 'name'),
    email: field(formData, 'email'),
    orderId: field(formData, 'orderId'),
    topic: field(formData, 'topic'),
    message: field(formData, 'message'),
  };

  const { valid, errors } = validate(values, {
    name: [(v) => rules.required(v, 'お名前'), (v) => rules.maxLength(v, 60, 'お名前')],
    email: [(v) => rules.required(v, 'メールアドレス'), rules.email],
    topic: [(v) => rules.required(v, 'お問い合わせ種別')],
    message: [
      (v) => rules.required(v, 'お問い合わせ内容'),
      (v) => rules.minLength(v, 10, 'お問い合わせ内容'),
      (v) => rules.maxLength(v, 2000, 'お問い合わせ内容'),
    ],
  });

  if (!valid) {
    return { errors, values };
  }

  try {
    await submitInquiry({
      name: values.name,
      email: values.email,
      /* The Japanese label, not the slug — this is what staff read in
         Admin → Inquiry, and "shipping" tells them nothing. */
      subject: inquiryTopicLabel(values.topic),
      message: values.message,
      orderId: values.orderId,
    });
  } catch (error) {
    logError(error, { action: 'submitInquiryAction', topic: values.topic });
    /* `values` is returned so a failed send does not wipe what they wrote —
       a long enquiry retyped from scratch is how you lose the customer. */
    return { errors: { form: toUserMessage(error) }, values };
  }

  return {
    success:
      'お問い合わせを受け付けました。担当者より、ご入力のメールアドレス宛にご連絡いたします。',
    errors: {},
    values: {},
  };
}
