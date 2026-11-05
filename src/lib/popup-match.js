/**
 * Does this path match a popup's targeting patterns?
 *
 * The admin writes patterns rather than ticking a fixed list of page types,
 * so a page added next year needs no migration and no developer. The cost is
 * this file: a tiny matcher that has to behave exactly as the help text under
 * the field claims, because nobody editing a campaign at 9pm is going to read
 * the source to find out what `/product/*` means.
 *
 * The rules, in full:
 *
 *   *             every page
 *   /             the top page, and nothing else
 *   /campaign     that page AND everything under it
 *   /product/[*]  everything under /product, but not /product itself
 *   /a/[*]/c      one segment in the middle
 *
 * (The brackets above are only there to keep a star-slash out of this
 * comment; what you type in the admin is a bare star.)
 *
 * A BARE PATH COVERS ITS SUBTREE, and that is load-bearing rather than
 * convenient. The default exclusion list is the checkout funnel — /cart,
 * /checkout, /my-account — and under exact matching every one of them would
 * have leaked: /my-account/orders is a different path from /my-account, so a
 * campaign popup would have appeared over a customer's order history while
 * the admin screen said it was excluded. It is also the rule the hardcoded
 * registration popup has always used (BLOCKED_PATHS in constants/
 * register-offer.js), so the two popups cannot disagree about where they are
 * unwelcome.
 *
 * `/` is the one exception: read as a subtree it would mean the whole site,
 * so it means the top page alone.
 *
 * Trailing slashes and query strings are ignored; matching is case-sensitive
 * because the routes are.
 */

/**
 * Strip everything that is not the path, and the trailing slash with it.
 *
 * `/campaign/` and `/campaign?utm_source=line` are the same page as
 * `/campaign`, and an admin who typed the plain form means all three.
 */
export function normalisePath(input) {
  let path = String(input ?? '');

  /* A full URL may arrive from a caller passing location.href. */
  const protocolEnd = path.indexOf('://');
  if (protocolEnd !== -1) {
    const afterHost = path.indexOf('/', protocolEnd + 3);
    path = afterHost === -1 ? '/' : path.slice(afterHost);
  }

  path = path.split('?')[0].split('#')[0];

  if (!path.startsWith('/')) path = `/${path}`;

  /* The root must stay '/', so this cannot be a plain rtrim. */
  while (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

  return path;
}

/**
 * One pattern against one already-normalised path.
 *
 * A bare path matches itself and its subtree; a trailing slash-star matches
 * the subtree only. Both reach any depth — staff writing "product pages"
 * should not have to add a line per level. A star anywhere else matches
 * within a single segment, which is what makes a middle-of-the-path pattern
 * useful.
 */
function matchesPattern(path, pattern) {
  if (pattern === '*') return true;
  if (!pattern) return false;

  if (pattern === '/') return path === '/';

  if (pattern.endsWith('/*')) {
    /* Subtree ONLY — the parent page itself is excluded. This is the one way
       to say "every product page but not the product index". */
    return path.startsWith(`${pattern.slice(0, -2)}/`);
  }

  if (pattern.includes('*')) {
    const escaped = pattern
      .split('*')
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('[^/]*');
    return new RegExp(`^${escaped}$`).test(path);
  }

  /* Bare path: the page and everything beneath it. See the header — the
     checkout exclusions depend on this, and `/my-account` has to cover
     `/my-account/orders` or the default list silently fails to protect
     anything but its own top page. */
  return path === pattern || path.startsWith(`${pattern}/`);
}

/**
 * Should this popup show on this path?
 *
 * Excludes are checked LAST and win outright. That ordering is the whole
 * reason the two fields exist rather than one: "everywhere except the
 * checkout" is the common case, and expressing it as an include list would
 * mean enumerating the site.
 *
 * A popup with no include patterns matches nothing. The field is required in
 * the admin, so this only happens to a row whose patterns were all blank —
 * and silence is the right answer to "show this nowhere".
 */
export function popupMatchesPath(popup, rawPath) {
  const path = normalisePath(rawPath);

  const includes = popup?.includePaths ?? [];
  const excludes = popup?.excludePaths ?? [];

  if (!includes.some((pattern) => matchesPattern(path, pattern))) return false;
  if (excludes.some((pattern) => matchesPattern(path, pattern))) return false;

  return true;
}

/**
 * The popup to show on this path, or null.
 *
 * The list arrives already ordered by priority then recency (Popup::scopeLive),
 * so the first match IS the winner — the ordering rule lives in one place, in
 * SQL, rather than being half here and half there.
 */
export function pickPopup(popups, rawPath) {
  const path = normalisePath(rawPath);
  return (popups ?? []).find((popup) => popupMatchesPath(popup, path)) ?? null;
}
