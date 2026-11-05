import Link from 'next/link';

import ContentPage from '@/components/content/ContentPage/ContentPage';
import FaqList from '@/components/product/FaqList/FaqList';
import NoticeList from '@/components/sidebar/NoticeList/NoticeList';
import FaqGroupIcon from '@/components/faq/FaqGroupIcon/FaqGroupIcon';
import { categoryColumn, memberColumn } from '@/components/sidebar/SideColumns';
import { pageMetadata } from '@/lib/seo';
import { JsonLd, faqPage, abs } from '@/schema';
import { listFaqGroups } from '@/services/home.service';
import { listNotices } from '@/services/notices.service';
import { listAllCategories } from '@/services/categories.service';

import styles from './Faq.module.css';

export const generateMetadata = pageMetadata('/faq', {
  title: 'よくあるご質問',
  description:
    'ご注文、お支払い、配送、個人輸入についてのよくあるご質問をまとめています。',
});

/* Admin edits (FAQ, FAQ Groups, Notices) reach the page within ten minutes —
   the same window as the API fetches behind it. */
export const revalidate = 600;

/* Short label for the jump menu. At phone width a tile is ~170px, and
   「商品・個人輸入について」 broke mid-word across three lines, so the
   trailing 「について」 that every heading carries is dropped here. */
function shortLabel(name) {
  return name.replace(/について$/, '') || name;
}

/* The newest admin edit among the FAQs shown, for the 最終更新日 line. */
function lastUpdated(groups) {
  const times = groups
    .flatMap((g) => g.faqs)
    .map((f) => new Date(f.updatedAt ?? '').getTime())
    .filter((t) => !Number.isNaN(t));
  return times.length ? new Date(Math.max(...times)).toISOString() : undefined;
}

export default async function FaqPage() {
  /* All three at once. The side columns degrade to nothing on failure; only
     the FAQs themselves can fail the page (see listFaqGroups). */
  const [groups, categories, notices] = await Promise.all([
    listFaqGroups(),
    listAllCategories(),
    listNotices(5),
  ]);

  /* One FAQPage covering every group, so the structured data matches the whole
     page rather than an arbitrary section of it. The SEO team has not specified
     a graph for /faq, so this keeps the shared builder from src/schema. */
  const schema = faqPage(groups.flatMap((g) => g.faqs), `${abs('/faq')}#faq`);

  return (
    <>
      <JsonLd data={schema} />

      <ContentPage
        title="よくあるご質問"
        lead="ご注文、お支払い、配送、個人輸入についてのご質問にお答えします。"
        updatedAt={lastUpdated(groups)}
        start={categoryColumn(categories)}
        end={memberColumn({ middle: <NoticeList notices={notices} /> })}
      >
        {groups.length === 0 ? (
          <p className={styles.empty}>
            よくあるご質問は現在準備中です。ご不明な点は
            <Link href="/contact">お問い合わせ</Link>
            ください。
          </p>
        ) : (
          <>
            {/* Jump menu: every topic visible up front, one tap from its
                answers, instead of scrolling past three groups to reach the
                fourth. The count sits under the label to leave it the
                tile's full width. */}
            <nav className={styles.jump} aria-label="質問のカテゴリー">
              <ul className={styles.jumpList}>
                {groups.map((group) => (
                  <li key={group.id}>
                    <a href={`#faq-group-${group.id}`} className={styles.jumpLink}>
                      <span className={styles.jumpIcon} aria-hidden="true">
                        <FaqGroupIcon name={group.icon} />
                      </span>
                      <span className={styles.jumpText}>
                        <span className={styles.jumpLabel}>{shortLabel(group.name)}</span>
                        <span className={styles.jumpCount}>{group.faqs.length}件の質問</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {groups.map((group) => (
              <FaqList
                key={group.id}
                id={`faq-group-${group.id}`}
                faqs={group.faqs}
                title={group.name}
                icon={<FaqGroupIcon name={group.icon} />}
              />
            ))}
          </>
        )}
      </ContentPage>
    </>
  );
}
