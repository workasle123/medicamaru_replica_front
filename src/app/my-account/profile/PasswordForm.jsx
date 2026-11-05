'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from '../AccountLayout.module.css';
import Alert from '@/components/ui/Alert/Alert';
import Field from '@/components/ui/Field/Field';
import Button from '@/components/ui/Button/Button';
import { changePasswordAction } from './actions';

/**
 * Change the password.
 *
 * Asks for the current one, which the backend verifies. That is what stops a
 * session someone walked away from being turned into a locked-out account.
 *
 * Nothing is echoed back into the fields, on success OR on failure — unlike
 * the details form above, which returns what was typed so a long edit is not
 * lost. A password returned to the client would sit in the state React hands
 * to the next render, and retyping three short fields is a smaller cost than
 * that.
 */
export default function PasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, { errors: {} });
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className={styles.profileForm} noValidate>
      {errors.form && <Alert variant="error">{errors.form}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}

      <Field
        id="currentPassword"
        name="currentPassword"
        label="現在のパスワード"
        type="password"
        required
        autoComplete="current-password"
        error={errors.currentPassword}
      />

      <Field
        id="newPassword"
        name="newPassword"
        label="新しいパスワード"
        type="password"
        required
        autoComplete="new-password"
        hint="6文字以上でご入力ください。"
        error={errors.newPassword}
      />

      <Field
        id="confirmPassword"
        name="confirmPassword"
        label="新しいパスワード（確認）"
        type="password"
        required
        autoComplete="new-password"
        error={errors.confirmPassword}
      />

      <div className={styles.profileActions}>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? '変更中…' : 'パスワードを変更する'}
    </Button>
  );
}
