/**
 * The LINE app mark — green squircle, white speech bubble, LINE wordmark.
 *
 * Full colour, unlike the monochrome bubble in SocialIcon. That one is right
 * in the footer, where every social mark is drawn in one ink so the row reads
 * as a set. In the header the LINE link stands alone, and a 22px monochrome
 * speech bubble is not recognisable as LINE — the green is what identifies it.
 *
 * Drawn rather than shipped as a file: it renders crisply at any size, needs
 * no extra request, and cannot arrive with a matted background. (The PNG most
 * "LINE logo" search results give you is a JPEG with the transparency
 * checkerboard baked in as grey squares.)
 *
 * Decorative by default — every caller labels its own link. Pass a `title`
 * only where the mark is the sole content of a control.
 *
 * @param {{size?: number, title?: string}} props
 */
export default function LineMark({ size = 22, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}

      {/* Squircle. rx is ~23% of the side, which is what the app icon uses. */}
      <rect width="48" height="48" rx="11" fill="#06C755" />

      {/* Bubble and its tail, drawn as two shapes so the tail's angle can be
          adjusted without reshaping the body. */}
      <ellipse cx="24" cy="21" rx="15" ry="12.5" fill="#FFFFFF" />
      <path d="M20.6 31.4 17.4 39.6c-.3.9.5 1.4 1.2.9l7.6-6z" fill="#FFFFFF" />

      {/* L I N E, as paths rather than text: a <text> element would depend on
          whatever font happens to be installed, and the wordmark would change
          shape from machine to machine. */}
      <g fill="#06C755">
        <path d="M12 16h2v8h3.5v2H12z" />
        <path d="M18.5 16h2v10h-2z" />
        <path d="M22.5 16h1.9l3.6 6.4V16h1.9v10H28l-3.6-6.4V26h-1.9z" />
        <path d="M31.5 16h4.8v2h-2.9v2H36v2h-2.6v2h2.9v2h-4.8z" />
      </g>
    </svg>
  );
}
