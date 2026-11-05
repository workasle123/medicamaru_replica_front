'use server';

import { revalidatePath } from 'next/cache';

import { rules, validate, field } from '@/lib/validation';
import { createAddress, updateAddress, deleteAddress } from '@/services/auth.service';

/**
 * Address book mutations.
 *
 * All three revalidate /my-account/addresses AND /checkout: the checkout screen
 * offers saved addresses as delivery options, so an address added here has to
 * appear there without the customer reloading — and one deleted here must stop
 * being offered.
 */

/** Read one address out of a submitted form. Shared by create and update. */
function readAddress(formData) {
  return {
    label: field(formData, 'label'),
    recipient: field(formData, 'recipient'),
    phone: field(formData, 'phone'),
    postalCode: field(formData, 'postalCode'),
    prefecture: field(formData, 'prefecture'),
    city: field(formData, 'city'),
    street: field(formData, 'street'),
    building: field(formData, 'building'),
    isDefault: formData.get('isDefault') === '1',
  };
}

const ADDRESS_RULES = {
  recipient: [
    (v) => rules.required(v, 'お届け先氏名'),
    (v) => rules.maxLength(v, 100, 'お届け先氏名'),
  ],
  /* No format check on either — see the note in cart/actions.js. The backend
     has them as `string|max:20` with no pattern, so length is the only thing
     it can reject. */
  phone: [(v) => rules.required(v, '電話番号'), (v) => rules.maxLength(v, 20, '電話番号')],
  postalCode: [(v) => rules.required(v, '郵便番号'), (v) => rules.maxLength(v, 20, '郵便番号')],
  prefecture: [(v) => rules.required(v, '都道府県')],
  city: [(v) => rules.required(v, '市区町村'), (v) => rules.maxLength(v, 100, '市区町村')],
  street: [(v) => rules.required(v, '番地'), (v) => rules.maxLength(v, 255, '番地')],
  building: [(v) => rules.maxLength(v, 255, '建物名・部屋番号')],
  label: [(v) => rules.maxLength(v, 50, 'ラベル')],
};

export async function saveAddressAction(prevState, formData) {
  const values = readAddress(formData);
  /* Present only when editing. Read from the form rather than bound into the
     action, so one action serves both the add and the edit form. */
  const id = field(formData, 'id');

  const { valid, errors } = validate(values, ADDRESS_RULES);

  if (!valid) {
    // `id` rides along so a failed edit re-renders as an edit, not as an add.
    return { errors, values, id };
  }

  const result = id
    ? await updateAddress(id, values)
    : await createAddress(values);

  if (!result.ok) {
    return { errors: { form: result.error }, values, id };
  }

  revalidatePath('/my-account/addresses');
  revalidatePath('/checkout');

  /* A token, not just a flag. The form uses it to tell "a save just happened"
     from "a save happened earlier and I have since reopened the form" — which a
     bare boolean cannot express, and which otherwise needs an effect to reset. */
  return { ok: true, savedAt: Date.now(), errors: {}, values: {} };
}

export async function deleteAddressAction(prevState, formData) {
  const id = field(formData, 'id');

  if (!id) {
    return { errors: { form: '削除するお届け先が指定されていません。' } };
  }

  const result = await deleteAddress(id);

  if (!result.ok) {
    return { errors: { form: result.error } };
  }

  revalidatePath('/my-account/addresses');
  revalidatePath('/checkout');

  return { ok: true, errors: {} };
}
