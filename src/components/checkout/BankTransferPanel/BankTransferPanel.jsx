import styles from './BankTransferPanel.module.css';
import CopyButton from '@/components/ui/CopyButton/CopyButton';
import { formatYenSuffix } from '@/lib/format';

/**
 * BankTransferPanel — where the customer actually sends the money.
 *
 * ALIJ is a furikomi gateway. Placing an order does not move any money: it
 * reserves a VIRTUAL BANK ACCOUNT, unique to that transaction, and the customer
 * completes the purchase by transferring into it. The gateway then matches the
 * incoming transfer by which account received it.
 *
 * So these details are not decoration and they are not static company details —
 * `accountNumber` differs for every order. Without them the customer has
 * literally no way to pay, which is why this sits above the order summary
 * rather than below it.
 *
 * Rendered only when a payment succeeded; the caller passes null otherwise.
 * Showing an account number for a failed payment would invite a transfer that
 * could never be matched to an order.
 *
 * ## Copying
 *
 * Every field here is about to be retyped into a banking app, usually on the
 * phone that is displaying it. The account holder is katakana and the account
 * number is a long digit string — the two things people mistype — and because
 * the account is per-transaction, a transfer that goes astray cannot be matched
 * back to this order at all.
 *
 * What each button copies is the RAW value, never the formatted one: the amount
 * copies as `4782`, not 「4,782円」, because a bank form rejects the latter. The
 * 「すべてコピー」 button at the foot copies the whole block as plain text, for
 * pasting into a memo or sending to whoever actually makes the transfer — which
 * on a family account is often not the person who placed the order.
 *
 * `預金種目` has no button on purpose: it is two characters, and a button beside
 * every single row turns the ones that matter into wallpaper.
 *
 * @param {Object} props
 * @param {import('@/lib/types').BankTransfer} props.details
 */
export default function BankTransferPanel({ details }) {
  if (!details) return null;

  const rows = [
    {
      label: '金融機関',
      value: details.bankName,
      suffix: details.bankCode && `（金融機関コード ${details.bankCode}）`,
      copy: details.bankName,
      subtle: true,
    },
    {
      label: '支店名',
      value: details.branchName,
      suffix: details.branchCode && `（支店コード ${details.branchCode}）`,
      copy: details.branchName,
      subtle: true,
    },
    { label: '預金種目', value: details.accountType },
    {
      label: '口座番号',
      value: details.accountNumber,
      copy: details.accountNumber,
      emphasis: true,
    },
    {
      label: '口座名義',
      value: details.accountHolder,
      copy: details.accountHolder,
      emphasis: true,
    },
  ].filter((row) => row.value);

  /* The same information as plain text. Built from the same source as the rows
     above so the two cannot drift apart. */
  const allText = [
    ...rows.map((row) =>
      `${row.label}：${row.value}${row.suffix ? row.suffix.replace(/[（）]/g, (c) => (c === '（' ? ' (' : ')')) : ''}`,
    ),
    `お振込金額：${details.amount}円`,
  ].join('\n');

  return (
    <section className={styles.panel} aria-labelledby="bank-transfer-heading">
      <div className={styles.headRow}>
        <h2 id="bank-transfer-heading" className={styles.heading}>
          お振込先のご案内
        </h2>
        <span className={styles.badge}>お支払い待ち</span>
      </div>

      <p className={styles.lede}>
        下記口座へお振込みいただいた時点で、ご注文が確定いたします。
        <strong className={styles.warn}>
          この口座はお客様専用です。他のご注文には使用できません。
        </strong>
      </p>

      <div className={styles.amountRow}>
        <span className={styles.amountLabel}>お振込金額</span>
        <span className={styles.amountValue}>
          <span className={`${styles.amount} numeric`}>{formatYenSuffix(details.amount)}</span>
          {/* Digits only — a bank's amount field takes no comma and no 円. */}
          <CopyButton value={String(details.amount)} label="お振込金額" />
        </span>
      </div>

      <dl className={styles.details}>
        {rows.map((row) => (
          <div key={row.label} className={styles.detailRow}>
            <dt className={styles.label}>{row.label}</dt>
            <dd className={`${styles.value} ${row.emphasis ? styles.emphasis : ''}`}>
              <span className={styles.valueText}>{row.value}</span>
              {row.suffix && <span className={styles.suffix}>{row.suffix}</span>}
            </dd>
            <div className={styles.rowAction}>
              {row.copy && (
                <CopyButton value={row.copy} label={row.label} subtle={row.subtle} />
              )}
            </div>
          </div>
        ))}
      </dl>

      <div className={styles.allRow}>
        <CopyButton value={allText} label="お振込先の情報すべて" subtle />
        <span className={styles.allHint}>メモや家族への共有用に、全項目をまとめてコピーします</span>
      </div>

      <p className={styles.note}>
        振込手数料はお客様のご負担となります。
        {details.transactionId && (
          <>
            <br />
            <span className={styles.txnRow}>
              お問い合わせ番号：
              <span className="numeric">{details.transactionId}</span>
              <CopyButton value={String(details.transactionId)} label="お問い合わせ番号" subtle />
            </span>
          </>
        )}
      </p>
    </section>
  );
}
