import { redirect } from 'next/navigation';

import styles from './Checkout.module.css';
import CheckoutForm from './CheckoutForm';
import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import Alert from '@/components/ui/Alert/Alert';
import { getCart } from '@/services/cart.service';
import { getCurrentCustomer, getAddresses } from '@/services/auth.service';
import { buildMetadata } from '@/lib/seo';
import { isMockData } from '@/services/adapters';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'ご注文手続き',
  path: '/checkout',
  noIndex: true,
});

/**
 * Checkout.
 *
 * Guests can check out — requiring an account before purchase is a well
 * documented conversion killer, and the source platform supports guest carts
 * (Phase 0 §2.3). Signed-in customers get their saved address prefilled.
 */
export default async function CheckoutPage() {
  const cart = await getCart();

  // Nothing to check out — send them back rather than showing an empty form.
  if (!cart.lines.length) {
    redirect('/cart');
  }

  const customer = await getCurrentCustomer();
  const addresses = customer ? await getAddresses() : [];
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: 'カート', href: '/cart' }, { name: 'ご注文手続き' }]} />

      <h1 className={styles.title}>ご注文手続き</h1>

      {/* Honest about the state of the payment integration. Removed once a
          real gateway is wired in. */}
      {isMockData && (
        <div className={styles.alertSlot}>
          <Alert variant="warning" title="開発中の画面です">
            決済ゲートウェイは未連携です。お支払い方法の選択肢は表示のみで、実際の決済は行われません。
          </Alert>
        </div>
      )}

      <CheckoutForm
        cart={cart}
        addresses={addresses}
        defaultAddress={defaultAddress}
        defaultEmail={customer?.email}
        /* No account: the email is whatever they type here, and it is the only
           route the furikomi details have to reach them. Asked for twice —
           see placeOrderAction, which re-checks it from the session rather
           than trusting this flag. */
        isGuest={!customer}
      />
    </div>
  );
}
