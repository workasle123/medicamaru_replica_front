'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './AuthLayout.module.css';
import Alert from '@/components/ui/Alert/Alert';
import Field from '@/components/ui/Field/Field';
import Button from '@/components/ui/Button/Button';
import { resendVerificationAction } from './actions';

/**
 * Request a fresh verification link.
 *
 * Used from two places — the login page when sign-in was refused for an
 * unconfirmed address, and the verify page when a link turned out to be too
 * old. Both pass the address they already know so the customer does not have
 * to retype it; it stays editable because the one they typed at registration
 * may be the thing that was wrong.
 *
 * The confirmation never says whether the address is registered. It cannot:
 * the endpoint answers identically either way, on purpose, so that this form
 * is not a way to ask whether a given person shops here.
 *
 * @param {Object} props
 * @param {string} [props.email]  Prefilled when the caller knows it.
 */
export default function ResendForm({ email = '' }) {
  const [state, formAction] = useActionState(resendVerificationAction, { errors: {} });
  const errors = state.errors ?? {};

  if (state.success) {
    return <Alert variant="success">{state.success}</Alert>;
  }

  return (
    <form action={formAction} className={styles.resendForm} noValidate>
      <p className={styles.resendLead}>確認メールを再送信します。</p>

      <Field
        id="resend-email"
        name="email"
        label="メールアドレス"
        type="email"
        required
        autoComplete="email"
        defaultValue={email}
        error={errors.email}
      />

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} block>
      {pending ? '送信中…' : '確認メールを再送信する'}
    </Button>
  );
}
