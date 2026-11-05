'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from '../AuthLayout.module.css';
import Field from '@/components/ui/Field/Field';
import Alert from '@/components/ui/Alert/Alert';
import ResendForm from '../ResendForm';
import Button from '@/components/ui/Button/Button';
import { loginAction } from '../actions';

/**
 * LoginForm.
 *
 * A Client Component only so it can surface per-field errors and a pending
 * state via useActionState/useFormStatus. The form itself is a real <form>
 * bound to a Server Action, so it still submits and works with JavaScript
 * disabled — the progressive enhancement is the error UI, not the function.
 *
 * @param {Object} props
 * @param {string} [props.next]  Post-login redirect path
 */
export default function LoginForm({ next = '' }) {
  const [state, formAction] = useActionState(loginAction, { errors: {}, values: {} });
  const errors = state?.errors ?? {};
  const values = state?.values ?? {};

  return (
    <form action={formAction} className={styles.form} noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {errors.form && <Alert variant="error">{errors.form}</Alert>}

      {/* Sign-in refused because the address has not been confirmed. The
          password was correct, so a resend is the whole fix — offered right
          here rather than as a link to go and find. */}
      {state.unverifiedEmail && <ResendForm email={state.unverifiedEmail} />}

      <Field
        id="login-email"
        name="email"
        label="メールアドレス"
        type="email"
        required
        autoComplete="email"
        defaultValue={values.email}
        error={errors.email}
      />

      <Field
        id="login-password"
        name="password"
        label="パスワード"
        type="password"
        required
        autoComplete="current-password"
        error={errors.password}
      />

      <div className={styles.actions}>
        <SubmitButton />
      </div>
    </form>
  );
}

/** Split out because useFormStatus must be called inside the <form>. */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {pending ? 'ログインしています…' : 'ログイン'}
    </Button>
  );
}
