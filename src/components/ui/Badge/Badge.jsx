import styles from './Badge.module.css';

/**
 * Badge — compact status or label chip.
 *
 * @param {Object} props
 * @param {'sale'|'highlight'|'inStock'|'outOfStock'|'neutral'|'info'|'brand'|'warning'} [props.variant]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export default function Badge({ variant = 'neutral', className = '', children, ...rest }) {
  return (
    <span className={[styles.badge, styles[variant], className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}
