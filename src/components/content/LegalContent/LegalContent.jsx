import Image from 'next/image';
import Link from 'next/link';

import styles from './LegalContent.module.css';

/**
 * LegalContent — renders an imported long-form document.
 *
 * Named for the policy pages it was built for, and now also renders the
 * お薬ガイド, which has the same shape: headings, prose, lists and ordered
 * steps, read top to bottom. The guide added `figure`, images on a step, and
 * a trailing link on a paragraph; a policy page simply never uses them.
 * A second renderer would have been the same switch statement with three
 * more cases and every existing case duplicated.
 *
 * Takes the same object PageToc takes, so the page, its headings and its
 * contents list cannot drift apart: all three come from one file in
 * `src/content/legal/` or `src/content/guide/`.
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

    /* A labelled-value disclosure — the 特定商取引法 operator table.
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
