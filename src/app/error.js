'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button/Button';
import styles from './StatusPage.module.css';

/**
 * Route-level error boundary.
 *
 * Must be a Client Component — that is a Next.js requirement for error
 * boundaries, not a stylistic choice.
 *
 * The customer sees a plain Japanese message. The technical detail goes to
 * the console (and, later, to an error reporter) so debugging stays possible
 * without leaking internals into the UI (brief §16).
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[medicamaru] route error', error);
  }, [error]);

  return (
    <div className="container section">
      <div className={styles.panel}>
        <h1>問題が発生しました</h1>
        <p className={styles.lead}>
          一時的な問題により、ページを表示できませんでした。
          お手数ですが、もう一度お試しください。
        </p>

        <div className={styles.actions}>
          <Button onClick={reset}>もう一度読み込む</Button>
          <Button href="/" variant="outline">ホームへ戻る</Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <pre className={styles.trace}>{error?.stack || error?.message}</pre>
        )}
      </div>
    </div>
  );
}
