import styles from './SideBox.module.css';

/**
 * SideBox — one titled box in a page's side column: the category menu,
 * newsletter, login, notices and social accounts beside the FAQ.
 *
 * Plain markup with no hooks, so both Server and Client Components use it.
 *
 * @param {Object} props
 * @param {string} props.id  Unique on the page; the heading's id derives from it
 * @param {string} props.title
 * @param {React.ReactNode} [props.icon]  Decorative drawing before the title
 * @param {boolean} [props.flush]  Drop the body padding — for edge-to-edge lists
 * @param {boolean} [props.allowOverflow]  Let a child escape the box (a flyout)
 * @param {React.ReactNode} props.children
 */
export default function SideBox({
  id,
  title,
  icon,
  flush = false,
  allowOverflow = false,
  children,
}) {
  const headingId = `${id}-title`;

  return (
    <section
      className={allowOverflow ? `${styles.box} ${styles.boxOpen}` : styles.box}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className={styles.heading}>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        {title}
      </h2>
      <div className={flush ? undefined : styles.body}>{children}</div>
    </section>
  );
}
