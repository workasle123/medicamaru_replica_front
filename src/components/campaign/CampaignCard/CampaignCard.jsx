import Image from 'next/image';
import Link from 'next/link';

import CouponCode from '@/components/campaign/CouponCode/CouponCode';
import {
  daysRemaining,
  formatBenefit,
  formatDate,
  formatDiscountCap,
  formatYen,
  toIsoDate,
} from '@/lib/format';

import styles from './CampaignCard.module.css';

/**
 * CampaignCard — one offer, in full.
 *
 * Everything a visitor needs in order to use the coupon is above the fold of
 * the card and in plain sight: what they get, what it costs them to qualify,
 * when it ends, and the code. The terms — four paragraphs of boilerplate that
 * is near-identical across all eight offers — go in a closed <details>, which
 * is the only thing here that collapses.
 *
 * The artwork is `contain` on a tinted band, not `cover`. The eight live
 * banners come in two shapes, 4.43:1 for the ones that double as carousel
 * slides and 1.99:1 for the ones that double as side banners, and these are
 * not photographs: every one of them is a composed graphic with wording in it.
 * Cropping a 1.99:1 graphic into a 4.43:1 box would cut that wording in half.
 * The band is the dominant ratio, so four of them fill it exactly and the
 * other three sit centred on the tint.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Campaign} props.campaign
 * @param {number} props.index  1-based, shown as the card's number
 */
export default function CampaignCard({ campaign, index }) {
  const { id, title, couponCode, startsAt, endsAt, minSpend, benefit, image, html, isReferral } =
    campaign;
  const remaining = daysRemaining(endsAt);

  return (
    <article className={styles.card} id={`campaign-${id}`}>
      {image && (
        <figure className={styles.figure}>
          <Image
            src={image.url}
            alt=""
            /* The published artwork spec, not a measurement: the endpoint
               sends paths only. These reserve the box until the file decodes,
               after which `height: auto` uses the file's real ratio. */
            width={1200}
            height={600}
            className={styles.image}
            sizes="(max-width: 1023px) 100vw, 816px"
          />
        </figure>
      )}

      <div className={styles.body}>
        <header className={styles.header}>
          <span className={styles.index} aria-hidden="true">
            {String(index).padStart(2, '0')}
          </span>
          <h2 className={styles.title}>{title}</h2>
          {benefit && <p className={styles.benefit}>{formatBenefit(benefit)}</p>}
        </header>

        {/* A referral campaign has no shared code: each customer's is their
            own and lives on My Page, so the card points there instead of
            showing a chip nobody could use. Printing one code for everyone
            would hand out a discount that has nothing to do with referring
            anyone. */}
        {isReferral && !couponCode ? (
          <Link href="/my-account/referral" className={styles.referralCta}>
            マイページで紹介コードを確認する
          </Link>
        ) : (
          <CouponCode code={couponCode} />
        )}

        <dl className={styles.facts}>
          {benefit && (
            <div className={styles.fact}>
              <dt>割引</dt>
              <dd>{formatBenefit(benefit)}</dd>
            </div>
          )}
          {/* The ceiling on a 「最大◯%オフ」 offer. Its own row rather than a
              parenthesis after the percentage: the headline stays readable,
              and the one number that decides what the offer is actually worth
              gets stated as plainly as the minimum spend below it. Renders
              nothing for an uncapped coupon. */}
          {formatDiscountCap(benefit) && (
            <div className={styles.fact}>
              <dt>割引上限</dt>
              <dd>{formatYen(benefit.maxDiscount)}</dd>
            </div>
          )}
          {minSpend && (
            <div className={styles.fact}>
              <dt>最低ご注文金額</dt>
              <dd>{formatYen(minSpend)}以上</dd>
            </div>
          )}
          <div className={styles.fact}>
            <dt>期間</dt>
            <dd>
              {startsAt && <time dateTime={toIsoDate(startsAt)}>{formatDate(startsAt)}</time>}
              {startsAt && endsAt && ' 〜 '}
              {endsAt ? (
                <time dateTime={toIsoDate(endsAt)}>{formatDate(endsAt)}</time>
              ) : (
                '終了日未定'
              )}
              {remaining !== null && remaining <= 30 && (
                <span className={styles.ending}>
                  {remaining <= 0 ? '本日まで' : `残り${remaining}日`}
                </span>
              )}
            </dd>
          </div>
        </dl>

        {html && (
          <details className={styles.terms}>
            <summary className={styles.summary}>詳細・ご利用条件を見る</summary>
            <div className={styles.termsBody} dangerouslySetInnerHTML={{ __html: html }} />
          </details>
        )}
      </div>
    </article>
  );
}
