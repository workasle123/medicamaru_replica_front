import Link from 'next/link';

import styles from '../AccountLayout.module.css';
import Badge from '@/components/ui/Badge/Badge';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { getOrders } from '@/services/auth.service';
import { buildMetadata } from '@/lib/seo';
import { trackingUrl } from '@/lib/tracking';
import { orderProgress, orderStageVariant } from '@/lib/order-progress';
import {
  formatYenSuffix,
  formatDate,
  formatNumber,
  paymentStatusVariant,
} from '@/lib/format';

export const metadata = buildMetadata({
  title: '注文履歴',
  path: '/my-account/orders',
  noIndex: true,
});

export default async function OrdersPage() {
  const orders = await getOrders();

  if (!orders.length) {
    return (
      <>
        <h1 className={styles.title}>注文履歴</h1>
        <EmptyState
          title="まだご注文がありません"
          body="ご注文いただくと、こちらに履歴が表示されます。"
          actionHref="/category"
          actionLabel="商品を探す"
        />
      </>
    );
  }

  return (
    <>
      <h1 className={styles.title}>注文履歴</h1>

      {/* One card per order, not a definition list. The previous version reused
          .defRow — a label/value pair — for something that is neither, and
          patched the shape back with inline font-size and font-weight. An order
          is a record with a header, its items and a total; this says so. */}
      <ul className={styles.orderList}>
        {orders.map((order) => {
          /* The stage, not `order_status`. The panel keeps ordering, payment
             and delivery in three separate columns and staff move them
             independently — an order handed to the carrier has
             delivery_status Dispatched while order_status is still
             Processing, which this list used to report as 「準備中」. */
          const progress = orderProgress(order);

          return (
          <li key={order.id} className={styles.orderCard}>
            <div className={styles.orderHead}>
              <div>
                <Link href={`/my-account/orders/${order.id}`} className={styles.orderNumber}>
                  {order.orderNumber}
                </Link>
                <p className={styles.orderDate}>{formatDate(order.placedAt)}</p>
              </div>
              {/* Two chips: where the parcel is, and where the money is. On a
                  furikomi shop they genuinely differ for days at a time, and
                  one chip cannot say both. The payment chip is dropped once
                  it is settled — a 「お支払い済み」 on every historical order
                  is noise that makes the one outstanding order harder to
                  spot. */}
              <span className={styles.orderBadges}>
                <Badge variant={orderStageVariant(progress.stageKey)}>
                  {progress.stageLabel}
                </Badge>
                {!order.paid && !progress.cancelled && (
                  <Badge variant={paymentStatusVariant(order.paymentStatus)}>
                    {order.paymentLabel}
                  </Badge>
                )}
              </span>
            </div>

            {/* Names, not thumbnails. The list endpoint does not eager-load
                product images, so every thumbnail here would be the placeholder
                — worse than the words it replaced. The detail page has them. */}
            {order.lines.length > 0 && (
              <p className={styles.orderItems}>
                {order.lines[0].productName}
                {order.lines.length > 1 && ` 他${formatNumber(order.lines.length - 1)}点`}
              </p>
            )}

            <div className={styles.orderFoot}>
              <span className={styles.orderTotal}>
                商品 {formatNumber(order.itemCount)}点・
                <span className="numeric">{formatYenSuffix(order.total)}</span>
              </span>

              <span className={styles.orderActions}>
                {/* Only once there is a number to track. The list endpoint
                    carries the merged tracking numbers, so they are here
                    without a second request — and an order that has not
                    shipped simply shows no link, rather than one that lands
                    on 「お問い合わせ番号が見つかりません」.

                    First number only, on the list: the row has one action
                    slot, and a split shipment's remaining parcels are listed
                    in full on the order itself. */}
                {trackingUrl(order.trackingNumbers?.[0]) && (
                  <a
                    href={trackingUrl(order.trackingNumbers[0])}
                    target="_blank"
                    rel="noopener"
                    className={styles.trackLink}
                  >
                    配送状況を追跡
                  </a>
                )}
                <Link href={`/my-account/orders/${order.id}`} className={styles.orderLink}>
                  詳細を見る →
                </Link>
              </span>
            </div>
          </li>
          );
        })}
      </ul>
    </>
  );
}
