/**
 * Medicamaru — display formatting.
 *
 * Formatting only. These helpers NEVER calculate money — every monetary
 * value is computed by the backend and rendered verbatim. See brief §17.
 */

const JPY = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat('ja-JP');

/**
 * Format a yen amount. Yen has no minor unit, so values are whole integers.
 * @param {number} amount
 * @returns {string} e.g. '￥1,400'
 */
export function formatYen(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—';
  return JPY.format(amount);
}

/**
 * The Japanese-suffix price form used across this market: `1,400円`.
 * Preferred over the ￥ prefix in body copy and product cards.
 * @param {number} amount
 * @returns {string}
 */
export function formatYenSuffix(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—';
  return `${NUM.format(amount)}円`;
}

/**
 * The ￥-prefixed form the product cards lead with: `¥1,910`.
 *
 * No 〜. The 2026-09-23 decision was one plain price per card rather than a
 * "from" range: for a product with tiered packs this is the cheapest per-unit
 * price, and the pack table on the product page carries the rest.
 *
 * @param {number} amount
 * @returns {string} e.g. '¥1,910'
 */
export function formatYenPrefix(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—';
  return `¥${NUM.format(amount)}`;
}

/**
 * What the price is per, for the line beside it: `/1錠あたり`. Separate from
 * the number so a card can set it smaller and quieter.
 *
 * @param {string} [unitLabel] e.g. '錠'
 * @returns {string}
 */
export function formatPerUnit(unitLabel = '錠') {
  return `/1${unitLabel}あたり`;
}

/**
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—';
  return NUM.format(n);
}

/**
 * @param {number} pct
 * @returns {string} e.g. '17%OFF'
 */
export function formatDiscount(pct) {
  if (!pct || pct <= 0) return '';
  return `${Math.round(pct)}%OFF`;
}

/**
 * What an offer is worth: 「10%オフ」 or 「¥100オフ」.
 *
 * Only ever called with a benefit the normaliser was willing to state, so
 * there is no "unknown" branch: an offer whose value is points or a gift
 * arrives with benefit null and the caller shows nothing.
 *
 * Lives here rather than in CampaignCard because the cart's coupon picker
 * needs the same words — a coupon that reads 「10%オフ」 on the campaign page
 * and something else in the cart is two offers as far as a customer knows.
 *
 * @param {{kind: 'percentage', percent: number} | {kind: 'fixed', amount: number}} benefit
 * @returns {string}
 */
export function formatBenefit(benefit) {
  if (!benefit) return '';
  if (benefit.kind === 'percentage') {
    /* 99.99 is a real value here — the campaign that sells a tablet for ¥1 —
       so the decimals cannot simply be rounded away. Trailing zeros go, since
       「10.00%オフ」 reads like a bug; 「99.99%オフ」 stays as written. */
    const pct = Number(benefit.percent.toFixed(2));

    /* A CAPPED percentage is never stated as a flat one. 「50%オフ」 against a
       ¥200 ceiling promises ¥2,500 off a ¥5,000 order that will receive ¥200
       — 景品表示法's 有利誤認. 「最大」 fixes that: it says 50% is the best
       case, not the rule, and it is the wording Japanese shops already use.

       The ceiling itself is NOT appended here. It is a condition, and it
       belongs with the other conditions — the minimum spend and the end date
       — where there is room to state it plainly. See formatDiscountCap.
       Every surface that shows this string also shows those, so the figure
       is never more than a line away. */
    if (benefit.maxDiscount) {
      return `最大${pct}%オフ`;
    }

    return `${pct}%オフ`;
  }
  return `${formatYen(benefit.amount)}オフ`;
}

/**
 * The ceiling on a capped percentage offer, as a condition.
 *
 * Empty string for an uncapped offer and for a fixed amount, so a caller can
 * push the result into a conditions list without testing for the case — an
 * uncapped coupon simply contributes nothing.
 *
 * Shown WHEREVER the benefit is shown. 「最大50%オフ」 alone is honest about
 * there being a limit but says nothing about where it falls, and the
 * difference between a ¥200 ceiling and a ¥2,000 one is the whole offer.
 *
 * @param {{kind: string, maxDiscount?: number|null}} benefit
 * @returns {string} e.g. '割引上限 ¥200'
 */
export function formatDiscountCap(benefit) {
  if (!benefit || benefit.kind !== 'percentage' || !benefit.maxDiscount) return '';
  return `割引上限 ${formatYen(benefit.maxDiscount)}`;
}

/**
 * Japanese long date. Used for 最終更新日 — an E-E-A-T signal the primary
 * platform lacks entirely.
 * @param {string|Date} date
 * @returns {string} e.g. '2026年8月11日'
 */
export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ja-JP', {
    /* PINNED, and it has to be. Without it this formats in whatever zone the
       runtime happens to be in — UTC on the server, the visitor's own zone in
       the browser — so the same order date could render as two different days
       depending on where it was rendered. The backend stores UTC and every
       reader of this site is in Japan, which makes Tokyo the only correct
       answer in both places. Same reason TOKYO_YMD below pins it. */
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * A calendar date with no time — a notice's date — in the same long form:
 * '2026-09-20' → '2026年9月20日'. Read from the string, not through Date,
 * which takes it as UTC midnight and shows the day before on a server west of
 * UTC.
 * @param {string} ymd  YYYY-MM-DD
 * @returns {string}
 */
export function formatNoticeDate(ymd) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd));
  if (!match) return '';
  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
}

/**
 * Machine-readable date for <time dateTime> and structured data.
 * @param {string|Date} date
 * @returns {string} ISO yyyy-mm-dd
 */
export function toIsoDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/**
 * @param {number} average
 * @returns {string} e.g. '4.3'
 */
export function formatRating(average) {
  if (typeof average !== 'number' || Number.isNaN(average)) return '0.0';
  return average.toFixed(1);
}

/* Today's calendar date in Japan, as a UTC midnight so it can be subtracted.

   en-CA is not a typo and not a preference: it is the locale whose short date
   format is already YYYY-MM-DD, which saves assembling the parts by hand. */
const TOKYO_YMD = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Whole days from today until `iso`, or null when there is no usable date.
 *
 * Both ends are calendar dates in Japan, never instants. The end date is read
 * out of the string rather than parsed — the API sends 「2026-12-31 00:00:00」
 * with no zone, meaning that day in Japan, and `new Date()` would take it as
 * the server's local midnight. Today is asked for in Asia/Tokyo for the same
 * reason. This is the hazard formatNoticeDate above already describes: a
 * server west of the customer renders the day before.
 *
 * Getting this wrong is not cosmetic. It is the difference between a banner
 * saying 「本日まで」 and 「残り1日」 on the last day a coupon works, and the
 * storefront runs on a host whose timezone nobody here chose.
 *
 * @param {string} iso  'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'
 * @param {Date} [now]
 * @returns {number|null} Negative once the date has passed
 */
export function daysRemaining(iso, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''));
  if (!match) return null;

  const end = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  const [y, m, d] = TOKYO_YMD.format(now).split('-').map(Number);
  const today = Date.UTC(y, m - 1, d);

  return Math.round((end - today) / 86400000);
}

/**
 * The badge tone for an order status.
 *
 * The values are the `orders.order_status` ENUM and nothing else:
 * Pending | Processing | Completed | Cancelled. This existed before as a
 * switch on 'delivered' / 'shipped' / 'cancelled' — lowercase words the column
 * cannot hold — so every badge in the account fell through to the default and
 * a delivered order was styled as a pending one.
 *
 * @param {string} status
 * @returns {'inStock'|'info'|'outOfStock'|'warning'}
 */
export function orderStatusVariant(status) {
  switch (status) {
    case 'Completed':
      return 'inStock';
    case 'Processing':
      return 'info';
    case 'Cancelled':
      return 'outOfStock';
    /* Pending, and anything a later migration adds to the enum. */
    default:
      return 'warning';
  }
}

/**
 * Badge colour for `orders.payment_status`.
 *
 * Its own ENUM and NOT a subset of order_status — 'Pay Later' and 'Refunded'
 * exist here and nowhere else — so it gets its own mapping rather than being
 * passed through orderStatusVariant, where 'Paid' would fall to the default
 * and read as a warning.
 *
 * @param {string|null} status  raw column value, e.g. 'Paid', 'Pay Later'
 */
export function paymentStatusVariant(status) {
  switch (status) {
    case 'Paid':
      return 'inStock';
    case 'Processing':
      return 'info';
    /* Both are terminal and neither is good news, but they are not errors
       either — the muted chip reads as "nothing further is coming". */
    case 'Failed':
    case 'Refunded':
      return 'outOfStock';
    /* Pending, 'Pay Later', and anything a later migration adds. Amber,
       because each one means money is still outstanding. */
    default:
      return 'warning';
  }
}
