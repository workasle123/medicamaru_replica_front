'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { addItem } from '@/services/cart.service';
import { removeFromWishlist } from '@/services/auth.service';
import { field } from '@/lib/validation';

/**
 * Medicamaru — favourites page Server Actions.
 */

/**
 * Move a favourite into the cart.
 *
 * A separate action from the cart's own addToCartAction, because this one has
 * a second half: once the product is in the cart it leaves the saved list. A
 * favourite is a reminder to buy something, and a reminder that stays after
 * the thing is bought is a list that only ever grows — the customer then has
 * to tidy it by hand, from a page that offers no way to.
 *
 * WHICH ROWS GO. The wishlist is keyed on (product, pack), so a customer may
 * have saved two pack sizes of one medicine. All of that product's rows are
 * cleared, not merely the pack that was added: the list shows one card per
 * product, so removing one row of two would leave the card in place and look
 * like the removal had failed. `wishlistVariantIds` carries exactly the packs
 * the endpoint said were saved.
 *
 * A FAILED REMOVAL IS NOT A FAILED ADD. The item is in the cart either way,
 * and sending the customer to an error after a successful add would be a lie
 * about the thing they actually asked for. The removals are therefore awaited
 * but their result is only logged by the service layer; the page re-reads the
 * list on return and shows whatever is really there.
 */
export async function moveToCartAction(formData) {
  const productId = field(formData, 'productId');
  const variantId = field(formData, 'variantId');
  const quantity = Number(field(formData, 'quantity')) || 1;

  if (!productId || !variantId) {
    redirect('/wishlist?error=variant');
  }

  const result = await addItem({ productId, variantId, quantity });
  if (!result.ok) {
    redirect('/wishlist?error=add');
  }

  /* The packs that were saved for this product. Sent as a comma-separated
     list because a hidden input holds one string, and filtered because an
     empty field splits to ['']. Falls back to the pack just added, so a
     backend that does not yet send the list still clears the obvious row. */
  const savedIds = (field(formData, 'wishlistVariantIds') || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const toRemove = savedIds.length ? savedIds : [variantId];

  /* Sequentially, not Promise.all. These are writes against a backend with a
     hard concurrency cap, and a favourite rarely holds more than two packs —
     the round trips cost less than a burst that could fail. */
  for (const id of toRemove) {
    await removeFromWishlist(productId, id);
  }

  revalidatePath('/wishlist');
  revalidatePath('/cart');
  revalidatePath('/checkout');

  /* Back to the favourites, not to the cart: someone working through a list
     of saved products is usually adding several, and a trip to the cart after
     each one turns a three-item reorder into three journeys back. */
  redirect('/wishlist?added=1');
}
