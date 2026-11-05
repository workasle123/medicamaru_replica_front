import styles from '../AccountLayout.module.css';
import AddressList from './AddressList';
import { getAddresses } from '@/services/auth.service';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'お届け先の管理',
  path: '/my-account/addresses',
  noIndex: true,
});

/**
 * Address book.
 *
 * Fetched on the server and handed to a Client Component, which owns only the
 * interaction state — which row is open for editing, which is awaiting delete
 * confirmation. After any mutation the action revalidates this path, so the
 * list below is always the server's, never a client-side copy drifting from it.
 */
export default async function AddressesPage() {
  const addresses = await getAddresses();

  return (
    <>
      <h1 className={styles.title}>お届け先の管理</h1>
      <p className={styles.lead}>
        登録したお届け先は、ご注文手続きの画面から選ぶだけでご利用いただけます。
      </p>

      {/* Keyed on the list's own content. Any successful add, edit or delete
          revalidates this page, the signature changes, and AddressList remounts
          with its editing and delete-confirmation state reset — which is what
          would otherwise need an effect watching the action result. */}
      <AddressList key={signature(addresses)} addresses={addresses} />
    </>
  );
}

/** A value that changes whenever any address does. */
function signature(addresses) {
  return addresses
    .map((a) => [a.id, a.label, a.recipient, a.phone, a.postalCode, a.prefecture, a.city, a.street, a.building, a.isDefault].join('|'))
    .join('~');
}
