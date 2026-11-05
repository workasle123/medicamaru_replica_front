/**
 * International dialling codes, for the phone field.
 *
 * Not the full ITU list. This shop ships to Japanese addresses, so +81 is the
 * answer for all but a handful of customers, and a 200-entry select is a wall
 * to scroll past for a field nobody needs to change. What is here is Japan,
 * the countries the catalogue's customers actually write in from, and the
 * places an expatriate customer is most likely to be reachable.
 *
 * Add a line if one is missing — the select reads this array and nothing else
 * needs touching. Stored in its own column (customers.customer_phone_country),
 * so adding a code never rewrites a number already on file.
 *
 * The code itself is the value, '+81' not 'JP': it is what gets printed beside
 * the number on a customs form, and storing the country instead would mean
 * looking the dialling code up again every time it is shown.
 */
export const PHONE_COUNTRY_CODES = [
  { code: '+81', label: '日本 (+81)' },
  { code: '+1', label: 'アメリカ・カナダ (+1)' },
  { code: '+44', label: 'イギリス (+44)' },
  { code: '+61', label: 'オーストラリア (+61)' },
  { code: '+64', label: 'ニュージーランド (+64)' },
  { code: '+65', label: 'シンガポール (+65)' },
  { code: '+66', label: 'タイ (+66)' },
  { code: '+82', label: '韓国 (+82)' },
  { code: '+84', label: 'ベトナム (+84)' },
  { code: '+86', label: '中国 (+86)' },
  { code: '+852', label: '香港 (+852)' },
  { code: '+886', label: '台湾 (+886)' },
  { code: '+60', label: 'マレーシア (+60)' },
  { code: '+62', label: 'インドネシア (+62)' },
  { code: '+63', label: 'フィリピン (+63)' },
  { code: '+91', label: 'インド (+91)' },
  { code: '+33', label: 'フランス (+33)' },
  { code: '+49', label: 'ドイツ (+49)' },
  { code: '+39', label: 'イタリア (+39)' },
  { code: '+34', label: 'スペイン (+34)' },
  { code: '+41', label: 'スイス (+41)' },
  { code: '+31', label: 'オランダ (+31)' },
  { code: '+55', label: 'ブラジル (+55)' },
];

/** What the field starts on, and what the backend column defaults to. */
export const DEFAULT_PHONE_COUNTRY = '+81';

/** Ready for <Select options={...}>. */
export const PHONE_COUNTRY_OPTIONS = PHONE_COUNTRY_CODES.map(({ code, label }) => ({
  value: code,
  label,
}));

/** Whether a submitted code is one we offer — anything else is not stored. */
export function isPhoneCountry(code) {
  return PHONE_COUNTRY_CODES.some((c) => c.code === code);
}
