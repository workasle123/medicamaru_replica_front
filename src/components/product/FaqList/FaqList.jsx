import styles from './FaqList.module.css';

/**
 * FaqList — expandable question list.
 *
 * Native <details>/<summary>, so it needs no JavaScript, is keyboard
 * accessible for free, and is expandable before hydration. The corresponding
 * FAQPage JSON-LD is emitted by the page, not here, so the structured data
 * covers the same items regardless of open state.
 *
 * `initialCount` hides the overflow behind a "show more" toggle that is
 * itself a <details>, so the remaining questions stay in the HTML — crawlable
 * and findable with in-page search — rather than being withheld until a
 * script runs.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Faq[]} props.faqs
 * @param {string} [props.title]
 * @param {string} [props.id]  Anchor id — must be unique when a page renders
 *                             more than one group (e.g. the FAQ page).
 * @param {number} [props.initialCount]  Shown before "show more"; all by default.
 * @param {React.ReactNode} [props.icon]  Optional icon beside the heading — the
 *                             FAQ page gives each topic group its own.
 */
export default function FaqList({ faqs = [], title = 'よくあるご質問', id = 'faq', initialCount, icon }) {
  if (!faqs.length) return null;

  const limit = initialCount ?? faqs.length;
  const shown = faqs.slice(0, limit);
  const rest = faqs.slice(limit);

  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.title}>
        {icon && (
          <span className={styles.titleIcon} aria-hidden="true">
            {icon}
          </span>
        )}
        {title}
      </h2>

      <div className={styles.list}>
        {shown.map((faq, i) => (
          <Item key={faq.question} faq={faq} open={i === 0} />
        ))}
      </div>

      {rest.length > 0 && (
        <details className={styles.more}>
          <summary className={styles.moreToggle}>
            さらに表示（残り{rest.length}件）
          </summary>
          <div className={styles.list}>
            {rest.map((faq) => (
              <Item key={faq.question} faq={faq} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

/* The Q and A marks are decoration — the convention Japanese FAQ pages use to
   tell a question from its answer at a glance. They are aria-hidden so a screen
   reader announces the question itself as the summary's name, not "Q". */
function Item({ faq, open = false }) {
  return (
    <details className={styles.item} open={open}>
      <summary className={styles.question}>
        <span className={styles.mark} aria-hidden="true">
          Q
        </span>
        <span className={styles.questionText}>{faq.question}</span>
      </summary>
      <div className={styles.answer}>
        <span className={`${styles.mark} ${styles.markAnswer}`} aria-hidden="true">
          A
        </span>
        {/* `html` is already sanitised (richTextHtml, in the normaliser). */}
        {faq.html ? (
          <div className={styles.answerText} dangerouslySetInnerHTML={{ __html: faq.html }} />
        ) : (
          <div className={styles.answerText}>{faq.answer}</div>
        )}
      </div>
    </details>
  );
}
