/**
 * Medicamaru — HTML sanitisation for admin-authored content.
 *
 * Product body copy and blog articles come out of the admin panel's rich-text
 * editor as HTML, and end up in `dangerouslySetInnerHTML`. Anything stored in
 * that editor is therefore a stored-XSS vector if the admin account is ever
 * compromised or the editor allows raw HTML (risk R8, Phase 0).
 *
 * ⚠️ THIS IS AN ALLOW-LIST STRIPPER, NOT A FULL SANITISER.
 * It removes script/style/iframe/object/embed, event handlers, and
 * javascript: URLs — which covers the realistic cases for trusted-but-
 * fallible admin content. It has NOT been audited against the full range of
 * mXSS and parser-confusion attacks.
 *
 * Before launch, replace this with a vetted library — `isomorphic-dompurify`
 * is the usual choice — and run it server-side. Do not treat this file as
 * sufficient protection for untrusted input. Tracked in Phase 12.
 */

import { SITE } from '@/constants/site';

const BLOCK_TAGS = /<\s*(script|style|iframe|object|embed|form|input|link|meta|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const BLOCK_SELF_CLOSING = /<\s*(script|style|iframe|object|embed|form|input|link|meta|base)\b[^>]*\/?>/gi;
const EVENT_HANDLERS = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

/**
 * Inline style attributes are stripped so CMS copy inherits the design
 * system instead of carrying another site's palette with it.
 *
 * This is not only cosmetic. The catalogue was cloned from the source
 * platform, and its product copy is full of `style="color:#d35400"` — 84
 * such spans on a single product page — which measured 4.02:1 against our
 * background and failed WCAG AA. Colour chosen in a rich-text editor cannot
 * be contrast-checked at authoring time, so the safe policy is that content
 * supplies structure and the stylesheet supplies colour.
 */
const STYLE_ATTR = /\sstyle\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URLS = /\s(?:href|src|xlink:href)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]*)/gi;
const DATA_URLS = /\s(?:href|src)\s*=\s*(?:"\s*data:(?!image\/)[^"]*"|'\s*data:(?!image\/)[^']*')/gi;

/**
 * @param {string} html
 * @returns {string}
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string' || !html) return '';

  return html
    .replace(BLOCK_TAGS, '')
    .replace(BLOCK_SELF_CLOSING, '')
    .replace(EVENT_HANDLERS, '')
    .replace(STYLE_ATTR, '')
    .replace(JS_URLS, '')
    .replace(DATA_URLS, '');
}

/**
 * Plain-text extraction, for meta descriptions and excerpts.
 * @param {string} html
 * @param {number} [maxLength]
 */
export function htmlToText(html, maxLength = 160) {
  if (typeof html !== 'string') return '';
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

/* Matches a heading and captures its level, attributes and inner HTML.
   Non-greedy so adjacent headings do not merge into one match. */
const HEADING = /<h([2-3])([^>]*)>([\s\S]*?)<\/h\1>/gi;

/**
 * Sanitise admin HTML and make its headings linkable.
 *
 * Product bodies are one blob of editor HTML — 22 KB and a dozen headings for a
 * typical product — with no `id` attributes, so nothing inside them could be
 * linked to or listed in a table of contents. This adds an id to every h2/h3
 * and returns the headings it found, so the page can build a TOC from the same
 * pass that renders the body.
 *
 * Ids are positional (`${prefix}-1`, `-2`, …) rather than slugified from the
 * text. The headings are Japanese, so slugs would be percent-encoded to
 * unreadable URLs, and duplicates are common — this product has 「関連コラム」
 * twice — which would collide. Positional ids are stable for a given body and
 * cannot clash.
 *
 * An existing id is left alone and reused as the anchor, so anything an editor
 * set deliberately still works.
 *
 * @param {string} html
 * @param {string} [prefix]
 * @returns {{html: string, headings: {id: string, level: number, text: string}[]}}
 */
export function sanitizeWithHeadingAnchors(html, prefix = 'sec') {
  const safe = sanitizeHtml(html);
  const headings = [];
  let n = 0;

  const withIds = safe.replace(HEADING, (match, level, attrs, inner) => {
    n += 1;
    const existing = /\sid\s*=\s*"([^"]*)"/i.exec(attrs)?.[1];
    const id = existing || `${prefix}-${n}`;
    const text = htmlToText(inner, 120).trim();

    // A heading with no readable text is not a useful destination.
    if (text) headings.push({ id, level: Number(level), text });

    return existing
      ? match
      : `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });

  return { html: withIds, headings };
}

/* --- Strict rich text ----------------------------------------------------

   For short admin copy with a small, known shape — notices (Admin → Notices,
   a CKEditor limited to headings, bold/italic, links, lists and quotes).
   Unlike sanitizeHtml above this is a true allow-list: every tag is rebuilt
   from scratch with no attributes, links keep only a vetted href, anything
   else is dropped, and all text between tags is re-escaped. Nothing the admin
   typed can put an attribute, a style or a script on the page. */

const RICH_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'hr', 'a',
]);
const VOID_TAGS = new Set(['br', 'hr']);

/* Dropped with their content, not just their tags. */
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|template|noscript|textarea|select)\b[\s\S]*?<\/\1\s*>/gi;

/* One tag. Quoted attribute values may contain ">". */
const ANY_TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const HREF_ATTR = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;

/* Web, mail and phone links, and paths on this site. Anything else —
   javascript:, data:, vbscript:, an entity-encoded scheme — is not a link. */
const SAFE_HREF = /^(?:https?:\/\/|mailto:|tel:|\/(?![/\\])|#)/i;

const escapeText = (text) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapePlain = (text) => escapeText(text.replace(/&/g, '&amp;'));

function isExternal(href) {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    const host = new URL(href.replace(/&amp;/g, '&')).hostname.replace(/^www\./, '');
    const own = new URL(SITE.url).hostname.replace(/^www\./, '');
    return host !== own;
  } catch {
    return true;
  }
}

/* An anchor with nothing but a vetted href. Other sites open in a new tab,
   without handing that tab a reference back to this one. An unsafe href
   leaves a bare <a>, which renders as plain text. */
function openAnchor(attrs) {
  const match = HREF_ATTR.exec(attrs);
  const href = (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim();
  if (!SAFE_HREF.test(href)) return '<a>';

  const safe = href.replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return isExternal(href)
    ? `<a href="${safe}" target="_blank" rel="noopener noreferrer">`
    : `<a href="${safe}">`;
}

/**
 * Admin rich text → safe HTML. Accepts either editor HTML or plain text (a
 * notice written before the editor existed): plain text becomes paragraphs at
 * blank lines and <br> at single line breaks.
 *
 * @param {string} input
 * @returns {string}
 */
export function richTextHtml(input) {
  if (typeof input !== 'string' || !input.trim()) return '';

  if (!/<[a-zA-Z/!]/.test(input)) {
    return input
      .trim()
      .split(/\r?\n[ \t]*\r?\n/)
      .map((para) => `<p>${escapePlain(para.trim()).replace(/\r?\n/g, '<br>')}</p>`)
      .join('');
  }

  const html = input.replace(/<!--[\s\S]*?-->/g, '').replace(DROP_WITH_CONTENT, '');
  let out = '';
  let last = 0;

  for (const match of html.matchAll(ANY_TAG)) {
    out += escapeText(html.slice(last, match.index));
    last = match.index + match[0].length;

    const [, closing, rawName, attrs] = match;
    const name = rawName.toLowerCase();
    if (!RICH_TAGS.has(name)) continue;

    if (closing) {
      if (!VOID_TAGS.has(name)) out += `</${name}>`;
    } else {
      out += name === 'a' ? openAnchor(attrs) : `<${name}>`;
    }
  }

  return out + escapeText(html.slice(last));
}
