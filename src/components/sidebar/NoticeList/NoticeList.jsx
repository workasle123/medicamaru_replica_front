import Link from 'next/link';

import SideBox from '../SideBox/SideBox';
import { IconBell } from '../icons';
import { formatNoticeDate } from '@/lib/format';
import styles from './NoticeList.module.css';

/**
 * NoticeList — お知らせ from Admin → Notices, newest Notice Date first. Each
 * title links to its own page (/notices/[id]), and the box ends with a link to
 * the full list.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Notice[]} props.notices
 * @param {string} [props.title]  e.g. その他のお知らせ beside a notice
 * @param {string} [props.emptyText]
 */
export default function NoticeList({
  notices,
  title = 'お知らせ',
  emptyText = '現在、お知らせはありません。',
}) {
  return (
    <SideBox id="side-notices" title={title} icon={<IconBell />} flush>
      {notices.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <ul className={styles.list}>
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link href={`/notices/${notice.id}`} className={styles.link}>
                {notice.date && (
                  <time dateTime={notice.date} className={styles.date}>
                    {formatNoticeDate(notice.date)}
                  </time>
                )}
                <span className={styles.title}>{notice.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/notices" className={styles.all}>
        お知らせ一覧を見る
      </Link>
    </SideBox>
  );
}
