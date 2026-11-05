import styles from '../AccountLayout.module.css';
import CopyField from './CopyField';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { getCurrentCustomer, getReferrals } from '@/services/auth.service';
import { buildMetadata } from '@/lib/seo';
import { referralLink } from '@/lib/referral';
import { formatDate, formatNumber } from '@/lib/format';

export const metadata = buildMetadata({
  title: '紹介プログラム',
  path: '/my-account/referral',
  noIndex: true,
});

/* Per-customer and live: the list grows the moment someone accepts. */
export const dynamic = 'force-dynamic';

/**
 * The referral panel.
 *
 * ## The figures are the backend's, read from the customer row
 *
 * `referralAmount` is what the REFERRER is paid, and `referralApplicableValue`
 * is the order total the referred person has to reach before it is paid. Both
 * are written onto the customer at registration from the `referral_points`
 * setting, so they are per-customer values rather than constants and are read
 * rather than hardcoded here — an older account may carry a different number
 * from a newer one.
 *
 * ## When each side is paid
 *
 * The person accepting the invitation is credited at registration, by
 * UpdateReferralInfo. The referrer is credited by
 * UserService::payAmountToReferreeUser, which runs when an order of theirs
 * moves to payment_status = Paid in the admin — not when it is placed. The
 * wording says "ご入金の確認後" for that reason: promising points at checkout
 * would be promising something the backend does not do until payment lands.
 */
export default async function ReferralPage() {
  const [customer, referrals] = await Promise.all([getCurrentCustomer(), getReferrals()]);

  /* The endpoint is preferred, but the code is on the profile too, so a failed
     referrals call still leaves something to share. */
  const code = referrals.code ?? customer?.referralCode ?? null;
  const link = referralLink(code);

  const payout = customer?.referralAmount ?? null;
  const threshold = customer?.referralApplicableValue ?? null;

  if (!code) {
    return (
      <>
        <h1 className={styles.title}>紹介プログラム</h1>
        <EmptyState
          title="紹介コードがまだ発行されていません"
          body="お手数ですが、時間をおいて再度ご確認ください。"
        />
      </>
    );
  }

  return (
    <>
      <h1 className={styles.title}>紹介プログラム</h1>

      <p className={styles.lead}>
        紹介リンクをお友達に共有してください。ご登録いただくとお友達にポイントが進呈され、
        {threshold
          ? `そのお友達が${formatNumber(threshold)}円以上のご注文をされ`
          : 'そのお友達がご注文をされ'}
        、ご入金が確認できた時点でお客様にもポイントが進呈されます。
      </p>

      <div className={styles.referralShare}>
        <CopyField
          label="紹介リンク"
          value={link}
          hint="このリンクから登録すると、紹介コードが自動で入力されます。"
        />
        <CopyField label="紹介コード" value={code} hint="リンクが使えない場合はこちらをお伝えください。" />
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>ご紹介の流れ</h2>
        </div>
        <ol className={styles.referralSteps}>
          <li>上記のリンクまたはコードをお友達に共有します。</li>
          <li>お友達が会員登録のときにコードを入力すると、お友達にポイントが進呈されます。</li>
          <li>
            {threshold
              ? `お友達が${formatNumber(threshold)}円以上のご注文をされ、ご入金が確認できた時点で、`
              : 'お友達のご注文のご入金が確認できた時点で、'}
            {payout ? `お客様に${formatNumber(payout)}ポイントが進呈されます。` : 'お客様にポイントが進呈されます。'}
          </li>
        </ol>
        <p className={styles.referralNote}>
          ポイントは1ポイント = 1円としてお買い物にご利用いただけます。
          紹介は1アカウントにつき1回まで有効で、ご自身のコードはご利用いただけません。
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            ご紹介いただいた方{referrals.referred.length > 0 && `（${referrals.referred.length}名）`}
          </h2>
        </div>

        {referrals.referred.length === 0 ? (
          <p className={styles.referralNote}>
            まだご紹介はありません。上記のリンクを共有してみてください。
          </p>
        ) : (
          <ul className={styles.referralList}>
            {referrals.referred.map((person, i) => (
              <li key={`${person.name}-${i}`} className={styles.referralPerson}>
                <span>{person.name} 様</span>
                {person.joinedAt && (
                  <span className={styles.referralDate}>{formatDate(person.joinedAt)} ご登録</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {referrals.referredBy && (
        <p className={styles.referralNote}>
          お客様は {referrals.referredBy.name} 様のご紹介でご登録いただきました。
        </p>
      )}
    </>
  );
}
