/**
 * Parcel tracking, via 日本郵便.
 *
 * Orders ship India Post from the supplier and 日本郵便 carries the inbound
 * leg, so one number follows the parcel the whole way and Japan Post's own
 * tracking page resolves it. The storefront tracks nothing itself; it hands
 * the number to the carrier.
 */

/**
 * The carrier's own tracking page, with nothing filled in.
 *
 * For the footer, where there is no order in context and the visitor is
 * expected to paste a number they have from somewhere else.
 */
export const JAPAN_POST_TRACKING = 'https://www.post.japanpost.jp/receive/tracking/';

/** What the form on that page actually submits to. */
const RESULT_URL = 'https://www.post.japanpost.jp/receive/tracking/result.php';

/**
 * A deep link straight to the result for one parcel.
 *
 * The tracking form is a plain GET with a `code` field, so prefilling it is
 * just a query string — verified against the live form, which posts to
 * result.php?code=… and renders the result page directly. Worth doing rather
 * than sending someone to a blank form: the alternative is a customer copying
 * a number between two tabs, which is where the typos come from.
 *
 * LETTERS ARE KEPT. This stripped every non-digit, on the assumption of a
 * domestic 11–13 digit number. The parcels carry UPU S10 numbers — two
 * letters, nine digits, two letters, e.g. LP959035199IN — so stripping
 * reduced a real number to 959035199 and the link went nowhere. Checked
 * against the carrier:
 *
 *   result.php?code=LP959035199IN  ->  引受 / 国際交換局 …
 *   result.php?code=959035199      ->  nothing
 *
 * SEPARATORS STILL GO. The admin field is free text and numbers are entered
 * as 4512-8890-3321 or with spaces, because that is how the carrier's own
 * paperwork groups them, and passing those through produces
 * 「お問い合わせ番号が見つかりません」 for a parcel that is perfectly findable.
 *
 * The whole full-width ASCII block is folded, not digits alone: an admin
 * typing on a Japanese IME with 全角 left on produces ＬＰ９５９…, which looks
 * identical in the panel and matches nothing at the carrier.
 *
 * Kept in step with EmailService::trackingCode() on the backend — the mail
 * and the account page must not disagree about what a number is.
 *
 * @param {string|null|undefined} trackingNumber
 * @returns {string|null} null when there is no usable number, so a caller can
 *                        render nothing rather than a link that cannot work.
 */
export function trackingUrl(trackingNumber) {
  if (!trackingNumber) return null;

  const code = String(trackingNumber)
    /* Full-width ASCII (U+FF01–U+FF5E) down to its ASCII twin, which covers
       ＬＰ as well as ０-９. */
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();

  if (!code) return null;
  return `${RESULT_URL}?code=${code}`;
}
