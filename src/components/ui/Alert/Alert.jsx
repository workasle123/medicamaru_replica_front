import styles from './Alert.module.css';

/**
 * Alert — inline status message.
 *
 * Errors use role="alert" so assistive technology announces them when a form
 * re-renders after a failed submission. Non-errors use role="status", which
 * announces politely without interrupting.
 *
 * @param {Object} props
 * @param {'error'|'success'|'info'|'warning'} [props.variant]
 * @param {string} [props.title]
 * @param {React.ReactNode} props.children
 */
export default function Alert({ variant = 'info', title, children }) {
  return (
    <div
      className={`${styles.alert} ${styles[variant]}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <span className={styles.icon} aria-hidden="true">
        {variant === 'error' ? '⚠' : variant === 'success' ? '✓' : 'ⓘ'}
      </span>
      <div>
        {title && <p className={styles.title}>{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
