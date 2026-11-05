import Link from 'next/link';

import styles from './AccountLayout.module.css';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import Alert from '@/components/ui/Alert/Alert';
import { getOrders, getAddresses, getReferrals } from '@/services/auth.service';
import { buildMetadata } from '@/lib/seo';
import { formatNumber, formatYenSuffix, formatDate } from '@/lib/format';
import { referralLink } from '@/lib/referral';
import CopyField from './referral/CopyField';

export const metadata = buildMetadata({
  title: 'マイページ',
  path: '/my-account',
  noIndex: true,
});

/**
 * @param {Object} props
 * @param {Promise<Record<string, string|string[]|undefined>>} [props.searchParams]
 *   `verified=1` is set by /register/verify, which signs the customer in and
 *   sends them straight here. The banner below is the whole acknowledgement
 *   that the address was confirmed — there is deliberately no interstitial
 *   page in between, because a screen whose only content is "done" and whose
 *   only control is "continue" is a tap charged for nothing.
 */
export default async function AccountDashboardPage({ searchParams }) {
  const sp = await searchParams;
  const justVerified = sp?.verified === '1';
  /* No getCurrentCustomer() here any more. It was fetched for the 保有ポイント
     card alone, and the layout both guarantees a signed-in customer and
     already states the balance — so this page was making a second request for
     a number it no longer prints. */
  const [orders, addresses, referrals] = await Promise.all([
    getOrders(),
    getAddresses(),
    getReferrals(),
  ]);

  const recent = orders.slice(0, 3);

  /* Null when the referrals call failed, which hides the section rather
     than showing a broken link. The full page falls back to the code on
     the customer profile; this one does not fetch the profile, so a
     summary is simply dropped when the lookup is unavailable. */
  const referralCode = referrals.code ?? null;

  return (
    <>
      <h1 className={styles.title}>アカウントトップ</h1>

      {justVerified && (
        <Alert variant="success" title="メールアドレスの確認が完了しました">
          ご登録ありがとうございます。すべてのサービスをご利用いただけます。
        </Alert>
      )}

      {/* No 保有ポイント card. The identity panel in the layout already states
          the balance on every account page, and below 1024px that panel
          stacks directly above this one — so the same figure appeared twice
          within one phone screen. The sidebar keeps it, because it is the
          copy that shows on 注文履歴 and 会員情報 too. */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>ご注文件数</span>
          <span className={`${styles.cardValue} numeric`}>{formatNumber(orders.length)}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>登録済みお届け先</span>
          <span className={`${styles.cardValue} numeric`}>{formatNumber(addresses.length)}</span>
        </div>
      </div>

      {/* The referral programme, summarised. The full page carries the terms
          and the list of people invited; what belongs here is the thing a
          customer came to copy, so the link is on this page rather than one
          tap further in. */}
      {referralCode && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>紹介プログラム</h2>
            <Link href="/my-account/referral">詳しく見る →</Link>
          </div>

          <CopyField
            label="紹介リンク"
            value={referralLink(referralCode)}
            hint={
              referrals.referred.length > 0
                ? `これまでに${formatNumber(referrals.referred.length)}名をご紹介いただきました。`
                : 'お友達がこのリンクから登録すると、おふたりにポイントが進呈されます。'
            }
          />
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>最近のご注文</h2>
          {orders.length > 0 && <Link href="/my-account/orders">すべて見る →</Link>}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="まだご注文がありません"
            body="気になる商品を探して、最初のご注文をどうぞ。"
            actionHref="/category"
            actionLabel="商品を探す"
          />
        ) : (
          <div className={styles.definition}>
            {recent.map((order) => (
              <div key={order.id} className={styles.defRow}>
                <div className={styles.defLabel}>
                  <Link href={`/my-account/orders/${order.id}`}>{order.id}</Link>
                </div>
                <div className={styles.defValue}>
                  {formatDate(order.placedAt)}・{order.statusLabel}・
                  <span className="numeric">{formatYenSuffix(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
