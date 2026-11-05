'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import SideBox from '../SideBox/SideBox';
import { IconMail } from '../icons';
import Field from '@/components/ui/Field/Field';
import Alert from '@/components/ui/Alert/Alert';
import Button from '@/components/ui/Button/Button';
import { subscribeAction } from './actions';
import styles from './NewsletterSignup.module.css';

/**
 * NewsletterSignup — the メールマガジン box. Sign-ups go to POST /api/subscribe
 * and appear under Admin → Newsletter.
 *
 * A real <form> bound to a Server Action, so it submits without JavaScript;
 * the client side only adds the inline errors and the pending state.
 */
export default function NewsletterSignup() {
  const [state, formAction] = useActionState(subscribeAction, { errors: {}, values: {} });
  const errors = state?.errors ?? {};
  const values = state?.values ?? {};

  return (
    <SideBox id="side-newsletter" title="メールマガジン" icon={<IconMail />}>
      {state?.success ? (
        <Alert variant="success">{state.success}</Alert>
      ) : (
        <form action={formAction} className={styles.form} noValidate>
          <p className={styles.lead}>新商品やキャンペーンのお知らせをメールでお届けします。</p>

          {errors.form && <Alert variant="error">{errors.form}</Alert>}

          <Field
            id="newsletter-email"
            name="email"
            label="メールアドレス"
            type="email"
            required
            autoComplete="email"
            defaultValue={values.email}
            error={errors.email}
          />

          <SubmitButton />

          <p className={styles.note}>配信はいつでも停止できます。</p>
        </form>
      )}
    </SideBox>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" block disabled={pending}>
      {pending ? '登録しています…' : '登録する'}
    </Button>
  );
}
