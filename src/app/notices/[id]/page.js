import Link from 'next/link';
import { notFound } from 'next/navigation';

import ContentPage from '@/components/content/ContentPage/ContentPage';
import NoticeList from '@/components/sidebar/NoticeList/NoticeList';
import { noticeColumns } from '@/components/sidebar/SideColumns';
import { buildMetadata } from '@/lib/seo';
import { formatNoticeDate } from '@/lib/format';
import { getNotice, listAllNotices } from '@/services/notices.service';
import { listAllCategories } from '@/services/categories.service';
import { listRankedProducts } from '@/services/products.service';
import { listFaqGroups } from '@/services/home.service';

import styles from '../Notices.module.css';

export const revalidate = 600;

/* None prerendered: each notice renders on first request and is then cached
   for the ten minutes above, as the product pages do. */
export async function generateStaticParams() {
  return [];
}

/** The URL's id, or null for anything that is not a plain number. */
function parseId(raw) {
  return /^\d{1,18}$/.test(raw) ? Number(raw) : null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const noticeId = parseId(id);
  const result = noticeId ? await getNotice(noticeId) : null;

  if (!result) {
    return buildMetadata({ title: 'お知らせが見つかりません', path: `/notices/${id}`, noIndex: true });
  }

  return buildMetadata({
    title: result.notice.title,
    description: result.notice.excerpt || result.notice.title,
    path: `/notices/${result.notice.id}`,
  });
}

/**
 * One notice in full: Admin → Notices' description, which may carry links and
 * simple formatting from the editor, already sanitised by richTextHtml.
 */
export default async function NoticePage({ params }) {
  const { id } = await params;
  const noticeId = parseId(id);
  if (!noticeId) notFound();

  /* Side boxes swallow their own failures (see /notices): only the notice
     itself can fail or 404 this page. */
  const [result, notices, categories, ranked, faqGroups] = await Promise.all([
    getNotice(noticeId),
    listAllNotices(),
    listAllCategories(),
    listRankedProducts(5),
    listFaqGroups().catch(() => []),
  ]);
  if (!result) notFound();

  const { notice, newer, older } = result;
  const others = notices.filter((n) => n.id !== notice.id).slice(0, 5);

  return (
    <ContentPage
      title={notice.title}
      breadcrumbs={[{ name: 'お知らせ', href: '/notices' }, { name: notice.title }]}
      meta={
        notice.date && <time dateTime={notice.date}>{formatNoticeDate(notice.date)}</time>
      }
      {...noticeColumns({
        categories,
        ranked,
        faqGroups,
        middle: (
          <NoticeList
            notices={others}
            title="その他のお知らせ"
            emptyText="ほかのお知らせはありません。"
          />
        ),
      })}
    >
      {notice.html && (
        <div className={styles.notice} dangerouslySetInnerHTML={{ __html: notice.html }} />
      )}

      {(older || newer) && (
        <nav className={styles.pager} aria-label="前後のお知らせ">
          {older && (
            <Link href={`/notices/${older.id}`} className={styles.pagerLink}>
              <span className={styles.pagerLabel}>‹ 前のお知らせ</span>
              <span className={styles.pagerTitle}>{older.title}</span>
            </Link>
          )}
          {newer && (
            <Link href={`/notices/${newer.id}`} className={`${styles.pagerLink} ${styles.pagerNext}`}>
              <span className={styles.pagerLabel}>次のお知らせ ›</span>
              <span className={styles.pagerTitle}>{newer.title}</span>
            </Link>
          )}
        </nav>
      )}

      <p className={styles.back}>
        <Link href="/notices">お知らせ一覧へ戻る</Link>
      </p>
    </ContentPage>
  );
}
