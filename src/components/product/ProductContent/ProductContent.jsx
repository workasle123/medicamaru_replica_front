import styles from './ProductContent.module.css';

/**
 * ProductContent — the long-form body sections of a product page.
 *
 * Each block becomes an <h2> inside its own anchored <section>, so the heading
 * hierarchy stays correct and every section is a crawlable jump target.
 *
 * ⚠️ `block.html` must ALREADY be sanitised. The page runs it through
 * `sanitizeWithHeadingAnchors`, which both cleans it and adds an id to every
 * heading inside so the table of contents can link to them — doing that here
 * would leave the page with no way to see the headings it needs to list.
 * There is exactly one caller; this is not a general-purpose renderer.
 *
 * @param {Object} props
 * @param {{id: string, heading: string, html: string}[]} props.blocks
 */
export default function ProductContent({ blocks = [] }) {
  if (!blocks.length) return null;

  return (
    <>
      {blocks.map((block) => (
        <section key={block.id} id={block.id} className={styles.section}>
          {/* Only when the block actually names itself. A product description
              now brings its own h2s, so the one this used to print
              unconditionally doubled up on the first of them. An empty <h2>
              is worse than none: it is a landmark announcing nothing. */}
          {block.heading && <h2 className={styles.sectionTitle}>{block.heading}</h2>}
          <div
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: block.html }}
          />
        </section>
      ))}
    </>
  );
}
