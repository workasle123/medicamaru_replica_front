'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './Contact.module.css';
import Field from '@/components/ui/Field/Field';
import Select from '@/components/ui/Select/Select';
import Alert from '@/components/ui/Alert/Alert';
import Button from '@/components/ui/Button/Button';
import RequiredNote from '@/components/ui/RequiredNote/RequiredNote';
import { submitInquiryAction } from './actions';

import { INQUIRY_TOPICS as TOPICS } from '@/constants/contact';

export default function ContactForm() {
  const [state, formAction] = useActionState(submitInquiryAction, { errors: {}, values: {} });
  const errors = state?.errors ?? {};
  const values = state?.values ?? {};

  if (state?.success) {
    return (
      <Alert variant="success" title="送信しました">
        {state.success}
      </Alert>
    );
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      {errors.form && <Alert variant="error">{errors.form}</Alert>}

      <RequiredNote />

      <Field
        id="contact-name"
        name="name"
        label="お名前"
        required
        autoComplete="name"
        defaultValue={values.name}
        error={errors.name}
      />

      <Field
        id="contact-email"
        name="email"
        label="メールアドレス"
        type="email"
        required
        autoComplete="email"
        hint="ご回答をお送りする宛先です。"
        defaultValue={values.email}
        error={errors.email}
      />

      <Field
        id="contact-order"
        name="orderId"
        label="ご注文番号"
        hint="ご注文に関するお問い合わせの場合はご入力ください。（例：MDM-2026-0812）"
        defaultValue={values.orderId}
        error={errors.orderId}
      />

      <Select
        id="contact-topic"
        name="topic"
        label="お問い合わせ種別"
        required
        options={TOPICS}
        defaultValue={values.topic}
        error={errors.topic}
      />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact-message">
          お問い合わせ内容
          <span className={styles.required}>必須</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={8}
          className={`${styles.textarea} ${errors.message ? styles.invalid : ''}`}
          defaultValue={values.message}
          aria-invalid={errors.message ? 'true' : undefined}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
        />
        {errors.message && (
          <p className={styles.error} id="contact-message-error">
            <span aria-hidden="true">⚠</span>
            {errors.message}
          </p>
        )}
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {pending ? '送信しています…' : '送信する'}
    </Button>
  );
}
