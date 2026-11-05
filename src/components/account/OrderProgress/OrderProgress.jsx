import styles from './OrderProgress.module.css';
import { orderProgress } from '@/lib/order-progress';

/**
 * The five-step bar at the top of an order.
 *
 * A SERVER COMPONENT, with no state and no effects. Everything it draws comes
 * from three columns already on the order, and the page it sits on is
 * force-dynamic, so the bar is correct on every load without a client bundle
 * or a poll.
 *
 * Presentation notes that are decisions rather than taste:
 *
 * - The track is an <ol>. This is a sequence with a position in it, and a
 *   screen reader should say so; a row of <div>s would read as five unrelated
 *   words. Each step carries its state in the text for the same reason —
 *   colour and a tick are not available to everyone, and 「完了」/「対応中」
 *   is read out where a green dot is not.
 *
 * - The connecting line is drawn per step with ::before rather than as one
 *   bar behind the row, because the filled portion has to stop exactly at the
 *   current step. One absolutely-positioned bar with a percentage width is
 *   the usual trick and it drifts: the steps are not evenly spaced once the
 *   labels wrap in Japanese at narrow widths.
 *
 * - It stacks vertically below 640px instead of shrinking. Five Japanese
 *   labels on one line at phone width leaves about 60px each, which wraps
 *   mid-word; a vertical timeline is also the shape Japanese EC sites use on
 *   mobile, so it reads as familiar rather than broken.
 *
 * @param {Object} props
 * @param {object} props.order        a normalised order summary
 * @param {string} [props.className]
 */
export default function OrderProgress({ order, className = '' }) {
  const progress = orderProgress(order);

  /* Cancelled: no bar. See orderProgress — a partially filled track above the
     word 「キャンセル」 tells the reader to keep waiting for something that
     is not coming. */
  if (progress.cancelled) {
    return (
      <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
        <p className={styles.cancelled}>
          <span className={styles.cancelledMark} aria-hidden="true">
            ×
          </span>
          このご注文はキャンセルされました。
        </p>
      </div>
    );
  }

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <ol className={styles.track}>
        {progress.steps.map((step) => (
          <li
            key={step.key}
            className={[styles.step, styles[step.state], step.unsettled && styles.unsettled]
              .filter(Boolean)
              .join(' ')}
            aria-current={step.state === 'current' ? 'step' : undefined}
          >
            <span className={styles.marker} aria-hidden="true">
              {step.unsettled ? '!' : step.state === 'done' ? '✓' : ''}
            </span>

            {/* Label and hint share one box so the two layouts differ only in
                the direction of .step: column on desktop, row on a phone.
                Without it the hint is a third flex child and lands beside the
                label when the row turns horizontal. */}
            <span className={styles.body}>
              <span className={styles.label}>
                {step.label}
                {/* The state in words, for anyone not reading the colour.
                    Hidden visually because the bar already says it to those
                    who are. The global utility, not a local copy — see
                    utilities.css. */}
                <span className="visually-hidden">
                  {step.unsettled
                    ? '：未完了'
                    : step.state === 'done'
                      ? '：完了'
                      : step.state === 'current'
                        ? '：対応中'
                        : '：未対応'}
                </span>
              </span>

              {step.hint && <span className={styles.hint}>{step.hint}</span>}
            </span>
          </li>
        ))}
      </ol>

      {/* Notes that are not steps. Each one is a thing the customer may need
          to act on, which is why they sit under the bar rather than being
          folded into a step's colour. */}
      {progress.paymentFailed && (
        <p className={`${styles.note} ${styles.noteAlert}`}>
          お支払いが確認できませんでした。お手数ですが
          <a href="/contact" className={styles.noteLink}>
            お問い合わせ
          </a>
          ください。
        </p>
      )}

      {progress.payLater && (
        <p className={styles.note}>
          後払いのご注文です。お支払い期限までにお手続きをお願いいたします。
        </p>
      )}

      {progress.awaitingPayment && !progress.paymentFailed && !progress.payLater && (
        <p className={styles.note}>
          お振込の確認までに、数日お時間をいただく場合がございます。
        </p>
      )}
    </div>
  );
}
