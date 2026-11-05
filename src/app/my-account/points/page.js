import Link from 'next/link';

import styles from '../AccountLayout.module.css';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { getPoints } from '@/services/auth.service';
import { buildMetadata } from '@/lib/seo';
import { formatDate, formatNumber } from '@/lib/format';

export const metadata = buildMetadata({
  title: 'ポイント履歴',
  path: '/my-account/points',
  noIndex: true,
});

/**
 * Every point movement, newest first, with what earned or spent it.
 *
 * The wallet has always recorded a reason on each row — purchase, first
 * order, review, login, anniversary, referral, register — and
 * GET /api/home/loyalty_points has always returned it. Nothing called that
 * endpoint, so the account showed a balance of 0 and no way to see where
 * points came from.
 *
 * Credits and debits share one list rather than being split into tabs: a
 * balance is the running result of both, and the question 「なぜ減ったの」 is
 * asked at least as often as 「どこでもらったの」.
 */
export default async function PointsPage() {
  const { balance, entries } = await getPoints();

  return (
    <>
      <h1 className={styles.title}>ポイント履歴</h1>

      <div className={styles.pointsSummary}>
        <span className={styles.pointsSummaryLabel}>現在の保有ポイント</span>
        <span className={`${styles.pointsSummaryValue} numeric`}>
          {formatNumber(balance)}
          <span className={styles.pointsSummaryUnit}>pt</span>
        </span>
        <p className={styles.pointsSummaryNote}>
          1ポイント = 1円としてお買い物にご利用いただけます。
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="ポイントの履歴はまだありません"
          body="お買い物やレビューの投稿などでポイントがたまると、こちらに表示されます。"
          actionHref="/category"
          actionLabel="商品を探す"
        />
      ) : (
        <ul className={styles.pointList}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.pointRow}>
              <div className={styles.pointInfo}>
                <span className={styles.pointReason}>{entry.reason}</span>

                {/* What the credit was actually for, when the row knows. An
                    order number is a link; a review names its product. */}
                {entry.orderId && entry.orderNumber && (
                  <Link
                    href={`/my-account/orders/${entry.orderId}`}
                    className={styles.pointContext}
                  >
                    {entry.orderNumber}
                  </Link>
                )}
                {!entry.orderId && entry.productName && (
                  <span className={styles.pointContext}>{entry.productName}</span>
                )}

                <span className={styles.pointDate}>{formatDate(entry.createdAt)}</span>
              </div>

              {/* The sign is already in `points` — a debit is stored negative
                  by the normaliser, so nothing here re-derives it. */}
              <span
                className={`${styles.pointAmount} numeric`}
                data-direction={entry.type}
              >
                {entry.points > 0 ? '+' : '−'}
                {formatNumber(Math.abs(entry.points))}pt
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>ポイントがたまるタイミング</h2>
        </div>

        {/* Deliberately no figures. Every one of these is a setting the admin
            can change — first_order_points, review_points, daily_login_points
            and the rest — so printing numbers here would be a second source of
            truth that goes stale the first time one is edited. */}
        <ul className={styles.pointReasons}>
          <li>
            <strong>お買い物</strong> — ご注文時に商品代金に応じて付与されます。
          </li>
          <li>
            <strong>初回ご注文</strong> — はじめてのご注文に一度だけ付与されます。
          </li>
          <li>
            <strong>レビュー投稿</strong> —
            ご購入いただいた商品のレビューを投稿いただくと付与されます。写真を添えていただくとさらに加算されます。
          </li>
          <li>
            <strong>ログインボーナス</strong> — 1日1回のログインで付与されます。
          </li>
          <li>
            <strong>会員登録記念日</strong> — ご登録から1年ごとに付与されます。
          </li>
          <li>
            <strong>ご紹介</strong> —
            お客様の紹介コードから会員登録とご注文があった場合に付与されます。
          </li>
          <li>
            <strong>会員登録</strong> — 紹介コードをご利用の新規ご登録時に付与されます。
          </li>
        </ul>

        <p className={styles.pointNote}>
          ※ポイントの付与数や有効期限は変更される場合があります。
          レビューのポイントは、投稿内容の確認後に付与されます。
        </p>
      </div>
    </>
  );
}
