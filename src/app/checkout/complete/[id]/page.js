import Link from 'next/link';
import { notFound } from 'next/navigation';

import styles from '../../Checkout.module.css';
import Button from '@/components/ui/Button/Button';
import BankTransferPanel from '@/components/checkout/BankTransferPanel/BankTransferPanel';
import OrderCelebration from '@/components/checkout/OrderCelebration/OrderCelebration';
import { getOrderConfirmation } from '@/services/cart.service';
import { buildMetadata } from '@/lib/seo';
import { formatYenSuffix, formatNumber, formatDate } from '@/lib/format';
import { PAYMENT_METHODS } from '@/constants/checkout';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'ご注文ありがとうございます',
  path: '/checkout/complete',
  noIndex: true,
});

/**
 * Order confirmation.
 *
 * Shows what was ordered and what happens next. Delivery on personal imports
 * runs 10–28 days, so setting that expectation here — rather than leaving the
 * customer to wonder — is the single most useful thing this page does.
 *
 * Guests see it too. They cannot read the order back from the backend, so
 * theirs is rendered from the receipt kept at checkout — see
 * getOrderConfirmation. That used to be a 404, bank details and all.
 */
export default async function OrderCompletePage({ params }) {
  const { id } = await params;
  const confirmation = await getOrderConfirmation(id);

  if (!confirmation) notFound();

  const { order, guest } = confirmation;
  const payment = PAYMENT_METHODS.find((m) => m.id === order.paymentMethod);

  return (
    <div className="container">
      {/* Decoration only, and gone in under five seconds. It renders nothing at
          all under prefers-reduced-motion, and never intercepts a tap — the
          account number below is what the customer came here for. */}
      <OrderCelebration />

      <div className={styles.complete}>
        <div className={styles.completeIcon} aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5L19 7" />
          </svg>
        </div>

        <h1>ご注文ありがとうございます</h1>
        {/* The order number the customer's email quotes, not the database row
            id this used to print. */}
        <p className={styles.orderNumber}>{order.orderNumber ?? order.id}</p>

        <p className={styles.completeBody}>
          {guest
            ? 'ご注文を受け付けました。ご入力いただいたメールアドレス宛に確認メールをお送りします。'
            : 'ご注文を受け付けました。ご登録のメールアドレス宛に確認メールをお送りします。'}
          {payment && <><br />お支払い方法：{payment.name}</>}
          <br />
            {order.bankTransfer
              ? 'ご入金の確認後、通常10〜14日でお届けいたします。'
              : '商品のお届けまでの目安は、ご注文日から通常10〜14日です。'}
        </p>

          <BankTransferPanel details={order.bankTransfer} />

        <div className={styles.completeSummary}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>ご注文内容</h2>

            <ul className={styles.miniLines} role="list">
              {order.lines.map((line, i) => (
                <li key={`${line.slug}-${line.packLabel}-${i}`} className={styles.miniLine}>
                  <span className={styles.miniName}>
                    <Link href={`/product/${line.slug}`}>{line.productName}</Link>
                    <span className={styles.miniPack}>
                      {line.packLabel}／{line.quantity}点
                    </span>
                  </span>
                  <span className="numeric">{formatYenSuffix(line.lineTotal)}</span>
                </li>
              ))}
            </ul>

            {/* A guest receipt drops trailing lines when a very large order would
                not fit in its cookie; the totals below still cover everything. */}
            {order.moreLines > 0 && (
              <p className={styles.legalNote}>
                ほか{order.moreLines}件の商品があります。詳細は確認メールをご覧ください。
              </p>
            )}

            <div className={styles.row}>
              <span>小計</span>
              <span className="numeric">{formatYenSuffix(order.subtotal)}</span>
            </div>

            {order.discount > 0 && (
              <div className={`${styles.row} ${styles.rowDiscount}`}>
                <span>割引</span>
                <span className="numeric">−{formatYenSuffix(order.discount)}</span>
              </div>
            )}

            <div className={styles.row}>
              <span>送料</span>
              <span className="numeric">
                {order.shipping === 0 ? '無料' : formatYenSuffix(order.shipping)}
              </span>
            </div>

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>合計</span>
              <span className={`${styles.totalValue} numeric`}>
                {formatYenSuffix(order.total)}
              </span>
            </div>

            {/* Members only: a guest has no points balance to spend until they
                register. */}
            {!guest && order.pointsEarned > 0 && (
              <p className={styles.pointsNote}>
                {formatNumber(order.pointsEarned)}pt を獲得しました
              </p>
            )}
          </section>

          {order.shippingAddress && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>お届け先</h2>
              <p>
                {order.shippingAddress.recipient} 様
                <br />〒{order.shippingAddress.postalCode}
                <br />
                {order.shippingAddress.prefecture}
                {order.shippingAddress.city}
                {order.shippingAddress.street}
                {order.shippingAddress.building && (
                  <>
                    <br />
                    {order.shippingAddress.building}
                  </>
                )}
                <br />
                {order.shippingAddress.phone}
              </p>
              <p className={styles.legalNote}>ご注文日：{formatDate(order.placedAt)}</p>
            </section>
          )}
        </div>

        {/* Order history is a members' page — a guest following that link
            would only meet the login form. Registering with the same email
            brings this order into the new account (confirmed by email). */}
        {guest ? (
          <>
            <p className={styles.completeBody}>
              このメールアドレスで会員登録すると、今回のご注文を含む注文履歴をマイページでご確認いただけます。
            </p>
            <div className={styles.completeActions}>
              <Button href="/register" variant="outline">
                会員登録する
              </Button>
              <Button href="/">買い物を続ける</Button>
            </div>
          </>
        ) : (
          <div className={styles.completeActions}>
            <Button href="/my-account/orders" variant="outline">
              注文履歴を見る
            </Button>
            <Button href="/category">買い物を続ける</Button>
          </div>
        )}
      </div>
    </div>
  );
}
