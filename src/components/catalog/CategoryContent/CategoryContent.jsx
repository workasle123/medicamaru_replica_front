import styles from './CategoryContent.module.css';
import FaqList from '@/components/product/FaqList/FaqList';
import { sanitizeHtml } from '@/lib/sanitize';
import { formatDate, toIsoDate } from '@/lib/format';

/**
 * CategoryContent — the editorial block beneath a category's product grid.
 *
 * Mirrors how the source platform builds category pages: products first, then
 * long-form content with a medical-supervision byline, comparison tables and
 * an FAQ. That content is the reason those pages rank, so it is treated as
 * primary content rather than filler.
 *
 * Renders nothing when a category has no editorial copy, so categories that
 * are just a product grid stay clean.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Category} props.category
 */
export default function CategoryContent({ category }) {
  const blocks = category?.content ?? [];
  const faqs = category?.faqs ?? [];

  if (!blocks.length && !faqs.length) return null;

  const showByline = Boolean(category.supervisedBy || category.updatedAt);

  return (
    <div className={styles.wrap}>
      {showByline && (
        <p className={styles.byline}>
          {category.supervisedBy && (
            <span>
              <span className={styles.bylineLabel}>医学的監修：</span>
              {category.supervisedBy}
            </span>
          )}
          {category.updatedAt && (
            <span>
              <span className={styles.bylineLabel}>最終更新日：</span>
              <time dateTime={toIsoDate(category.updatedAt)}>
                {formatDate(category.updatedAt)}
              </time>
            </span>
          )}
        </p>
      )}

      <div className={styles.body}>
        {blocks.map((block) => (
          <section key={block.id} id={block.id} className={styles.section}>
            <h2 className={styles.sectionTitle}>{block.heading}</h2>
            <div
              className={styles.html}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html) }}
            />
          </section>
        ))}

        <FaqList
          faqs={faqs}
          id="category-faq"
          title={`${category.name}に関するよくあるご質問`}
        />
      </div>
    </div>
  );
}
