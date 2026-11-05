'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from '../AuthLayout.module.css';
import Field from '@/components/ui/Field/Field';
import Alert from '@/components/ui/Alert/Alert';
import Button from '@/components/ui/Button/Button';
import { forgotPasswordAction } from '../actions';

/**
 * ForgotPasswordForm.
 *
 * The success message is identical whether or not the address has an
 * account. Anything else turns this form into an account-enumeration oracle.
 */
export default function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, { errors: {}, values: {} });
  const errors = state?.errors ?? {};

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

      <Field
        id="forgot-email"
        name="email"
        label="メールアドレス"
        type="email"
        required
        autoComplete="email"
        hint="ご登録のメールアドレス宛に、再設定用のご案内をお送りします。"
        defaultValue={state?.values?.email}
        error={errors.email}
      />

      <div className={styles.actions}>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {pending ? '送信しています…' : '再設定メールを送信する'}
    </Button>
  );
}
