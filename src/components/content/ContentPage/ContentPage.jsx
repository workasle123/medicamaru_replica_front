import styles from './ContentPage.module.css';
import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import { formatDate, toIsoDate } from '@/lib/format';

/**
 * ContentPage — shared shell for informational and legal pages.
 *
 * Centralises the heading, measure, breadcrumbs and last-updated stamp so
 * every content page is consistent and none of them forget the freshness
 * signal, which matters for YMYL content.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.lead]
 * @param {string} [props.updatedAt] ISO date
 * @param {React.ReactNode} [props.meta] A line under the title — a notice's date
 * @param {{name: string, href?: string}[]} [props.breadcrumbs]
 * @param {{label: string, content: React.ReactNode, phone?: boolean}} [props.start]
 *   Left-hand side column. Giving either side column widens the page to three
 *   columns, the article still held to a readable measure in the middle.
 *   `phone: false` leaves the column out below 768px.
 * @param {{label: string, content: React.ReactNode, phone?: boolean}} [props.end]
 *   Right-hand side column.
 * @param {boolean} [props.centerHeader]  Centre the title and lead. Opt-in:
 *   it suits a short standalone page like the contact form, but a centred
 *   heading over several screens of terms or FAQ reads as decoration and
 *   loses the left edge the eye scans down.
 * @param {boolean} [props.fitTitle]  Shrink the title on narrow screens so it
 *   stays on one line. Opt-in: nearly every title here is short enough
 *   already, and scaling them all down to rescue the one long one would make
 *   the rest smaller for no reason. Budgeted for about thirteen full-width
 *   characters.
 * @param {React.ReactNode} props.children
 */
export default function ContentPage({
  title,
  lead,
  updatedAt,
  breadcrumbs = [],
  meta,
  start,
  end,
  centerHeader = false,
  fitTitle = false,
  children,
}) {
  const crumbs = <Breadcrumbs items={breadcrumbs.length ? breadcrumbs : [{ name: title }]} />;

  const article = (
    <article className={styles.page}>
      <header className={`${styles.header} ${centerHeader ? styles.headerCentered : ''}`}>
        <h1 className={`${styles.title} ${fitTitle ? styles.titleFit : ''}`}>{title}</h1>
        {meta && <p className={styles.meta}>{meta}</p>}
        {lead && <p className={styles.lead}>{lead}</p>}
        {updatedAt && (
          <p className={styles.updated}>
            最終更新日：
            <time dateTime={toIsoDate(updatedAt)}>{formatDate(updatedAt)}</time>
          </p>
        )}
      </header>

      <div className={styles.body}>{children}</div>
    </article>
  );

  if (!start && !end) {
    return (
      <div className="container">
        <div className={styles.column}>
          {crumbs}
          {article}
        </div>
      </div>
    );
  }

  /* The article comes first in the source, so on a phone — one column — the
     page opens on its own content and the side columns follow it. From 1024px
     the grid puts it back in the middle. */
  /* `sticky` belongs on the grid ITEM, not on anything inside it: the item's
     containing block is the full-height grid area, while the aside itself is
     only as tall as its boxes (align-items: start). Sticking an inner element
     gives it the aside's few spare pixels to travel and looks broken. */
  const asideClass = (side, base) =>
    [base, side.phone === false && styles.notOnPhone, side.sticky && styles.stickyAside]
      .filter(Boolean)
      .join(' ');

  return (
    <div className="container">
      <div className={styles.wide}>
        {crumbs}
        {/* With only one side column the opposite gutter still exists, and at
            its own width the article ends up 40px off centre. `oneSide` makes
            the two gutters equal so the reading column sits in the middle,
            which is the point of giving a document a contents list rather
            than shoving it to one side. */}
        <div className={`${styles.threeCol} ${start && !end ? styles.oneSide : ''}`}>
          <div className={styles.main}>{article}</div>
          {start && (
            <aside className={asideClass(start, styles.start)} aria-label={start.label}>
              {start.content}
            </aside>
          )}
          {end && (
            <aside className={asideClass(end, styles.end)} aria-label={end.label}>
              {end.content}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export { styles as contentStyles };
