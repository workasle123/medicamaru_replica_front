'use client';

import styles from './Invoice.module.css';

/**
 * 印刷 / PDF保存.
 *
 * `window.print()` and nothing else. Every browser's print dialog offers
 * "Save as PDF" (or "Microsoft Print to PDF" on Windows), so this is the
 * download the customer asked for — without a server-rendered PDF, a job
 * queue, or a file sitting on the public disk at a guessable path.
 *
 * Rendered as a button, not a link: there is no URL for "print this", and a
 * link that goes nowhere is the wrong element for it. It disappears from the
 * printed sheet itself — see .actions in the stylesheet.
 */
export default function PrintButton() {
  return (
    <button type="button" className={styles.printButton} onClick={() => window.print()}>
      印刷 / PDFで保存
    </button>
  );
}
