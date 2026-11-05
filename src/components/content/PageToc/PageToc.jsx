import SideBox from '@/components/sidebar/SideBox/SideBox';
import styles from './PageToc.module.css';

/**
 * PageToc — the contents list for a long policy page.
 *
 * Built from the same `sections` array the page renders, so an entry here
 * always has a heading to jump to. Nothing is hand-listed.
 *
 * Two shapes, because the page has two places to put it:
 *
 *   default      a SideBox for the left column, which ContentPage makes
 *                sticky from 1024px.
 *   collapsible  a closed <details> at the top of the article, shown only on
 *                phones. The side columns render AFTER the article there, so
 *                a contents list in the column would sit below the document
 *                it is meant to introduce. Closed by default — fourteen
 *                entries ahead of the text is a wall, not a shortcut.
 *
 * <details> rather than a button: it opens with no JavaScript, and the
 * keyboard and screen-reader behaviour is the browser's own.
 *
 * Plain anchors, no scroll-spy: these pages are read top to bottom or jumped
 * into once, and a highlight that tracks the scroll needs a Client Component
 * and an observer for no real gain.
 *
 * Server Component.
 *
 * @param {Object} props
 * @param {{id: string, heading: string}[]} props.sections
 * @param {boolean} [props.collapsible]  Phone shape (see above)
 */
export default function PageToc({ sections, collapsible = false }) {
  if (!sections || sections.length === 0) return null;

  /* Both shapes can be on the page at once, so the ids and the landmark
     labels have to differ or the document gets duplicates of each. */
  const scope = collapsible ? 'toc-inline' : 'toc-aside';

  const list = (
    <nav aria-label={collapsible ? 'このページの目次（モバイル）' : 'このページの目次'}>
      <ol className={styles.list}>
        {sections.map((section, i) => (
          <li key={section.id} className={styles.item}>
            <a href={`#${section.id}`} className={styles.link}>
              <span className={styles.number} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.text}>{section.heading}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );

  if (collapsible) {
    return (
      <details className={styles.collapsible} id={scope}>
        <summary className={styles.summary}>
          <span className={styles.summaryLabel}>
            <IconList />
            目次
          </span>
          <span className={styles.count}>{sections.length}項目</span>
        </summary>
        <div className={styles.collapsibleBody}>{list}</div>
      </details>
    );
  }

  return (
    <SideBox id={scope} title="目次" icon={<IconList />}>
      {list}
    </SideBox>
  );
}

function IconList() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  );
}
