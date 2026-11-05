'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './AuthLayout.module.css';
import Field from '@/components/ui/Field/Field';
import Alert from '@/components/ui/Alert/Alert';
import Button from '@/components/ui/Button/Button';

/**
 * Choose-a-password step behind an emailed link — shared by /register/confirm
 * (a guest finishing registration) and /reset-password. Both carry the link's
 * token as a hidden field and hand it, with the new password, to `action`.
 *
 * @param {{
 *   action: Function,
 *   token: string,
 *   submitLabel: string,
 *   pendingLabel: string,
 * }} props
 */
export default function SetPasswordForm({ action, token, submitLabel, pendingLabel }) {
  const [state, formAction] = useActionState(action, { errors: {} });
  const errors = state?.errors ?? {};

  return (
    <form action={formAction} className={styles.form} noValidate>
      {errors.form && <Alert variant="error">{errors.form}</Alert>}

      <input type="hidden" name="token" value={token} />

      <Field
        id="new-password"
        name="password"
        label="新しいパスワード"
        type="password"
        required
        autoComplete="new-password"
        hint="8文字以上で、英字と数字を組み合わせてください。"
        error={errors.password}
      />

      <Field
        id="new-password-again"
        name="passwordConfirm"
        label="新しいパスワード（確認）"
        type="password"
        required
        autoComplete="new-password"
        error={errors.passwordConfirm}
      />

      <div className={styles.actions}>
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
      </div>
    </form>
  );
}

function SubmitButton({ label, pendingLabel }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
