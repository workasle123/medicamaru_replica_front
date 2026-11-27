import Image from 'next/image';
import Link from 'next/link';

import styles from './LegalContent.module.css';

/**
 * LegalContent — renders an imported long-form document.
 *
 * Named for the policy pages it renders: headings, prose, lists and ordered
 * steps, read top to bottom. A second renderer would have been the same
 * switch statement with three more cases and every existing case duplicated.
 *
 * Takes the same object PageToc takes, so the page, its headings and its
 * contents list cannot drift apart: all three come from one file in
 * `src/content/legal/`.
 *
 * The headings are styled HERE rather than through ContentPage's `.body h2`,
 * because that selector also dresses the FAQ and notice pages — a banded
 * heading is right for a long document you scan, and wrong above a two-line
 * answer.
 *
 * Server Component.
 *
 * @param {Object} props
 * @param {{
 *   intro?: Block[],
 *   sections: {id: string, heading: string, blocks: Block[]}[],
 * }} props.content
 */
export default function LegalContent({ content }) {
  const { intro = [], sections = [] } = content;

  return (
    <div className={styles.doc}>
      {intro.length > 0 && <div className={styles.intro}>{intro.map(renderBlock)}</div>}

      {sections.map((section) => (
        <section key={section.id} className={styles.section}>
          {/* The id is the anchor PageToc links to. scroll-margin-top lives in
              the stylesheet so the sticky header does not cover it. */}
          <h2 id={section.id} className={styles.heading}>
            {section.heading}
          </h2>
          {section.blocks.map(renderBlock)}
        </section>
      ))}
    </div>
  );
}

function renderBlock(block, i) {
  const key = `${block.type}-${i}`;

  switch (block.type) {
    case 'h3':
      return (
        <h3 key={key} className={styles.subheading}>
          {block.text}
        </h3>
      );

    case 'list':
      return (
        <ul key={key} className={styles.list}>
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      );

    /* A numbered sequence — the steps in 個人輸入のご利用の流れ. An <ol> so the
       order is carried by the markup rather than by digits typed into the
       text, which screen readers announce as part of the sentence.

       An item is a string, or `{text, image}` when the step has a screenshot
       of the thing it describes. The image sits inside the <li> so it stays
       attached to its own step when the list reflows. */
    case 'steps':
      return (
        <ol key={key} className={styles.steps}>
          {block.items.map((item, j) =>
            typeof item === 'string' ? (
              <li key={j}>{item}</li>
            ) : (
              <li key={j}>
                <span className={styles.stepText}>{item.text}</span>
                {item.image && <Figure {...item.image} inStep />}
              </li>
            )
          )}
        </ol>
      );

    /* A screenshot of the shop, with a caption.
       next/image rather than <img>: these are 1,400px captures shown in a
       ~700px column, and the optimiser is what stops every reader paying for
       the full file. Width and height come from the content file so the space
       is reserved before the image arrives — a guide this long would
       otherwise shift under the reader eight times on the way down. */
    case 'figure':
      return <Figure key={key} {...block} />;

    /* A labelled-value list. It carried the 特定商取引法 operator details
       until those moved into the `table` block below (2026-11-27).
       A <dl> rather than a <table>: these are pairs, not a grid, and two
       columns with no header row is a layout table wearing data markup. The
       pairs stack on a phone, where a 2-column table would either scroll
       sideways or crush the labels.

       `href` makes the value a link — the website and the support address are
       the two a customer is meant to act on. */
    case 'definitions':
      return (
        <dl key={key} className={styles.definitions}>
          {block.items.map((item, j) => (
            <div key={j} className={styles.definitionRow}>
              <dt className={styles.definitionLabel}>{item.label}</dt>
              <dd className={styles.definitionValue}>
                {item.href ? <a href={item.href}>{item.value}</a> : item.value}
              </dd>
            </div>
          ))}
        </dl>
      );

    /* A labelled table in groups — the 特定商取引法に基づく表示, laid out
       the way kaigai-okusuri-tsuhan.com/shipping lays out the same
       disclosure: a band per group, then label / value rows.

       A real <table> this time, where `definitions` above chose a <dl>. Thirty
       rows in six groups is a document a payment-gateway reviewer scans as a
       grid, and the row and group headers are what let a screen reader say
       which group a row belongs to. It stays a table on a phone too — the
       label column just narrows — because restyling table elements as blocks
       makes Safari drop the table from the accessibility tree.

       A value is a string, or an array of lines; a line is a string or
       `{text, href}`. Links get a line of their own rather than markup inside
       a sentence, for the reason the paragraph case gives below. */
    case 'table':
      return (
        <div key={key} className={styles.tableWrap}>
          <table className={styles.table}>
            {block.caption && <caption className="visually-hidden">{block.caption}</caption>}
            {/* Widths on <col>, for table-layout: fixed — without it the
                label column grows to its longest label and takes half a
                phone screen. */}
            <colgroup>
              <col className={styles.tableLabelCol} />
              <col />
            </colgroup>
            {block.groups.map((group) => (
              <tbody key={group.heading}>
                <tr>
                  <th colSpan={2} scope="rowgroup" className={styles.tableGroup}>
                    {group.heading}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className={styles.tableLabel}>
                      {row.label}
                    </th>
                    <td className={styles.tableValue}>
                      {(Array.isArray(row.value) ? row.value : [row.value]).map((line, j) => (
                        <p key={j} className={styles.tableLine}>
                          {typeof line === 'string' ? line : <CellLink {...line} />}
                        </p>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      );

    default:
      return (
        <p key={key} className={styles.paragraph}>
          {block.text}
          {/* A trailing internal link, for the places the guide points at a
              policy page. One link per paragraph rather than markup inside
              the sentence: the content files are plain data, and parsing
              link syntax out of prose is how a stray bracket becomes a
              broken page. */}
          {block.link && (
            <>
              {' '}
              <Link href={block.link.href} className={styles.inlineLink}>
                {block.link.label}
              </Link>
            </>
          )}
        </p>
      );
  }
}

/**
 * A link on its own line in a table cell. A page of this site goes through
 * <Link> — without prefetch, which on a page of thirty rows would be a burst
 * of requests nobody asked for — and a mail or outside address is a plain
 * anchor.
 */
function CellLink({ text, href }) {
  return href.startsWith('/') ? (
    <Link href={href} prefetch={false} className={styles.inlineLink}>
      {text}
    </Link>
  ) : (
    <a href={href} className={styles.inlineLink}>
      {text}
    </a>
  );
}

/**
 * One screenshot with its caption.
 *
 * `sizes` describes the article column, not the viewport: the measure caps
 * at about 700px however wide the window is, so without this the optimiser
 * would serve a 1,400px file to a desktop that paints it at 700.
 */
function Figure({ src, alt, width, height, caption, inStep = false }) {
  return (
    <figure className={`${styles.figure} ${inStep ? styles.figureInStep : ''}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 767px) 100vw, 700px"
        className={styles.figureImage}
      />
      {caption && <figcaption className={styles.figureCaption}>{caption}</figcaption>}
    </figure>
  );
}
