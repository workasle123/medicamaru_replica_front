import styles from './Skeleton.module.css';

/**
 * Medicamaru — skeleton primitives.
 *
 * Three pieces, and nothing route-specific:
 *
 *   Skeleton        one grey block
 *   SkeletonText    a stack of them, shaped like a paragraph
 *   SkeletonScreen  the announcement wrapper every `loading.js` opens with
 *
 * Server Components. A loading state that needs JavaScript to appear is no
 * loading state at all — these are streamed as HTML before the page's own
 * bundle has been asked for.
 *
 * Route-shaped skeletons live in `src/components/skeleton/` and are built out
 * of these, reusing the real page's CSS module for their geometry.
 */

/**
 * One block.
 *
 * `width`/`height` take any CSS length. A bare number is read as pixels,
 * which is what React does with `style` anyway — stated here so a caller can
 * pass `height={14}` without wondering.
 *
 * @param {Object} props
 * @param {string} [props.as='span'] Element to render. `span` by default so
 *   dropping one inside a paragraph or a heading stays valid markup.
 * @param {string|number} [props.width]
 * @param {string|number} [props.height]
 * @param {string} [props.radius] A --radius-* value, or any CSS length.
 * @param {boolean} [props.circle] Equal sides and a full radius — avatars,
 *   icon buttons, step dots.
 * @param {string} [props.className]
 * @param {Object} [props.style]
 */
export default function Skeleton({
  as: Tag = 'span',
  width,
  height,
  radius,
  circle = false,
  className = '',
  style,
  ...rest
}) {
  const size = circle ? (width ?? height) : undefined;

  return (
    <Tag
      /* Decorative, every one of them. A block has no text, so there is
         nothing for a screen reader to read out of it — but a page full of
         empty boxes still lands in the accessibility tree as a pile of
         anonymous elements to step through.

         Hidden HERE, on the block, rather than over the whole fallback. A
         `loading.js` may well state the real page title or the real heading
         while it waits, and hiding the lot would take those with it — and
         leave any link inside focusable but unreadable, which is worse than
         either. */
      aria-hidden="true"
      className={`${styles.block} ${className}`.trim()}
      style={{
        width: circle ? size : width,
        height: circle ? size : height,
        borderRadius: circle ? '50%' : radius,
        ...style,
      }}
      {...rest}
    />
  );
}

/**
 * A paragraph's worth of blocks, the last one short.
 *
 * @param {Object} props
 * @param {number} [props.lines=3]
 * @param {string|number} [props.height='0.75rem']
 * @param {boolean} [props.lastShort=true] Set false for a list of rows, where
 *   every line should be the same length.
 * @param {string} [props.className]
 */
export function SkeletonText({
  lines = 3,
  height = '0.75rem',
  lastShort = true,
  className = '',
}) {
  return (
    <span className={`${styles.text} ${className}`.trim()}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height={height}
          className={lastShort && i === lines - 1 ? styles.textLast : undefined}
        />
      ))}
    </span>
  );
}

/**
 * The wrapper every `loading.js` opens with.
 *
 * One job: say that something is happening. `role="status"` with a
 * visually-hidden label, so a screen reader hears 「読み込み中です」 rather than
 * nothing at all while blocks it cannot see sweep away.
 *
 * It does NOT hide its children. The blocks hide themselves — see the
 * `aria-hidden` on Skeleton above — which leaves a fallback free to state
 * whatever the page already knows. The category index can say 「カテゴリーから
 * 探す」 and the confirmation page can say 「ご注文ありがとうございます」 the
 * moment it renders, because neither of those sentences is waiting on data.
 *
 * No wrapper element: the role sits on the hidden label itself and the
 * children are returned beside it. `display: contents` would have done the
 * same job for layout, but an element carrying a role is exactly the case
 * where browsers have historically dropped a `display: contents` node out of
 * the accessibility tree — which would have silently lost the one thing this
 * component exists for.
 *
 * @param {Object} props
 * @param {string} [props.label='読み込み中です']
 * @param {React.ReactNode} props.children
 */
export function SkeletonScreen({ label = '読み込み中です', children }) {
  return (
    <>
      <span className="visually-hidden" role="status" aria-busy="true">
        {label}
      </span>
      {children}
    </>
  );
}
