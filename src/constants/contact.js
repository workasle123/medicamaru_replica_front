/**
 * Contact form topics.
 *
 * Shared by the form (which renders the labels) and the server action (which
 * sends the LABEL as the inquiry's subject). Staff read these in Admin →
 * Inquiry, so the subject has to be the Japanese wording — a row reading
 * "shipping" tells whoever opens it nothing.
 *
 * The slug stays as the field value so the markup and any future filtering
 * are not tied to the Japanese string.
 */
export const INQUIRY_TOPICS = [
  { value: 'order', label: 'ご注文について' },
  { value: 'shipping', label: '配送について' },
  { value: 'product', label: '商品について' },
  { value: 'account', label: 'アカウントについて' },
  { value: 'other', label: 'その他' },
];

/** The Japanese label for a topic slug, falling back to the slug itself. */
export function inquiryTopicLabel(value) {
  return INQUIRY_TOPICS.find((t) => t.value === value)?.label || value;
}
