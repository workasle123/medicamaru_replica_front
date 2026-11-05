import styles from '../AccountLayout.module.css';
import ProfileForm from './ProfileForm';
import PasswordForm from './PasswordForm';
import { getCurrentCustomer, getPoints } from '@/services/auth.service';
import { buildMetadata } from '@/lib/seo';
import { formatNumber } from '@/lib/format';

export const metadata = buildMetadata({
  title: '会員情報',
  path: '/my-account/profile',
  noIndex: true,
});

/**
 * 会員情報 — the member's own record, and the two ways they can change it.
 *
 * This page used to be a read-only list under a notice saying editing was
 * 「準備中」. The write endpoints existed the whole time; what was missing was
 * anything calling them. (They also accepted far more than they should —
 * /customer/update discarded its own whitelist — which is fixed in the
 * backend before this form was pointed at it.)
 *
 * The details and the password are separate forms because they are separate
 * concerns: one is a record, the other is a credential, and the password
 * check needs the current password in a way the details never do.
 */
export default async function ProfilePage() {
  /* The balance is NOT on the customer row — see getPoints. This page read
     customer.pointsBalance, a field normaliseCustomer exposed as a literal 0,
     so 会員情報 reported 0pt to every customer even after the sidebar was
     fixed. That field is gone now; this is the only source. */
  const [customer, points] = await Promise.all([getCurrentCustomer(), getPoints()]);

  return (
    <>
      <h1 className={styles.title}>会員情報</h1>

      <ProfileForm customer={customer} />

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>保有ポイント</h2>
        </div>

        <div className={styles.definition}>
          <div className={styles.defRow}>
            <div className={styles.defLabel}>現在の残高</div>
            <div className={`${styles.defValue} numeric`}>
              {formatNumber(points.balance)}pt
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>パスワードの変更</h2>
        </div>

        <PasswordForm />
      </section>
    </>
  );
}
