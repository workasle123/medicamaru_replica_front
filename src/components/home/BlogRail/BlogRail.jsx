import Link from 'next/link';
import styles from './BlogRail.module.css';
import { formatDate, toIsoDate } from '@/lib/format';

/**
 * BlogRail — health-column teasers.
 *
 * Each card surfaces its last-updated date. For YMYL health content that
 * freshness signal matters to both readers and search engines, and it is one
 * of the clearest gaps in the primary platform's content presentation.
 *
 * @param {Object} props
 * @param {Array} props.posts
 */
export default function BlogRail({ posts = [] }) {
  if (!posts.length) return null;

  return (
    <ul className={styles.rail} role="list">
      {posts.map((post) => {
        const updated = post.updatedAt || post.publishedAt;
        return (
          <li key={post.slug} className={styles.item}>
            <Link href={`/blogs/${post.slug}`} className={styles.card}>
              <span className={styles.meta}>
                <span>{post.category}</span>
                <span aria-hidden="true">・</span>
                <span>約{post.readingMinutes}分で読めます</span>
              </span>

              <span className={styles.title}>{post.title}</span>

              {post.excerpt && (
                <span className={`${styles.excerpt} clamp-2`}>{post.excerpt}</span>
              )}

              <span className={styles.updated}>
                最終更新日：
                <time dateTime={toIsoDate(updated)}>{formatDate(updated)}</time>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
