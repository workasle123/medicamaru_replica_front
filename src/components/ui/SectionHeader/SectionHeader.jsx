import Link from 'next/link';
import styles from './SectionHeader.module.css';

/**
 * SectionHeader — consistent heading for homepage and listing sections.
 *
 * `as` keeps the heading hierarchy correct per page: the homepage h1 is the
 * hero, so its sections are h2s, while a listing page may need h2s under a
 * different h1. Semantics are never sacrificed for visual size.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {string} [props.href]      "See all" destination
 * @param {string} [props.linkLabel]
 * @param {'h2'|'h3'} [props.as]
 */
export default function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = 'すべて見る',
  as: Tag = 'h2',
}) {
  return (
    <div className={styles.header}>
      <div className={styles.titleGroup}>
        <Tag className={styles.title}>{title}</Tag>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {href && (
        <Link href={href} className={styles.link}>
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
