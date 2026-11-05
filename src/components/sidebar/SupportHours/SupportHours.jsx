import SideBox from '../SideBox/SideBox';
import { IconMail } from '../icons';
import styles from './SupportHours.module.css';

/**
 * SupportHours — when a reply will come, beside the contact form.
 *
 * Someone writing to a pharmacy about an order they have already paid for
 * wants one thing answered before they start typing: when will somebody get
 * back to me. Saying so next to the form costs nothing and stops the second
 * enquiry that asks whether the first one arrived.
 *
 * Email only, deliberately: there is no phone line to publish, and inventing a
 * channel the shop cannot staff would be worse than not offering one.
 *
 * Server Component — static text.
 */
export default function SupportHours() {
  return (
    <SideBox id="side-support" title="受付時間・返信目安" icon={<IconMail />}>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt className={styles.term}>受付</dt>
          <dd className={styles.detail}>フォームから24時間</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>返信</dt>
          <dd className={styles.detail}>通常2〜3営業日</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>休業</dt>
          <dd className={styles.detail}>土日・祝日</dd>
        </div>
      </dl>
      <p className={styles.note}>
        土日・祝日にいただいたお問い合わせは、翌営業日以降の対応となります。
      </p>
    </SideBox>
  );
}
