import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import styles from '../../AccountLayout.module.css';
import Badge from '@/components/ui/Badge/Badge';
import OrderProgress from '@/components/account/OrderProgress/OrderProgress';
import { getOrder } from '@/services/auth.service';
import { buildMetadata } from '@/lib/seo';
import { trackingUrl } from '@/lib/tracking';
import {
  formatYenSuffix,
  formatDate,
  formatNumber,
  orderStatusVariant,
  paymentStatusVariant,
} from '@/lib/format';

export const metadata = buildMetadata({
  title: '注文詳細',
  path: '/my-account/orders',
  noIndex: true,
});

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) notFound();

  return (
    <>
      <div className={styles.orderDetailHead}>
        <h1 className={styles.title}>注文詳細</h1>
        <Link href={`/my-account/orders/${order.id}/invoice`} className={styles.invoiceLink}>
          明細書を表示・印刷
        </Link>
      </div>

      {/* Where the order has got to, before any of its details. This is the
          one question someone opening this page already has, and until now
          the answer was a single chip that only moved when `order_status`
          did — so an order marked Dispatched in the panel looked unchanged.
          See lib/order-progress.js. */}
      <OrderProgress order={order} />

      <dl className={styles.orderFacts}>
        <div className={styles.orderFact}>
          <dt>注文番号</dt>
          <dd className="numeric">{order.orderNumber}</dd>
        </div>
        <div className={styles.orderFact}>
          <dt>ご注文日</dt>
          <dd>{formatDate(order.placedAt)}</dd>
        </div>
        <div className={styles.orderFact}>
          <dt>ステータス</dt>
          <dd>
            <Badge variant={orderStatusVariant(order.status)}>
              {order.statusLabel}
            </Badge>
          </dd>
        </div>
        {/* The payment column in its own right. `statusLabel` above folds it
            in only for a Pending order, so a Processing order that had been
            paid said nothing about the money at all — on a furikomi shop,
            where the customer transfers manually and waits, that is the fact
            they came to check. */}
        <div className={styles.orderFact}>
          <dt>お支払い状況</dt>
          <dd>
            <Badge variant={paymentStatusVariant(order.paymentStatus)}>
              {order.paymentLabel}
            </Badge>
          </dd>
        </div>
        {/* Only once the parcel is handed over, which is most of an order's
            life after it is placed and none of it before.

            Every number, not the first: a split shipment has one per parcel,
            and showing one of them tells someone waiting on two boxes that
            the other is lost. The label pluralises so two numbers read as two
            parcels rather than as a mistake. */}
        {order.trackingNumbers?.length > 0 && (
          <div className={styles.orderFact}>
            <dt>お問い合わせ番号</dt>
            <dd>
              {order.trackingNumbers.map((number, i) => (
                <span key={number} className={styles.trackItem}>
                  {order.trackingNumbers.length > 1 && (
                    <span className={styles.trackLabel}>荷物{i + 1}</span>
                  )}
                  {/* The number IS the link. It is the only thing on this page
                      a customer wants to act on rather than read, and a
                      separate 「追跡する」 button beside it would be the same
                      click twice. Plain text when nothing usable is left in
                      the number — see trackingUrl. */}
                  {trackingUrl(number) ? (
                    <a
                      href={trackingUrl(number)}
                      target="_blank"
                      rel="noopener"
                      className={`${styles.trackNumber} numeric`}
                    >
                      {number}
                    </a>
                  ) : (
                    <span className="numeric">{number}</span>
                  )}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>ご注文商品</h2>
        </div>

        <ul className={styles.orderLines}>
          {order.lines.map((line) => (
            <li key={`${line.slug}-${line.packLabel}`} className={styles.orderLine}>
              {line.image ? (
                <Image
                  src={line.image}
                  alt=""
                  width={64}
                  height={64}
                  className={styles.orderLineImage}
                />
              ) : (
                <span className={styles.orderLineImage} aria-hidden="true" />
              )}

              <div className={styles.orderLineInfo}>
                <Link href={`/product/${line.slug}`} className={styles.orderLineName}>
                  {line.productName}
                </Link>
                <p className={styles.orderLineMeta}>
                  {line.packLabel}／数量 {formatNumber(line.quantity)}
                </p>

                {/* Straight to the form on the product page. This is where a
                    customer is when they have just received something, so it
                    is the moment a review is most likely to be written — and
                    the product page is the only place the form lives, rather
                    than a second copy of it to keep in step.

                    On every line, not only delivered ones: the form gates
                    itself on having ORDERED the product, which is the rule the
                    backend's purchase check applies too, and a link that
                    appeared only after a status change would be a second rule
                    to keep aligned with it. */}
                <Link
                  href={`/product/${line.slug}#reviews`}
                  className={styles.orderLineReview}
                >
                  レビューを書く
                </Link>
              </div>

              <span className={`${styles.orderLineTotal} numeric`}>
                {formatYenSuffix(line.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Where it went, as it was written at checkout — not as the address book
          reads today. See orderShipTo. */}
      {order.shipTo && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>配送先</h2>
          </div>

          <address className={styles.shipTo}>
            {order.shipTo.name && <span className={styles.shipToName}>{order.shipTo.name} 様</span>}
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

      {/* All totals are rendered exactly as the backend supplied them.
          Nothing here re-derives a subtotal, discount or total (brief §17). */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>お支払い金額</h2>
        </div>

        <dl className={styles.orderTotals}>
          <div className={styles.totalRow}>
            <dt>小計</dt>
            <dd className="numeric">{formatYenSuffix(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className={styles.totalRow}>
              <dt>割引</dt>
              <dd className="numeric">−{formatYenSuffix(order.discount)}</dd>
            </div>
          )}
          <div className={styles.totalRow}>
            <dt>送料</dt>
            <dd className="numeric">{formatYenSuffix(order.shipping)}</dd>
          </div>
          <div className={`${styles.totalRow} ${styles.totalRowGrand}`}>
            <dt>合計</dt>
            <dd className="numeric">{formatYenSuffix(order.total)}</dd>
          </div>
          {order.pointsEarned > 0 && (
            <div className={styles.totalRow}>
              <dt>獲得ポイント</dt>
              <dd className="numeric">{formatNumber(order.pointsEarned)}pt</dd>
            </div>
          )}
        </dl>
      </section>

      <p className={styles.section}>
        <Link href="/my-account/orders">← 注文履歴に戻る</Link>
      </p>
    </>
  );
}
