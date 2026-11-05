import SideBox from '../SideBox/SideBox';
import { IconShare } from '../icons';
import SocialIcon from '@/components/ui/SocialIcon/SocialIcon';
import { SOCIAL_LINKS } from '@/constants/nav';
import styles from './SocialFollow.module.css';

/**
 * SocialFollow — the official accounts, one full-width button each.
 *
 * The same SOCIAL_LINKS as the footer, so an account is added in one place (a
 * SOCIAL_*_URL variable on the server). Accounts without a URL are left out,
 * and the box with them when none is set, rather than showing dead buttons.
 *
 * Server Component: the URLs are read from the server environment.
 */
export default function SocialFollow() {
  const socials = SOCIAL_LINKS.filter((s) => s.url);
  if (socials.length === 0) return null;

  return (
    <SideBox id="side-social" title="公式SNS" icon={<IconShare />}>
      <p className={styles.lead}>最新情報やキャンペーンをお知らせしています。</p>
      <ul className={styles.list}>
        {socials.map((s) => (
          <li key={s.key}>
            <a
              href={s.url}
              className={`${styles.link} ${styles[s.key] ?? ''}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SocialIcon name={s.key} size={20} />
              <span className={styles.label}>{s.label}</span>
              <span className="visually-hidden">（新しいタブで開きます）</span>
            </a>
          </li>
        ))}
      </ul>
    </SideBox>
  );
}
