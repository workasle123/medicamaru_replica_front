import styles from './EmptyState.module.css';
import Button from '@/components/ui/Button/Button';

/**
 * EmptyState — the shared "nothing here" surface.
 *
 * An empty result must always offer a way forward. A dead end with no next
 * action is the most common failure in the reference sites' search UX.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.body]
 * @param {string} [props.actionHref]
 * @param {string} [props.actionLabel]
 */
export default function EmptyState({ title, body, actionHref, actionLabel }) {
  return (
    <div className={styles.empty}>
      <div className={styles.icon} aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </div>

      <p className={styles.title}>{title}</p>
      {body && <p className={styles.body}>{body}</p>}

      {actionHref && actionLabel && (
        <div className={styles.action}>
          <Button href={actionHref} variant="outline">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
