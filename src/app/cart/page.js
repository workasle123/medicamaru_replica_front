import Image from 'next/image';
import Link from 'next/link';

import styles from './Cart.module.css';
import CheckoutBar from './CheckoutBar';
import CouponForm from './CouponForm';
import QuantitySelect from './QuantitySelect';
import DeliverySplitToggle from './DeliverySplitToggle';
import RemoveLineButton from './RemoveLineButton';
import PointsForm from './PointsForm';
import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import Button from '@/components/ui/Button/Button';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { getCart, listRedeemedCoupons } from '@/services/cart.service';
import { listCampaigns } from '@/services/campaigns.service';
import { getCustomerId } from '@/lib/auth/session';
import { pageMetadata } from '@/lib/seo';
import { formatYenSuffix, formatNumber } from '@/lib/format';

/** Cart contents are per-visitor and live — never cached. */
export const dynamic = 'force-dynamic';

export const generateMetadata = pageMetadata('/cart', {
  title: 'ショッピングカート',
  noIndex: true,
});

export default async function CartPage() {
  // Every figure below is the backend's calculation. Nothing on this page
  // adds anything up (brief §17).
  /* The coupons on offer, so the picker can list them instead of asking the
     customer to remember a code from the campaign page. Fetched alongside
     rather than before: a coupon list that fails to load must not take the
     cart down with it, and listCampaigns already returns [] for anything
     short of a real outage. */
  const [cart, campaigns, customerId, redeemed] = await Promise.all([
    getCart(),
    listCampaigns().catch(() => []),
    /* Guest or not. The points panel used to infer this from a zero balance,
       which is also what a signed-in customer who has not earned any looks
       like — and the two need different words. */
    getCustomerId(),
    /* Coupons this customer has already spent. The campaign list comes from a
       public endpoint that cannot know who is reading it, so the ones marked
       「お一人様一回限り」 were still being offered after they had been used —
       and refused the moment they were entered. */
    listRedeemedCoupons(),
  ]);

  /* `discount` is the sum of every applied discount. Coupon and points are
     broken out below, so anything left over — a referral credit — still needs
     a line of its own or the summary will not add up to the total. */
  const otherDiscount = Math.max(0, cart.discount - cart.couponDiscount - cart.pointsApplied);

  /* Only the five fields the picker shows. A Campaign also carries `html` —
     several hundred characters of coupon small print each — and handing the
     whole record to a Client Component would serialise all of it into the
     payload to render none of it. */
  const couponChoices = campaigns
    .filter((c) => !redeemed.includes(String(c.id)))
    .map((c) => ({
      id: c.id,
      couponCode: c.couponCode,
      title: c.title,
      benefit: c.benefit,
      minSpend: c.minSpend,
      endsAt: c.endsAt,
    }));

  if (!cart.lines.length) {
    return (
      <div className="container">
        <Breadcrumbs items={[{ name: 'カート' }]} />
        <div className="section">
          <h1 className={styles.title}>ショッピングカート</h1>
          <EmptyState
            title="カートに商品がありません"
            body="気になる商品をカートに追加すると、こちらに表示されます。"
            actionHref="/category"
            actionLabel="商品を探す"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: 'カート' }]} />

      <h1 className={styles.title}>ショッピングカート</h1>

      <div className={styles.layout}>
        <div>
          {/* The 送料無料 nudge, back as of 2026-10-10.

              It was removed on 2026-09-29 because it could not tell the truth:
              the API reported no threshold, so `amountToFreeShipping` was
              pinned at 0, the "あと X円" branch never ran, and the else-branch
              announced 「送料無料の対象です。」 on every cart — including ones
              being charged ¥782. The backend now resolves a real offer from
              the admin and sends both figures.

              Rendered ONLY when a threshold exists. `null` means no offer is
              running and nothing should be said; 0 means the cart has reached
              one, which is a different message. Conflating them is what
              produced the false claim last time, so the check is against null
              explicitly rather than falsiness. */}
          {cart.freeShippingThreshold != null && (
            <p className={styles.freeShip} data-reached={cart.amountToFreeShipping === 0}>
              {cart.amountToFreeShipping > 0 ? (
                <>
                  あと<span className="numeric">{formatYenSuffix(cart.amountToFreeShipping)}</span>
                  で送料無料になります。
                </>
              ) : (
                <>送料無料の対象です。</>
              )}
            </p>
          )}

          {/* Above the items, not below them: these are the terms the
              quantity on each line is subject to, and the over-limit dialog
              refers back to the first of them. */}
          {/* No role="list": base.css strips the markers from ul[role='list'],
              which exists so a list that LOOKS unstyled keeps its semantics.
              These want their markers, so the native list is already right and
              the attribute would only take the bullets away. */}
          <ul className={styles.terms}>
            <li>商品は日本の個人輸入制度に基づいて提供するものであり、個人での使用目的に限ります。</li>
            <li>数量に限りがあります。</li>
            <li>転売は厳禁です。</li>
          </ul>

          <ul className={styles.lines} role="list">
            {cart.lines.map((line) => (
              <li key={line.id} className={styles.line}>
                <div className={styles.thumb}>
                  <Image
                    src={line.image.url}
                    alt={line.image.alt || line.productName}
                    width={96}
                    height={96}
                    className={styles.thumbImage}
                  />
                </div>

                <div className={styles.lineInfo}>
                  <p className={styles.lineName}>
                    <Link href={`/product/${line.slug}`}>{line.productName}</Link>
                  </p>
                  <p className={styles.linePack}>{line.packLabel}</p>
                  <p className={`${styles.lineUnit} numeric`}>
                    単価 {formatYenSuffix(line.unitPrice)}
                  </p>

                  <div className={styles.lineControls}>
                    <QuantitySelect line={line} />

                    <RemoveLineButton
                      cartItemId={line.id}
                      productName={line.productName}
                    />
                  </div>

                  <DeliverySplitToggle line={line} />
                </div>

                <div className={`${styles.linePricing} numeric`}>
                  <span className={styles.lineTotal}>{formatYenSuffix(line.lineTotal)}</span>
                  {/* Labelled. A bare "115pt" sitting under a price reads as
                      a second charge as easily as a reward; 獲得予定 says which
                      direction it goes. The backend computes this per row
                      (Cart.php: roundPoint(total_price, point_percentage)), so
                      it already follows the quantity.

                      Zero for a guest — the percentage is only looked up when
                      a customer_id is present — so nothing renders rather than
                      promising points a signed-out visitor would not get. */}
                  {line.points > 0 && (
                    <span className={styles.linePoints}>
                      獲得予定{' '}
                      <strong className={styles.linePointsValue}>
                        {formatNumber(line.points)}pt
                      </strong>
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Kept OUT of the summary sidebar. At 340px the two forms stacked
              into a column barely wider than their own buttons, and they sat
              below the total — so the two things that change the total were
              underneath it and off screen on a phone. Full width under the
              items instead, side by side where there is room. */}
          <section className={styles.promo} aria-labelledby="cart-promo-title">
            <div className={styles.promoHead}>
              <h2 id="cart-promo-title" className={styles.promoTitle}>
                クーポン・ポイント
              </h2>
              <p className={styles.promoSub}>ご利用いただける特典をご確認ください。</p>
            </div>

            <div className={styles.promoGrid}>
              <div className={styles.promoCard}>
                <CouponForm
                  appliedCoupon={cart.appliedCoupon}
                  couponLabel={cart.couponLabel}
                  coupons={couponChoices}
                  subtotal={cart.subtotal}
                />
              </div>

              {/* Always renders now, so the two columns are always side by
                  side. It says something different to a guest, to a customer
                  with no balance yet, and to one who has points to spend. */}
              <div className={styles.promoCard}>
                <PointsForm
                  balance={cart.pointsBalance}
                  maxUsable={cart.maxPointsUsable}
                  applied={cart.pointsApplied}
                  disabled={cart.pointsRedeemDisabled}
                  signedIn={Boolean(customerId)}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className={styles.summary} aria-label="ご注文金額">
          <h2 className={styles.summaryTitle}>お支払い金額</h2>

          <div className={styles.row}>
            <span>小計</span>
            <span className="numeric">{formatYenSuffix(cart.subtotal)}</span>
          </div>

          {cart.couponDiscount > 0 && (
            <div className={`${styles.row} ${styles.rowDiscount}`}>
              <span>クーポン割引{cart.appliedCoupon ? `（${cart.appliedCoupon}）` : ''}</span>
              <span className="numeric">−{formatYenSuffix(cart.couponDiscount)}</span>
            </div>
          )}

          {cart.pointsApplied > 0 && (
            <div className={`${styles.row} ${styles.rowDiscount}`}>
              <span>ポイント利用</span>
              <span className="numeric">−{formatYenSuffix(cart.pointsApplied)}</span>
            </div>
          )}

          {otherDiscount > 0 && (
            <div className={`${styles.row} ${styles.rowDiscount}`}>
              <span>その他の割引</span>
              <span className="numeric">−{formatYenSuffix(otherDiscount)}</span>
            </div>
          )}

          <div className={styles.row}>
            <span>送料</span>
            <span className="numeric">
              {cart.shipping === 0 ? '無料' : formatYenSuffix(cart.shipping)}
            </span>
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>合計</span>
            <span className={`${styles.totalValue} numeric`}>{formatYenSuffix(cart.total)}</span>
          </div>

          {cart.pointsEarned > 0 && (
            <p className={`${styles.pointsNote} numeric`}>
              {formatNumber(cart.pointsEarned)}pt が貯まります
            </p>
          )}

          <div className={styles.checkoutAction}>
            <Button href="/checkout" size="lg" block>
              ご注文手続きへ
            </Button>
          </div>

          {/* Home, not /category. Someone leaving the cart to keep
              shopping is not necessarily going back to a category listing,
              and the homepage is the one page that leads everywhere. */}
          <Link href="/" className={styles.continueLink}>
            買い物を続ける
          </Link>

        </aside>
      </div>

      {/* Phone and tablet only: the summary above stacks below the items
          there, so the total and the one button that matters would otherwise
          be a scroll away the whole time. */}
      <CheckoutBar total={cart.total} itemCount={cart.lines.length} />
    </div>
  );
}
