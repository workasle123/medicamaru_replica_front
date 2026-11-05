import CategoryMenu from './CategoryMenu/CategoryMenu';
import RankingBox from './RankingBox/RankingBox';
import NewsletterSignup from './NewsletterSignup/NewsletterSignup';
import SidebarLogin from './SidebarLogin/SidebarLogin';
import FaqShortcuts from './FaqShortcuts/FaqShortcuts';
import SocialFollow from './SocialFollow/SocialFollow';
import SupportHours from './SupportHours/SupportHours';
import styles from './SideColumns.module.css';

/*
 * The side columns shared by the FAQ and notice pages, in ContentPage's
 * `start` / `end` shape, so every page with them has the same boxes in the
 * same order. A box whose data is empty renders nothing.
 *
 * The login box sits on the right by default (the FAQ page) or on the left
 * under the categories (`loginOnLeft`, the notice pages, which lead the right
 * column with the best sellers instead).
 *
 * On phones only the box a page passes as `middle` stays (its notices): the
 * header already carries the category menu and login, and a long run of side
 * boxes under the content buried the one part that changes.
 */

/**
 * Left: every category, the login box (with `login`), then the newsletter
 * sign-up. Left out on phones.
 *
 * @param {import('@/lib/types').Category[]} categories
 * @param {{login?: boolean}} [options]
 */
export function categoryColumn(categories, { login = false } = {}) {
  return {
    label: login ? 'カテゴリー・ログイン' : 'カテゴリー・メールマガジン',
    phone: false,
    content: (
      <>
        <CategoryMenu categories={categories} />
        {login && <SidebarLogin />}
        <NewsletterSignup />
      </>
    ),
  };
}

/**
 * Right: the login box (unless `login: false` — see categoryColumn), the best
 * sellers and FAQ topics (when given), `middle` (when given), then the social
 * accounts. On phones only `middle` shows, and without one the column is left
 * out there.
 *
 * @param {{
 *   login?: boolean,
 *   ranked?: import('@/lib/types').ProductSummary[],
 *   faqGroups?: import('@/lib/types').FaqGroup[],
 *   middle?: React.ReactNode,
 * }} [options]
 */
export function memberColumn({ login = true, ranked = [], faqGroups = [], middle } = {}) {
  const lead = login ? 'ログイン' : '売れ筋ランキング';

  return {
    label: middle ? `${lead}・お知らせ` : `${lead}・よくあるご質問`,
    phone: Boolean(middle),
    content: (
      <>
        <div className={styles.notOnPhone}>
          {login && <SidebarLogin />}
          <RankingBox products={ranked} />
          <FaqShortcuts groups={faqGroups} />
        </div>
        {middle}
        <div className={styles.notOnPhone}>
          <SocialFollow />
        </div>
      </>
    ),
  };
}

/**
 * The notice pages' pair: login on the left under the categories, the best
 * sellers leading the right column.
 *
 * @param {Object} data
 * @param {import('@/lib/types').Category[]} data.categories
 * @param {import('@/lib/types').ProductSummary[]} data.ranked
 * @param {import('@/lib/types').FaqGroup[]} data.faqGroups
 * @param {React.ReactNode} [data.middle]
 */
export function noticeColumns({ categories, ranked, faqGroups, middle }) {
  return {
    start: categoryColumn(categories, { login: true }),
    end: memberColumn({ login: false, ranked, faqGroups, middle }),
  };
}

/**
 * The contact page's pair.
 *
 * Deliberately NOT memberColumn: the best-seller rail belongs on a browsing
 * page, not beside a form someone reaches when something has gone wrong. The
 * right column instead tries to answer the enquiry before it is written —
 * the FAQ topics, when a reply will come, and the recent notices, since a
 * shipping delay posted there is what half these messages are about.
 *
 * Login is on the left under the categories: an order enquiry usually ends in
 * 注文履歴 anyway.
 *
 * @param {Object} data
 * @param {import('@/lib/types').Category[]} data.categories
 * @param {import('@/lib/types').FaqGroup[]} data.faqGroups
 * @param {React.ReactNode} [data.notices]
 */
export function contactColumns({ categories, faqGroups, notices }) {
  return {
    start: categoryColumn(categories, { login: true }),
    end: {
      label: 'よくあるご質問・受付時間',
      /* The notices stay on phones — the rest is already in the header, and a
         stack of boxes under the form pushes the send button out of reach. */
      phone: Boolean(notices),
      content: (
        <>
          <div className={styles.notOnPhone}>
            <FaqShortcuts groups={faqGroups} />
            <SupportHours />
          </div>
          {notices}
          <div className={styles.notOnPhone}>
            <SocialFollow />
          </div>
        </>
      ),
    },
  };
}
