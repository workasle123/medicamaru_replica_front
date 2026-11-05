/**
 * Medicamaru — checkout constants.
 *
 * ⚠️ PAYMENT METHODS ARE PROVISIONAL.
 *
 * The payment gateway has not been identified (docs/DECISIONS.md Q4). The
 * business has said Medicamaru will use "the same gateway as the primary
 * platform", but the primary's checkout only renders payment options with a
 * non-empty cart, which was not created on production during the audit.
 *
 * The methods below are the standard Japanese e-commerce set, and match what
 * the reference sites surface (cocoro-kusuri gives 銀行振込 / コンビニ決済 /
 * Paidy their own navigation entries). They are placeholders for layout and
 * flow only — NO payment integration exists, and none should be built until
 * the gateway is confirmed.
 */

/**
 * The only method on offer today. Checkout submits this and shows no chooser;
 * the array below still holds the others because an order placed before they
 * were withdrawn has to keep its name on the completion page and the receipt.
 */
export const DEFAULT_PAYMENT_METHOD = 'bank_transfer';

/**
 * Every method the shop has ever taken, for NAMING one — not for offering a
 * choice. Checkout stopped asking (2026-10-07): only 銀行振込 is live, and a
 * radio group of one is a question with a single answer.
 */
export const PAYMENT_METHODS = [
  {
    id: 'bank_transfer',
    name: '銀行振込',
    note: 'ご注文後にお振込先をご案内します。入金確認後の発送となります。',
  },
  {
    id: 'convenience_store',
    name: 'コンビニ決済',
    note: 'お近くのコンビニエンスストアでお支払いいただけます。',
  },
  {
    id: 'credit_card',
    name: 'クレジットカード',
    note: '各種クレジットカードがご利用いただけます。',
  },
];

/** All 47 prefectures, in the standard JIS order. */
export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];
