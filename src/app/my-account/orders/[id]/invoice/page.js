import Link from 'next/link';
import { notFound } from 'next/navigation';

import styles from './Invoice.module.css';
import PrintButton from './PrintButton';
import { OPERATOR, SITE } from '@/constants/site';
import { formatYenSuffix, formatDate, formatNumber } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { getOrder } from '@/services/auth.service';

export const metadata = buildMetadata({
  title: 'ご注文明細書',
  path: '/my-account/orders',
  noIndex: true,
});

/**
 * The printable statement for one order.
 *
 * Printed from the browser rather than generated as a PDF on the server. The
 * backend already has a GenerateOrderInvoicePdf job, but it is dispatched from
 * nowhere and writes to storage/app/public/invoices/order-{id}.pdf — a
 * sequential, unauthenticated path, so wiring it up as it stands would publish
 * every customer's statement to anyone who could count. This route goes
 * through getOrder, which checks the order belongs to the signed-in customer,
 * and the file never exists on disk at all.
 *
 * It is 明細書, not 請求書 or 領収書, and says so: the operator is not a
 * 適格請求書発行事業者, and a document shaped like a 適格請求書 would mislead a
 * business customer into claiming a consumption-tax credit they cannot have.
 * No 消費税 line for the same reason — a personal import is not a domestic
 * sale and the order carries no tax column to print.
 */
export default async function OrderInvoicePage({ params }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) notFound();

  return (
    <>
      <div className={styles.actions}>
        <Link href={`/my-account/orders/${order.id}`} className={styles.back}>
          ← 注文詳細に戻る
        </Link>
        <PrintButton />
      </div>

      {/* The attribute is what styles/base.css keys the print isolation on. */}
      <article className={styles.sheet} data-print-sheet>
        <header className={styles.head}>
          <div>
            <h1 className={styles.docTitle}>ご注文明細書</h1>
            <dl className={styles.meta}>
              <div className={styles.metaRow}>
                <dt>注文番号</dt>
                <dd className="numeric">{order.orderNumber}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>ご注文日</dt>
                <dd>{formatDate(order.placedAt)}</dd>
              </div>
              {/* The shop's own invoice number, once the order has been
                  invoiced. Null until then, and an empty field on a printed
                  sheet reads as a document that failed to render. */}
              {order.invoiceNo && (
                <div className={styles.metaRow}>
                  <dt>明細書番号</dt>
                  <dd className="numeric">{order.invoiceNo}</dd>
                </div>
              )}
              {order.invoiceDate && (
                <div className={styles.metaRow}>
                  <dt>発行日</dt>
                  <dd>{formatDate(order.invoiceDate)}</dd>
                </div>
              )}
              <div className={styles.metaRow}>
                <dt>お支払い状況</dt>
                <dd>{order.paymentLabel}</dd>
              </div>
            </dl>
          </div>

          {/* Plain text, not the site logo: an SVG or a WebP mark is the first
              thing a print stylesheet loses to a 「背景のグラフィック」 setting
              left off, and the seller's name is the one thing on this sheet
              that cannot be allowed to go missing. */}
          <div className={styles.issuer}>
            <p className={styles.issuerSite}>
              {SITE.name}（{SITE.nameEn}）
            </p>
            <p className={styles.issuerName}>{OPERATOR.name}</p>
            <p>{OPERATOR.address}</p>
            <p>代表者：{OPERATOR.representative}</p>
            <p className="numeric">{OPERATOR.phone}</p>
            <p>{OPERATOR.email}</p>
          </div>
        </header>

        {order.shipTo && (
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>お届け先</h2>
            <address className={styles.shipTo}>
              {order.shipTo.name && <strong>{order.shipTo.name} 様</strong>}
              {order.shipTo.postalCode && (
                <span className="numeric">〒{order.shipTo.postalCode}</span>
              )}
              <span>
                {order.shipTo.prefecture}
                {order.shipTo.line1}
              </span>
              {order.shipTo.line2 && <span>{order.shipTo.line2}</span>}
              {order.shipTo.phone && <span className="numeric">{order.shipTo.phone}</span>}
            </address>
          </section>
        )}

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>ご注文内容</h2>

          {/* A real table, which this is: four columns of figures that have to
              line up down the page and survive a page break. The account pages
              use cards because they are read on a phone; a sheet of A4 is the
              one place a table is the right answer. */}
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">商品名</th>
                <th scope="col" className={styles.num}>
                  単価
                </th>
                <th scope="col" className={styles.num}>
                  数量
                </th>
                <th scope="col" className={styles.num}>
                  金額
                </th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={`${line.productId}-${line.packLabel}`}>
                  <td>
                    {line.productName}
                    {line.packLabel && <span className={styles.pack}>{line.packLabel}</span>}
                  </td>
                  <td className={`${styles.num} numeric`}>{formatYenSuffix(line.unitPrice)}</td>
                  <td className={`${styles.num} numeric`}>{formatNumber(line.quantity)}</td>
                  <td className={`${styles.num} numeric`}>{formatYenSuffix(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>
                  小計
                </th>
                <td className={`${styles.num} numeric`}>{formatYenSuffix(order.subtotal)}</td>
              </tr>
              {order.discount > 0 && (
                <tr>
                  <th scope="row" colSpan={3}>
                    割引（クーポン・ポイント）
                  </th>
                  <td className={`${styles.num} numeric`}>−{formatYenSuffix(order.discount)}</td>
                </tr>
              )}
              <tr>
                <th scope="row" colSpan={3}>
                  送料
                </th>
                <td className={`${styles.num} numeric`}>{formatYenSuffix(order.shipping)}</td>
              </tr>
              <tr className={styles.grand}>
                <th scope="row" colSpan={3}>
                  合計
                </th>
                <td className={`${styles.num} numeric`}>{formatYenSuffix(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* The virtual account this order's money has to arrive in. Per
            transaction, not per shop — see normaliseBankTransfer — so it only
            belongs on a statement for an order that has not been paid. */}
        {!order.paid && order.bankTransfer && (
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>お振込先</h2>
            <dl className={styles.bank}>
              <div className={styles.bankRow}>
                <dt>金融機関</dt>
                <dd>
                  {order.bankTransfer.bankName} {order.bankTransfer.branchName}
                </dd>
              </div>
              <div className={styles.bankRow}>
                <dt>口座種別</dt>
                <dd>{order.bankTransfer.accountType}</dd>
              </div>
              <div className={styles.bankRow}>
                <dt>口座番号</dt>
                <dd className="numeric">{order.bankTransfer.accountNumber}</dd>
              </div>
              <div className={styles.bankRow}>
                <dt>口座名義</dt>
                <dd>{order.bankTransfer.accountHolder}</dd>
              </div>
              <div className={styles.bankRow}>
                <dt>お振込金額</dt>
                <dd className="numeric">{formatYenSuffix(order.bankTransfer.amount)}</dd>
              </div>
            </dl>
            <p className={styles.bankNote}>
              この口座はこのご注文専用です。他のご注文のお支払いにはご利用いただけません。
            </p>
          </section>
        )}

        <footer className={styles.note}>
          <p>
            本明細書は適格請求書（インボイス）ではありません。当サイトは個人輸入の取次であり、商品代金に日本の消費税は含まれておりません。
          </p>
          <p>
            お問い合わせ：{OPERATOR.email}（受付時間 {OPERATOR.supportHours}）
          </p>
        </footer>
      </article>
    </>
  );
}
