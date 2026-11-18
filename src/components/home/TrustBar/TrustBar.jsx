import Link from 'next/link';

import styles from './TrustBar.module.css';

/**
 * TrustBar — four short reassurances directly under the opening card.
 *
 * Only statements the shop already makes elsewhere (the product page's
 * 正規品保証 / 海外からの発送 / 通常10〜14日 badges and the guide pages). The
 * last two are links, because they are the two questions a first-time buyer
 * of an imported medicine actually has.
 */
const ITEMS = [
  { icon: 'shield', title: '正規品保証', text: '正規品をお届けします' },
  { icon: 'globe', title: '海外から発送', text: '通常10〜14日で発送予定' },
  { icon: 'book', title: '個人輸入ガイド', text: 'ご利用前にご確認ください', href: '/about-personal-import' },
  { icon: 'help', title: 'よくあるご質問', text: 'ご注文・配送について', href: '/faq' },
];

const PATHS = {
  shield: <path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3Zm-1 12-3-3 1.4-1.4L11 12.2l3.6-3.6L16 10l-5 5Z" />,
  globe: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3a15 15 0 0 0-1.2-5A8 8 0 0 1 18.9 11ZM12 4c.8 1 1.7 3.2 2 7h-4c.3-3.8 1.2-6 2-7ZM9.3 6a15 15 0 0 0-1.2 5h-3A8 8 0 0 1 9.3 6ZM5.1 13h3c.1 1.8.5 3.5 1.2 5A8 8 0 0 1 5.1 13Zm4.9 0h4c-.3 3.8-1.2 6-2 7-.8-1-1.7-3.2-2-7Zm4.7 5c.7-1.5 1.1-3.2 1.2-5h3a8 8 0 0 1-4.2 5Z" />,
  book: <path d="M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3V3Zm2 13.2A3 3 0 0 1 8 16h9V6a1 1 0 0 0-1-1H7v11.2ZM8 18a1 1 0 0 0 0 2h9v-2H8Z" />,
  help: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm1.7-6.1-.9.9c-.5.5-.8.9-.8 2.2h-2v-.5c0-1 .4-1.9 1.100-2.600l1.200-1.200a1.700 1.700 0 0 0 .5-1.200 2 2 0 0 0-4 0H8a4 4 0 1 1 8 0c0 .9-.4 1.700-1.300 2.400Z" />,
};

export default function TrustBar() {
  return (
    <ul className={styles.bar} aria-label="ご利用のポイント">
      {ITEMS.map(({ icon, title, text, href }) => {
        const body = (
          <>
            <span className={styles.icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">{PATHS[icon]}</svg>
            </span>
            <span className={styles.label}>
              <strong className={styles.title}>{title}</strong>
              <span className={styles.text}>{text}</span>
            </span>
          </>
        );
        return (
          <li key={title} className={styles.item}>
            {href ? (
              <Link href={href} className={styles.link}>{body}</Link>
            ) : (
              <div className={styles.link}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
