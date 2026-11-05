'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './Addresses.module.css';
import AddressForm from './AddressForm';
import Badge from '@/components/ui/Badge/Badge';
import Alert from '@/components/ui/Alert/Alert';
import Button from '@/components/ui/Button/Button';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { deleteAddressAction } from './actions';

/**
 * The saved address list, with its edit and delete controls.
 *
 * A Client Component because "which row is being edited" is interaction state
 * that has no business in a URL. The addresses themselves are fetched on the
 * server and passed in, so this holds no data of its own — after any mutation
 * the action revalidates and the server hands down a fresh list.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Address[]} props.addresses
 */
export default function AddressList({ addresses }) {
  const [editingId, setEditingId] = useState(null);
  const [state, deleteAction] = useActionState(deleteAddressAction, { errors: {} });
  const [confirmingId, setConfirmingId] = useState(null);

  if (addresses.length === 0) {
    return (
      <>
        <EmptyState
          title="登録されているお届け先がありません"
          body="よく使うお届け先を登録しておくと、ご注文手続きが簡単になります。"
        />
        <AddressForm isFirst />
      </>
    );
  }

  return (
    <>
      {state?.errors?.form && <Alert variant="error">{state.errors.form}</Alert>}

      <ul className={styles.list} role="list">
        {addresses.map((address) => (
          <li key={address.id} className={styles.card}>
            {editingId === address.id ? (
              <AddressForm editing={address} onDone={() => setEditingId(null)} />
            ) : (
              <>
                <div className={styles.cardHead}>
                  <span className={styles.cardLabel}>{address.label}</span>
                  {address.isDefault && <Badge variant="brand">既定</Badge>}
                </div>

                <address className={styles.cardBody}>
                  {address.recipient} 様
                  <br />〒{address.postalCode}
                  <br />
                  {address.prefecture}
                  {address.city}
                  {address.street}
                  {address.building && (
                    <>
                      <br />
                      {address.building}
                    </>
                  )}
                  <br />
                  {address.phone}
                </address>

                <div className={styles.cardActions}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingId(address.id)}
                  >
                    編集
                  </Button>

                  {/* Two-step delete. There is no undo behind this — the row is
                      gone from the backend — so a mis-tap on a phone should not
                      be enough to lose an address. */}
                  {confirmingId === address.id ? (
                    <form action={deleteAction} className={styles.confirmRow}>
                      <input type="hidden" name="id" value={address.id} />
                      <span className={styles.confirmText}>削除しますか？</span>
                      <DeleteButton />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setConfirmingId(null)}
                      >
                        キャンセル
                      </Button>
                    </form>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmingId(address.id)}
                    >
                      削除
                    </Button>
                  )}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Hidden while a row is being edited: two open forms on one screen makes
          it ambiguous which one a Save applies to. */}
      {editingId === null && <AddressForm />}
    </>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? '削除中…' : '削除する'}
    </Button>
  );
}
