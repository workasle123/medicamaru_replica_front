import Link from 'next/link';

import ContentPage from '@/components/content/ContentPage/ContentPage';
import { noticeColumns } from '@/components/sidebar/SideColumns';
import { pageMetadata } from '@/lib/seo';
import { formatNoticeDate } from '@/lib/format';
import { listAllNotices } from '@/services/notices.service';
import { listAllCategories } from '@/services/categories.service';
import { listRankedProducts } from '@/services/products.service';
import { listFaqGroups } from '@/services/home.service';

import styles from './Notices.module.css';

export const generateMetadata = pageMetadata('/notices', {
  title: 'お知らせ',
  description: 'お薬らくからのお知らせ一覧です。発送スケジュールやサービスの最新情報をお届けします。',
});

/* Admin → Notices edits appear within ten minutes, the API fetch's window. */
export const revalidate = 600;

/**
 * Every active notice, newest Notice Date first. No pagination: notices are
 * few, and the list is only titles and a line of each.
 */
export default async function NoticesPage() {
  /* The side boxes' data swallows its own failures (the FAQ groups here, since
     listFaqGroups rethrows an outage for the FAQ page's sake): only the
     notices can fail this page. */
  const [notices, categories, ranked, faqGroups] = await Promise.all([
    listAllNotices(),
    listAllCategories(),
    listRankedProducts(5),
    listFaqGroups().catch(() => []),
  ]);

  return (
    <ContentPage
      title="お知らせ"
      lead="お薬らくからの最新のお知らせです。"
      {...noticeColumns({ categories, ranked, faqGroups })}
    >
      {notices.length === 0 ? (
        <p className={styles.empty}>現在、お知らせはありません。</p>
      ) : (
        <div className={styles.index}>
          <ul className={styles.list}>
            {notices.map((notice) => (
              <li key={notice.id}>
                <Link href={`/notices/${notice.id}`} className={styles.itemLink}>
                  {notice.date && (
                    <time dateTime={notice.date} className={styles.date}>
                      {formatNoticeDate(notice.date)}
                    </time>
                  )}
                  <span className={styles.itemTitle}>{notice.title}</span>
                  {notice.excerpt && <span className={styles.excerpt}>{notice.excerpt}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ContentPage>
  );
}
