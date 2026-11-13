import CampaignCard from '@/components/campaign/CampaignCard/CampaignCard';
import ContentPage from '@/components/content/ContentPage/ContentPage';
import { memberColumn } from '@/components/sidebar/SideColumns';
import SidebarPromos from '@/components/sidebar/SidebarPromos/SidebarPromos';
import { buildMetadata } from '@/lib/seo';
import { listCampaigns } from '@/services/campaigns.service';
import { listRankedProducts } from '@/services/products.service';
import { listFaqGroups } from '@/services/home.service';

import styles from './Campaign.module.css';

export const metadata = buildMetadata({
  title: 'キャンペーン・クーポン一覧',
  description:
    'お薬らくで実施中のキャンペーンとクーポンコードの一覧です。割引率、最低ご注文金額、実施期間をまとめてご確認いただけます。',
  path: '/campaign',
});

/* Same window as the banners these rows come from, and for the same reason: an
   offer switched off in the admin should stop being advertised promptly, and
   the campaign page is the most conspicuous place it would linger. */
export const revalidate = 600;

/**
 * /campaign — every live offer, with its code.
 *
 * One card per offer, each carrying its artwork, its code and its terms. The
 * source platform's arrangement is a 180px thumbnail, the code as a line of
 * body text, and the terms behind an accordion that gives no hint of what is
 * inside it; a card that shows the code and the conditions without being asked
 * is the difference.
 *
 * There was a summary table above these, listing all eight codes at once for
 * someone who had come back only for a code. It was removed — the cards say
 * the same things, and saying them twice down one page made the page read as
 * two documents.
 *
 * No /campaign/<id> routes. Eight offers whose terms are the same four
 * paragraphs of coupon boilerplate would make eight pages differing by a
 * sentence, all competing with this one for the same query.
 */
export default async function CampaignPage() {
  /* No listAllCategories here, unlike every other ContentPage: the left
     column no longer carries the category menu, so the call would be made and
     thrown away. One fewer request against a backend with a hard ceiling on
     concurrent connections. */
  const [campaigns, ranked, faqGroups] = await Promise.all([
    listCampaigns(),
    listRankedProducts(5),
    listFaqGroups().catch(() => []),
  ]);

  return (
    <ContentPage
      title="キャンペーン・クーポン一覧"
      /* Thirteen characters — the longest title on the site, and the only one
         that needs two lines on a phone without this. */
      fitTitle
      lead="お薬らくで実施中のキャンペーンです。クーポンコードはご注文手続きの画面でご入力ください。"
      breadcrumbs={[{ name: 'キャンペーン' }]}
      /* The left column is this page's alone: promos in place of the category
         menu, the login box and the newsletter sign-up that noticeColumns puts
         there. Someone reading a list of coupons has already decided to buy,
         so the space goes to finding a product without knowing its name, and
         to the account needed to spend the coupon.

         phone: false, as it was before. On a phone the side column renders
         AFTER the article, so a promo there would sit below eight campaign
         cards — past the point anyone is still reading. */
      start={{
        label: '症状から探す・会員登録',
        phone: false,
        content: <SidebarPromos />,
      }}
      /* The right column is untouched. login stays false, as noticeColumns had
         it — it was false because the login box used to be on the left, and
         the register card now covers that ground with a link to ログイン too. */
      end={memberColumn({ login: false, ranked, faqGroups })}
    >
      {campaigns.length === 0 ? (
        <p className={styles.empty}>
          現在、実施中のキャンペーンはありません。新しいキャンペーンは、こちらのページとLINEでお知らせします。
        </p>
      ) : (
        <div className={styles.page}>
          <div className={styles.list}>
            {campaigns.map((campaign, i) => (
              <CampaignCard key={campaign.id} campaign={campaign} index={i + 1} />
            ))}
          </div>

          {/* Said once at the end rather than on all eight cards, where it
              would be the ninth near-identical paragraph of small print. */}
          <aside className={styles.note}>
            <h2 className={styles.noteHeading}>クーポンご利用にあたって</h2>
            <ul className={styles.noteList}>
              <li>クーポンはお一人さまにつき1枚のご利用となり、併用はできません。</li>
              <li>
                特別価格の商品、同梱配送の商品、同意書が必要な商品にはご利用いただけません。
              </li>
              <li>
                キャンペーンの内容は予告なく変更・終了する場合があります。最新の内容はこのページでご確認ください。
              </li>
            </ul>
          </aside>
        </div>
      )}
    </ContentPage>
  );
}
