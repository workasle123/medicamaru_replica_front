/**
 * Medicamaru — HTTP authentication adapter.
 *
 * Verified against the local backend replica on 2026-08-17. The previous
 * version described an unverified contract and both calls failed outright:
 *
 *  · The field names are `customer_email` / `customer_password`, not
 *    `email` / `password`.
 *  · `session_id` is REQUIRED on both login and register. It is not decoration:
 *    the backend calls Cart::mergeCart($customerId, $session_id) so the guest
 *    cart becomes the customer's cart. Omit it and the visitor signs in to an
 *    empty cart, having lost whatever they had assembled.
 *  · Register requires TWELVE fields, including the name split kanji/hiragana
 *    and a full address. Sending four returned a 500.
 *  · The response body is `{ message, code, results: { status, token,
 *    customer_id, ... } }` — the fields sit directly on `results`, not under
 *    `results.data`, so the shared `unwrap` helper does not apply here.
 *
 * Medicamaru has ONE customer type and one login (docs/DECISIONS.md D7); the
 * source platform's doctor and medical logins are deliberately not wired.
 */

import { apiFetch } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/errors';
import {
  normaliseCustomer,
  normaliseOrderSummary,
  normalisePointEntry,
  normaliseProductSummary,
  normaliseReferrals,
} from './normalise';

/**
 * Unwrap a list response to an array, whatever shape it arrives in. Laravel
 * returns `results.data` here, but an empty result and a paginated result do
 * not look the same, and a non-array must never reach the page.
 */
/**
 * The points balance, from either shape the API has sent.
 *
 * A number (or numeric string) is the balance. An object is the aggregate row
 * it used to send by mistake, and the balance is its two columns subtracted.
 * Anything else is 0 — which is also what an account with no wallet rows
 * genuinely has.
 */
const pointBalance = (raw) => {
  if (raw && typeof raw === 'object') {
    return (Number(raw.total_credit) || 0) - (Number(raw.total_debit) || 0);
  }
  return Number(raw) || 0;
};

const listOf = (res) => {
  const data = res?.results?.data ?? res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

/**
 * A stand-in cart session for a visitor who has never added anything.
 *
 * `session_id` is `required|string` on both login and register, and sending ''
 * does NOT satisfy it: Laravel's ConvertEmptyStringsToNull middleware rewrites
 * an empty string to null before validation runs, so the request fails 422 —
 * which the catch below then reports as "wrong email or password". That broke
 * sign-in for every visitor who had not first put something in their cart.
 *
 * A fresh random id matches no cart rows, so Cart::mergeCart finds nothing and
 * merges nothing. That is the correct outcome, and unlike calling ensureCartId()
 * it does not plant a cart cookie on someone who never shopped.
 */
const noCart = () => crypto.randomUUID();

/** Login and register both answer with their fields directly on `results`. */
const session = (res) => {
  const body = res?.results ?? res ?? {};
  return {
    token: body.token,
    customer: {
      id: body.customer_id,
      primaryId: body.customer_primid,
      name: body.customer_name?.trim() || '',
      nickname: body.nickname ?? null,
    },
  };
};

export const httpAuthAdapter = {
  /**
   * @param {{email: string, password: string, sessionId?: string|null}} input
   *   `sessionId` is the guest cart id — passing it is what merges that cart
   *   into the account.
   */
  async login({ email, password, sessionId }) {
    try {
      const res = await apiFetch(endpoints.login(), {
        method: 'POST',
        body: {
          customer_email: email,
          customer_password: password,
          // See noCart() — an empty string here is rejected, not ignored.
          session_id: sessionId || noCart(),
        },
      });
      const { token, customer } = session(res);
      return { ok: true, token, customer };
    } catch (error) {
      /* 403 with this reason means the password WAS right and the address has
         not been confirmed. Reported separately so the login page can offer to
         resend the link instead of repeating 「正しくありません」, which would
         send someone to reset a password that is already correct.

         The backend only answers this after checking the password, so
         receiving it does not disclose whether an address is registered. */
      /* ApiError carries the whole body as `payload`, and this backend nests
         its extras under `results` — see the envelope note at the top of
         normalise.js. There is no `data` property on ApiError. */
      if (error instanceof ApiError && error.payload?.results?.reason === 'email_unverified') {
        return {
          ok: false,
          unverified: true,
          email: error.payload?.results?.email ?? email,
          error: 'メールアドレスのご確認が完了していません。',
        };
      }

      if (error instanceof ApiError && (error.isAuth || error.isValidation)) {
        return { ok: false, error: 'メールアドレスまたはパスワードが正しくありません。' };
      }
      throw error;
    }
  },

  /**
   * Every field below is required by the backend except `address2`, `phone`,
   * `gender` and `referralCode`. `dob` must be YYYY-MM-DD and at least 18 years
   * ago — the backend enforces the age gate and so does the form.
   */
  async register(input) {
    try {
      const res = await apiFetch(endpoints.register(), {
        method: 'POST',
        body: {
          first_name_kanji: input.givenName,
          last_name_kanji: input.familyName,
          first_name_hiragana: input.givenNameKana,
          last_name_hiragana: input.familyNameKana,
          /* The romanised name the admin's shipping label prints beside the
             漢字 one. The backend upper-cases it, so the casing a customer
             types does not reach the label. */
          first_name_english: input.givenNameEnglish,
          last_name_english: input.familyNameEnglish,
          customer_email: input.email,
          customer_password: input.password,
          /* Empty string, NOT null. `customers.customer_phone` is
             varchar(20) NOT NULL with no default even though the validation
             rule says `nullable`, so a blank optional phone sent as null fails
             the insert with a constraint violation and a 500. */
          customer_phone: input.phone || '',
          /* The dialling code, in its own field because it is its own column
             — customer_phone goes on meaning the national number. */
          customer_phone_country: input.phoneCountry || '+81',
          /* The column is enum('male','female') and nullable, so those are the
             only two values it accepts — anything else is rejected. "Prefer not
             to say" is therefore null rather than a third value. */
          customer_gender: input.gender === 'male' || input.gender === 'female'
            ? input.gender
            : null,
          customer_dob: input.dob,
          address1: input.address1,
          address2: input.address2 || null,
          city: input.city,
          state: input.prefecture,
          zipcode: input.postalCode,
          country: input.country,
          referral_by: input.referralCode || null,
          // Same cart merge as login; same empty-string trap.
          session_id: input.sessionId || noCart(),
        },
      });

      /* 202 for an email that already has guest orders: nothing is signed in
         yet. The backend has emailed a link to that address, and registration
         finishes on /register/confirm — see confirmRegistration below. */
      if (res?.results?.status === 'confirmation_required') {
        return { ok: true, confirmationRequired: true };
      }

      /* A brand-new account has an unverified address, and login refuses
         those — so the backend withholds the session token and says so.
         Signing them in here would work for exactly one session and then
         stop, which reads as the site breaking rather than as a rule. */
      if (res?.results?.requires_verification) {
        return {
          ok: true,
          requiresVerification: true,
          email: res?.results?.email ?? input.email,
        };
      }

      const { token, customer } = session(res);
      return { ok: true, token, customer };
    } catch (error) {
      if (error instanceof ApiError && error.isValidation) {
        return { ok: false, error: error.message || '入力内容をご確認ください。' };
      }
      throw error;
    }
  },

  /**
   * Finish a guest's registration from the emailed link. The token proves the
   * inbox; the password is chosen here. Answers like login on success — the
   * customer keeps the guest record's id, so its orders are already theirs.
   *
   * @param {{token: string, password: string, passwordConfirm: string, sessionId?: string|null}} input
   */
  async confirmRegistration({ token, password, passwordConfirm, sessionId }) {
    try {
      const res = await apiFetch(endpoints.registerConfirm(), {
        method: 'POST',
        body: {
          token,
          customer_password: password,
          customer_password_confirmation: passwordConfirm,
          session_id: sessionId || noCart(),
        },
      });
      const { token: authToken, customer } = session(res);
      return { ok: true, token: authToken, customer };
    } catch (error) {
      // 400 = invalid or expired link, 422 = password rules; both carry a
      // Japanese message from the backend.
      if (error instanceof ApiError && error.isValidation) {
        return { ok: false, error: error.message || 'このリンクは無効か、有効期限が切れています。' };
      }
      throw error;
    }
  },

  /* Normalised, not raw. Returning the envelope left /my-account reading
     `customer.name` off `{message, code, results}` and rendering its error
     boundary instead of the account page. */
  getCustomer: async (token) => {
    const res = await apiFetch(endpoints.profile(), { token });
    return normaliseCustomer(res?.results?.data ?? res?.data ?? null);
  },
  /* The code, and the two lists around it. Normalised like getCustomer, for
     the same reason: a page reading `.referred.length` off an envelope gets
     undefined and renders its error boundary. */
  getReferrals: async (token) => {
    const res = await apiFetch(endpoints.referrals(), { token, revalidate: 0 });
    return normaliseReferrals(res?.data ?? res?.results?.data ?? null);
  },

  /* All three of these MUST resolve to arrays. Returning the raw envelope made
     /my-account throw `orders.slice is not a function` — the page had a valid
     customer and still rendered its error boundary. */
  getAddresses: async (token) => {
    const res = await apiFetch(endpoints.addresses(), { token });
    return listOf(res).map(normaliseAddress);
  },

  /* The backend wants `state` for the prefecture and `zipcode` for the postal
     code, and requires `country` on every write even though this shop only ships
     within Japan. Mapped here rather than in the form, so the UI speaks the
     storefront's vocabulary and only this file knows the API's. */
  addAddress: async (token, input) => {
    const res = await apiFetch(endpoints.addAddress(), {
      method: 'POST',
      token,
      body: toAddressPayload(input),
    });
    return { id: res?.results?.id ?? null };
  },

  updateAddress: async (token, id, input) => {
    await apiFetch(endpoints.editAddress(id), {
      method: 'POST',
      token,
      body: toAddressPayload(input),
    });
    return { ok: true };
  },

  /* POST, not DELETE — the route is defined as Route::post('customerDelAddress/
     {address}'). Sending DELETE returns 405. */
  deleteAddress: async (token, id) => {
    await apiFetch(endpoints.deleteAddress(id), { method: 'POST', token });
    return { ok: true };
  },

  /* Newest first. getOrderByCustomerId applies no ORDER BY, so the rows come
     back in whatever order the engine returns them — in practice ascending by
     primary key, which puts a customer's FIRST order at the top of their
     history and the one they just placed at the bottom. Sorted here rather
     than in the query: the backend is shared with the admin panel, and this is
     the only caller that cares. */
  /**
   * The points wallet: balance and every movement, newest first.
   *
   * The backend returns rows in insertion order and the balance as a separate
   * field, so neither is assembled here — except the sort, which it does not
   * apply and a history read backwards is no history at all.
   */
  /**
   * Save the member's own details.
   *
   * The backend requires BOTH kanji and hiragana name halves and a date of
   * birth on every call — `required`, not `sometimes` — so a partial update
   * is not possible and the form always submits the whole set. A missing
   * hiragana reads back as a validation error, not a silent no-op.
   *
   * Email and password are NOT sent. /customer/update ignores both now (it
   * used to accept every fillable column, which is how a customer could have
   * rewritten their own referral payout); a password change goes through
   * changePassword below.
   */
  updateProfile: async (token, input) => {
    await apiFetch(endpoints.updateProfile(), {
      method: 'POST',
      token,
      body: {
        first_name_kanji: input.givenName,
        last_name_kanji: input.familyName,
        first_name_hiragana: input.givenNameKana,
        last_name_hiragana: input.familyNameKana,
        /* Editable from マイページ so a customer who registered before these
           existed can supply the name the shipping label needs. */
        first_name_english: input.givenNameEnglish ?? null,
        last_name_english: input.familyNameEnglish ?? null,
        customer_phone: input.phone ?? '',
        customer_phone_country: input.phoneCountry || '+81',
        customer_gender: input.gender ?? null,
        customer_dob: input.dob,
        nickname: input.nickname ?? null,
      },
    });
    return { ok: true };
  },

  /**
   * Change the password.
   *
   * Separate endpoint, and separate on purpose: it takes the CURRENT password
   * as well, which is what stops a hijacked session from locking the real
   * owner out.
   */
  changePassword: async (token, input) => {
    await apiFetch(endpoints.changePassword(), {
      method: 'POST',
      token,
      body: {
        /* The endpoint is shared with the medical and doctor logins and
           branches on this; without it the request fails validation before it
           reaches the password check. */
        user_type: 'customer',
        old_password: input.currentPassword,
        new_password: input.newPassword,
        /* Laravel's `confirmed` rule looks for exactly this name — not
           `confirm_password`, which would leave new_password unconfirmed and
           fail with a message about a field the form does not have. */
        new_password_confirmation: input.confirmPassword,
      },
    });
    return { ok: true };
  },

  /**
   * Confirm an address from the emailed link.
   *
   * Comes back WITH a session: holding the token proves control of the inbox,
   * so the customer is signed in rather than sent to a page telling them to
   * log in. `token` is absent against a backend that has not been updated, and
   * the caller then falls back to the login page.
   */
  verifyEmail: async (verifyToken, { sessionId } = {}) => {
    try {
      const res = await apiFetch(endpoints.verifyEmail(), {
        method: 'POST',
        /* session_id is omitted rather than sent empty when the browser has
           no guest cart — the endpoint treats it as optional, and an empty
           string would be a cart id that matches nothing. */
        body: sessionId ? { token: verifyToken, session_id: sessionId } : { token: verifyToken },
      });
      const { token, customer } = session(res);
      return { ok: true, token, customer };
    } catch (error) {
      /* `reason` separates "wrong or already used" from "too old" — different
         things to tell someone: one offers a resend, the other is very likely
         a link they already clicked. */
      const reason = error instanceof ApiError ? error.payload?.results?.reason : null;
      return { ok: false, reason: reason ?? 'invalid' };
    }
  },

  /** Ask for a fresh link. */
  resendVerification: async (email) => {
    await apiFetch(endpoints.resendVerification(), { method: 'POST', body: { email } });
    /* The backend answers identically whether or not the address is on file,
       so there is nothing to branch on here — and nothing to leak. */
    return { ok: true };
  },

  getPoints: async (token) => {
    const res = await apiFetch(endpoints.loyaltyPoints(), { token });
    const results = res?.results ?? {};

    return {
      /* The backend's own figure: SUM(credit) − SUM(debit) over the same
         rows. Not recomputed from `entries` — if the two ever disagree, the
         one the cart spends against is the one to show.

         TWO SHAPES, because the API has served both. getLoyaltyPointsList
         called getWalletTransactionBalance WITHOUT its `$getOnlyBalance` flag,
         which returns the raw aggregate row {total_credit, total_debit}
         instead of the balance — so `point_balance` arrived as an object,
         Number() of it was NaN, and every customer saw 0pt beside a history
         full of credits. The backend passes the flag now; this still reads the
         row form so the storefront is correct against a backend that has not
         been updated yet. */
      balance: pointBalance(results.point_balance),
      entries: listOf(res)
        .map(normalisePointEntry)
        .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
    };
  },

  getOrders: async (token) => {
    const res = await apiFetch(endpoints.orders(), { token });
    return listOf(res)
      .map(normaliseOrderSummary)
      .sort((a, b) => {
        const byDate = String(b.placedAt ?? '').localeCompare(String(a.placedAt ?? ''));
        /* Several orders can share a created_at to the second — a retried
           checkout does — so the id breaks the tie and keeps the order stable
           between renders. */
        return byDate !== 0 ? byDate : Number(b.id) - Number(a.id);
      });
  },

  /* customerId is REQUIRED. The route is /orders/details/{order}/{cusid}, and
     the handler answers 403 when the order's customer_id does not equal the
     cusid segment. endpoints.order() takes (orderId, customerId) but was being
     called with one argument, so the URL ended in the literal string
     "undefined" and every order detail failed the ownership check. */
  getOrder: async (token, orderId, customerId) => {
    const res = await apiFetch(endpoints.order(orderId, customerId), { token });
    const row = res?.results?.data ?? res?.data ?? null;
    return row ? normaliseOrderSummary(row) : null;
  },

  /**
   * Wishlist add/remove. Signed-in only: the backend reads
   * request()->user()->customer_id, so an anonymous call cannot be attributed
   * to anyone and is refused by the middleware.
   */
  addToWishlist: async (token, productId, variantId) => {
    await apiFetch(endpoints.wishlistItem(productId, variantId), { method: 'POST', token });
    return { ok: true };
  },

  removeFromWishlist: async (token, productId, variantId) => {
    await apiFetch(endpoints.wishlistItem(productId, variantId), { method: 'DELETE', token });
    return { ok: true };
  },

  /**
   * The saved products themselves, not their ids.
   *
   * /wishlist/products returns whole product rows, so there is nothing to look
   * up afterwards. The page used to take ids from here and then filter a
   * 100-product listing to find them — which silently showed an empty wishlist
   * for any product outside that first page.
   */
  getWishlist: async (token) => {
    const res = await apiFetch(endpoints.wishlist(), { token, revalidate: 0 });
    return listOf(res).map(normaliseProductSummary);
  },

  /**
   * Post or edit a review.
   *
   * MULTIPART, because of the photo. The field names are the backend's own,
   * not ours: product_id, comment, rating, attachment, nickname.
   *
   * `nickname` is sent only when one is supplied. The backend writes it to the
   * customer ONLY when the field is present — sending an empty string would
   * erase the nickname already on file, and reviews are displayed by nickname,
   * so it would take the name off every earlier review by the same customer.
   */
  submitReview: async (token, { productId, rating, comment, nickname, photo }) => {
    const form = new FormData();
    form.append('product_id', String(productId));
    form.append('rating', String(rating));
    form.append('comment', comment);
    if (nickname) form.append('nickname', nickname);
    if (photo && photo.size > 0) form.append('attachment', photo, photo.name);

    await apiFetch(endpoints.submitReview(), { method: 'POST', token, body: form });
    return { ok: true };
  },

  /**
   * Has this customer ever ordered this product?
   *
   * What gates the review form. Note what it does NOT check: payment status.
   * The backend asks only whether an order_item exists, so an unpaid or
   * cancelled order counts — which is the backend's rule, and inventing a
   * stricter one here would mean the form and the endpoint disagreed about who
   * may post.
   */
  hasPurchasedProduct: async (token, customerId, productId) => {
    const res = await apiFetch(endpoints.hasPurchasedProduct(), {
      method: 'POST',
      token,
      body: { customer_id: String(customerId), product_id: Number(productId) },
    });
    return Boolean(res?.results?.purchased);
  },

  /**
   * Note the field names differ from login: this endpoint takes plain `email`,
   * and it REQUIRES `user_type` — one of customer|medical|doctor. Medicamaru
   * only ever has customers, so it is fixed here rather than exposed.
   */
  requestPasswordReset: async (email) => {
    await apiFetch(endpoints.forgotPassword(), {
      method: 'POST',
      body: { email, user_type: 'customer' },
    });
    return { ok: true };
  },

  /**
   * Set a new password from the link in the reset email
   * (/reset-password?token=…&type=customer). The backend signs out every
   * existing session for the account when this succeeds.
   */
  resetPassword: async ({ token, password, passwordConfirm }) => {
    try {
      await apiFetch(endpoints.resetPassword(), {
        method: 'POST',
        body: {
          token,
          password,
          password_confirmation: passwordConfirm,
          user_type: 'customer',
        },
      });
      return { ok: true };
    } catch (error) {
      // 400 = invalid or expired link, 422 = password rules; both carry a
      // Japanese message from the backend.
      if (error instanceof ApiError && error.isValidation) {
        return { ok: false, error: error.message || 'このリンクは無効か、有効期限が切れています。' };
      }
      throw error;
    }
  },
};

/**
 * A backend address row in the storefront's own shape.
 *
 * The read view was written against fields the API never sent — `recipient`,
 * `postalCode`, `prefecture`, `street`, `building`, `isDefault` — while
 * getAddresses returned raw rows carrying `address1`, `zipcode`, `state`. Every
 * saved address therefore rendered blank. This is where the two meet.
 *
 * @param {Object} row
 * @returns {import('@/lib/types').Address}
 */
function normaliseAddress(row) {
  return {
    id: row?.id ?? null,
    label: row?.label || 'お届け先',
    recipient: row?.recipient_name ?? '',
    phone: row?.phone ?? '',
    postalCode: row?.zipcode ?? '',
    prefecture: row?.state ?? '',
    city: row?.city ?? '',
    street: row?.address1 ?? '',
    building: row?.address2 ?? '',
    country: row?.country ?? '日本',
    isDefault: Number(row?.is_default) === 1,
    isBilling: Number(row?.is_billing) === 1,
  };
}

/**
 * The reverse: storefront field names to the API's.
 *
 * `country` is sent on every write because the backend marks it required, and
 * this shop ships only within Japan — so there is no field for it in the form
 * and no reason to make the customer confirm it.
 */
function toAddressPayload(input) {
  return {
    recipient_name: input.recipient,
    phone: input.phone,
    label: input.label || null,
    zipcode: input.postalCode,
    state: input.prefecture,
    city: input.city,
    address1: input.street,
    address2: input.building || null,
    country: '日本',
    ...(input.isDefault === undefined ? {} : { is_default: input.isDefault ? 1 : 0 }),
  };
}
