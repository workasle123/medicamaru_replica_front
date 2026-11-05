import Link from 'next/link';

import SideBox from '../SideBox/SideBox';
import { IconQuestion } from '../icons';
import FaqGroupIcon from '@/components/faq/FaqGroupIcon/FaqGroupIcon';
import styles from './FaqShortcuts.module.css';

/**
 * FaqShortcuts — the FAQ's topics (Admin → FAQ Groups), each linking straight
 * to its section on /faq. Nothing renders when there are none.
 *
 * @param {Object} props
 * @param {import('@/lib/types').FaqGroup[]} props.groups
 */
export default function FaqShortcuts({ groups }) {
  if (groups.length === 0) return null;

  return (
    <SideBox id="side-faq" title="よくあるご質問" icon={<IconQuestion />} flush>
      <ul className={styles.list}>
        {groups.map((group) => (
          <li key={group.id}>
            <Link href={`/faq#faq-group-${group.id}`} className={styles.link}>
              <span className={styles.icon} aria-hidden="true">
                <FaqGroupIcon name={group.icon} />
              </span>
              <span className={styles.name}>{group.name}</span>
              <span className={styles.count}>{group.faqs.length}件</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/faq" className={styles.all}>
        よくあるご質問をすべて見る
      </Link>
    </SideBox>
  );
}
