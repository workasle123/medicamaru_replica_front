import Link from 'next/link';
import styles from './Button.module.css';

/**
 * Button — renders a <button>, or a <Link> when `href` is supplied.
 *
 * Server Component. It carries no state, so nothing here needs "use client";
 * an onClick handler is only valid when this is used inside a Client
 * Component tree.
 *
 * @param {Object} props
 * @param {'primary'|'secondary'|'outline'|'ghost'|'quiet'} [props.variant]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {boolean} [props.block]   Full width
 * @param {string} [props.href]     Renders a link instead of a button
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  href,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    block ? styles.block : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
