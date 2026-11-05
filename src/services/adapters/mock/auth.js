/**
 * Medicamaru — mock authentication.
 *
 * ⚠️ DEVELOPMENT ONLY. This performs NO real authentication. It exists so the
 * account UI — forms, validation, error states, protected routes — can be
 * built and reviewed before the backend replica exists.
 *
 * The adapter switch in services/adapters/index.js keeps this out of any
 * build where DATA_SOURCE=api. It must never be reachable in production.
 */

import { products } from './fixtures';
import { toSummary } from './index';

const DEMO_EMAIL = 'demo@medicamaru.example';
const DEMO_PASSWORD = 'medicamaru123';

/** In-memory store. Resets on every server restart — by design. */
const customers = new Map([
  [
    DEMO_EMAIL,
    {
      id: 1,
      email: DEMO_EMAIL,
      name: '山田 太郎',
      nameKana: 'ヤマダ タロウ',
      /* Split, as normaliseCustomer returns them: 会員情報 edits the halves
         separately and joins them only for display. */
      familyNameEnglish: 'YAMADA',
      givenNameEnglish: 'TARO',
      phone: '090-1234-5678',
      phoneCountry: '+81',
      /* No pointsBalance: getPoints is the only source, and its fixture
         sums to the same 1,240. */
      referralCode: 'REFDEMO01',
      /* Mirrors the live shape: these are written onto a customer at
         registration from the `referral_points` setting, so the referral
         panel reads them per-customer rather than assuming. */
      referralAmount: 500,
      referralApplicableValue: 500,
      password: DEMO_PASSWORD,
    },
  ],
]);

const addresses = new Map([
  [
    1,
    [
      {
        id: 1,
        label: '自宅',
        recipient: '山田 太郎',
        postalCode: '150-0001',
        prefecture: '東京都',
        city: '渋谷区',
        street: '神宮前1-1-1',
        building: 'メディカ丸ビル 101',
        phone: '090-1234-5678',
        isDefault: true,
      },
    ],
  ],
]);

/* The product's own fixture image, so an order line shows the same picture
   the catalogue does. Looked up rather than restated: a URL written out twice
   is a URL that will disagree with itself. */
const productImage = (slug) =>
  products.find((p) => p.slug === slug)?.images?.[0]?.url ?? null;

/* Shaped exactly as normaliseOrderSummary returns an order, because the
   account pages are built against that shape and this is what renders them in
   mock mode.

   `status` is the orders.order_status ENUM — Pending | Processing | Completed |
   Cancelled — and nothing else. The fixture used to carry 'shipped' and
   'delivered', words the column cannot hold, which is how a badge-tone switch
   written against them passed review: the only data anyone looked at was the
   data that agreed with it. */
const orders = new Map([
  [
    1,
    [
      {
        id: '2',
        orderNumber: 'MDM-2026-0812',
        placedAt: '2026-07-30',
        status: 'Completed',
        statusLabel: '発送済み',
        paid: true,
        paymentLabel: 'お支払い済み',
        itemCount: 2,
        subtotal: 5100,
        discount: 400,
        shipping: 780,
        total: 5480,
        pointsEarned: 164,
        /* Two, and one of them a UPU number with letters: the split-shipment
           layout and the letter-keeping in trackingUrl are both things that
           were broken and a single clean domestic number exercises neither. */
        trackingNumbers: ['LP959035199IN', '4512-8890-3321'],
        invoiceNo: 'INV-2026-0812',
        invoiceDate: '2026-07-31',
        bankTransfer: null,
        shipTo: {
          name: '山田 太郎',
          email: DEMO_EMAIL,
          phone: '090-1234-5678',
          postalCode: '150-0001',
          prefecture: '東京都',
          line1: '渋谷区 神宮前1-1-1',
          line2: 'メディカ丸ビル 101',
          country: '日本',
        },
        lines: [
          {
            productId: '1',
            productName: 'スペマン',
            slug: 'speman',
            packLabel: '2 ボトル / 120 錠',
            quantity: 1,
            unitPrice: 2700,
            lineTotal: 2700,
            image: productImage('speman'),
          },
          /* No image: the detail page has to keep this line's text aligned
             with the one above it, and the only way to know it does is for the
             fixture to contain a line without one. */
          {
            productId: '2',
            productName: 'ビタミンD3 5000IU',
            slug: 'vitamin-d3-5000iu',
            packLabel: '3 ボトル / 360 錠',
            quantity: 1,
            unitPrice: 2500,
            lineTotal: 2500,
            image: null,
          },
        ],
      },
      {
        id: '1',
        orderNumber: 'MDM-2026-0655',
        placedAt: '2026-06-11',
        status: 'Pending',
        statusLabel: 'お支払い待ち',
        paid: false,
        paymentLabel: 'お支払い待ち',
        itemCount: 1,
        subtotal: 1980,
        discount: 0,
        shipping: 780,
        total: 2760,
        pointsEarned: 59,
        trackingNumber: null,
        invoiceNo: null,
        invoiceDate: null,
        /* The virtual account an unpaid order is waiting on, so the statement's
           お振込先 block is reachable in mock mode. */
        bankTransfer: {
          transactionId: 'MOCKTXN0001',
          bankName: 'GMOあおぞらネット銀行',
          bankCode: '0310',
          branchName: 'ビジネス営業部',
          branchCode: '101',
          accountType: '普通',
          accountNumber: '1234567',
          accountHolder: 'ｶ)ﾌﾞｲｱﾝﾄﾞｼｰ',
          amount: 2760,
        },
        shipTo: {
          name: '山田 太郎',
          email: DEMO_EMAIL,
          phone: '090-1234-5678',
          postalCode: '150-0001',
          prefecture: '東京都',
          line1: '渋谷区 神宮前1-1-1',
          line2: 'メディカ丸ビル 101',
          country: '日本',
        },
        lines: [
          {
            productId: '3',
            productName: 'フィンペシア 1mg',
            slug: 'finpecia-1mg',
            packLabel: '1 シート / 30 錠',
            quantity: 1,
            unitPrice: 1980,
            lineTotal: 1980,
            image: productImage('finpecia-1mg'),
          },
        ],
      },
    ],
  ],
]);

const wishlists = new Map([[1, ['speman', 'allegra-generic-120mg']]]);

function delay(ms = 60) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Token encodes the customer id. Opaque enough for development, and nothing more. */
function makeToken(customerId) {
  return `mock.${customerId}.${Buffer.from(String(Date.now())).toString('base64url')}`;
}

function customerIdFromToken(token) {
  const parts = String(token || '').split('.');
  return parts[0] === 'mock' ? Number(parts[1]) : null;
}

function publicCustomer(record) {
  if (!record) return null;
  const { password, ...rest } = record;
  return rest;
}

export const mockAuthAdapter = {
  async login({ email, password }) {
    await delay();
    const record = customers.get(email.toLowerCase());

    // Same message for unknown email and wrong password — distinguishing them
    // is an account-enumeration leak.
    if (!record || record.password !== password) {
      return { ok: false, error: 'メールアドレスまたはパスワードが正しくありません。' };
    }

    return { ok: true, token: makeToken(record.id), customer: publicCustomer(record) };
  },

  /**
   * Takes the same twelve-field shape the live adapter does. The name arrives
   * split kanji/hiragana × family/given, because that is how the backend stores
   * it, so it is joined back into the single display name this fixture keeps.
   */
  /* The fixture has no guest orders, so registration never needs an emailed
     confirmation here and any link reads as expired. */
  async confirmRegistration() {
    await delay();
    return { ok: false, error: 'このリンクは無効か、有効期限が切れています。' };
  },

  async register({
    email,
    password,
    familyName,
    givenName,
    familyNameKana,
    givenNameKana,
    familyNameEnglish,
    givenNameEnglish,
    phone,
  }) {
    await delay();
    const key = email.toLowerCase();

    if (customers.has(key)) {
      return { ok: false, error: 'このメールアドレスは既に登録されています。' };
    }

    const id = customers.size + 1;
    const record = {
      id,
      email: key,
      // Family name first, matching the backend's own concatenation order.
      name: [familyName, givenName].filter(Boolean).join(' '),
      nameKana: [familyNameKana, givenNameKana].filter(Boolean).join(' '),
      /* Upper-cased, as the backend does on the way in — so mock mode shows
         what the shipping label will actually print. */
      nameEnglish: [familyNameEnglish, givenNameEnglish]
        .filter(Boolean)
        .join(' ')
        .toUpperCase(),
      phone,
      pointsBalance: 0,
      password,
    };
    customers.set(key, record);
    addresses.set(id, []);
    orders.set(id, []);
    wishlists.set(id, []);

    return { ok: true, token: makeToken(id), customer: publicCustomer(record) };
  },

  async getCustomer(token) {
    await delay(20);
    const id = customerIdFromToken(token);
    if (!id) return null;
    const record = [...customers.values()].find((c) => c.id === id);
    return publicCustomer(record);
  },

  /* Mirrors the http adapter so /my-account/referral renders under
     DATA_SOURCE=mock. One accepted invitation, so the list has both states
     represented across the two fixtures. */
  async getReferrals(token) {
    await delay(20);
    const id = customerIdFromToken(token);
    if (!id) return { code: null, referred: [], referredBy: null };

    return {
      code: 'REFDEMO01',
      referred: [{ name: '佐藤 花子', joinedAt: '2026-08-14' }],
      referredBy: null,
    };
  },

  async getAddresses(token) {
    await delay();
    const id = customerIdFromToken(token);
    return id ? (addresses.get(id) ?? []) : [];
  },

  /* One of each kind the backend can credit, so the history page can be seen
     without a live wallet. Signs match the real rows: a debit is points spent. */
  /* Writes into the in-memory customer so the page reflects the edit the way
     the real one does — a mock that accepts and forgets would make the form
     look broken. */
  async updateProfile(token, input) {
    await delay();
    const id = customerIdFromToken(token);
    const record = [...customers.values()].find((c) => c.id === id);
    if (!record) return { ok: false, error: 'ログインの有効期限が切れました。' };

    record.name = [input.familyName, input.givenName].filter(Boolean).join(' ');
    record.nameKana = [input.familyNameKana, input.givenNameKana].filter(Boolean).join(' ');
    record.phone = input.phone ?? record.phone;
    record.dob = input.dob ?? record.dob;
    record.gender = input.gender ?? record.gender;
    record.nickname = input.nickname ?? record.nickname;

    return { ok: true };
  },

  async changePassword(token, input) {
    await delay();
    const id = customerIdFromToken(token);
    const record = [...customers.values()].find((c) => c.id === id);
    if (!record) return { ok: false, error: 'ログインの有効期限が切れました。' };

    /* The real endpoint checks the current password; mirroring that is what
       makes the error path reachable without a backend. */
    if (record.password !== input.currentPassword) {
      return { ok: false, error: '現在のパスワードが正しくありません。' };
    }

    record.password = input.newPassword;
    return { ok: true };
  },

  /* 'expired' and 'used' are reachable by token so both branches of the verify
     page can be seen without a backend; anything else verifies. */
  /* Returns a session, as the live endpoint does, so that the verify route can
     sign the customer in and land them on My Page. Any token other than the two
     failure words resolves to the demo customer — the fixture has no verification
     records to look the address up in. */
  async verifyEmail(token) {
    await delay();
    if (token === 'expired') return { ok: false, reason: 'expired' };
    if (token === 'used' || !token) return { ok: false, reason: 'invalid' };

    const record = customers.get(DEMO_EMAIL);
    return { ok: true, token: makeToken(record.id), customer: publicCustomer(record) };
  },

  async resendVerification() {
    await delay();
    /* Mirrors the real endpoint, which answers the same whether or not the
       address is on file. */
    return { ok: true };
  },

  async getPoints(token) {
    await delay();
    if (!customerIdFromToken(token)) return { balance: 0, entries: [] };

    const entries = [
      { id: '6', type: 'credit', points: 164, reasonKey: 'purchase', reason: 'お買い物',
        orderNumber: 'MDM-2026-0812', orderId: '2', productName: null, createdAt: '2026-07-30' },
      { id: '5', type: 'debit', points: -200, reasonKey: 'purchase', reason: 'お買い物',
        orderNumber: 'MDM-2026-0812', orderId: '2', productName: null, createdAt: '2026-07-30' },
      { id: '4', type: 'credit', points: 65, reasonKey: 'review', reason: 'レビュー投稿',
        orderNumber: null, orderId: null, productName: 'スペマン', createdAt: '2026-07-02' },
      { id: '3', type: 'credit', points: 500, reasonKey: 'referral', reason: 'ご紹介',
        orderNumber: null, orderId: null, productName: null, createdAt: '2026-06-14' },
      { id: '2', type: 'credit', points: 300, reasonKey: 'first order', reason: '初回ご注文',
        orderNumber: 'MDM-2026-0655', orderId: '1', productName: null, createdAt: '2026-06-11' },
      { id: '1', type: 'credit', points: 411, reasonKey: 'register', reason: '会員登録',
        orderNumber: null, orderId: null, productName: null, createdAt: '2026-06-01' },
    ];

    return { balance: entries.reduce((n, e) => n + e.points, 0), entries };
  },

  async getOrders(token) {
    await delay();
    const id = customerIdFromToken(token);
    return id ? (orders.get(id) ?? []) : [];
  },

  async getOrder(token, orderId) {
    await delay();
    const id = customerIdFromToken(token);
    if (!id) return null;
    return (orders.get(id) ?? []).find((o) => o.id === orderId) ?? null;
  },

  /* Mirrors the live adapter: returns the saved PRODUCTS, not their ids, each
     carrying its FULL pack list plus the packs that were saved. The fixture
     stores product ids only, so the saved pack is taken to be the first —
     enough to exercise the preselect and the removal on move-to-cart. */
  async getWishlist(token) {
    await delay();
    const id = customerIdFromToken(token);
    const saved = id ? (wishlists.get(id) ?? []) : [];
    return saved
      .map((pid) => products.find((p) => String(p.id) === String(pid) || p.slug === String(pid)))
      .filter(Boolean)
      .map((p) => ({
        /* The CARD shape, as the live adapter returns — plus the packs, which
           the summary drops and the favourites card needs. */
        ...toSummary(p),
        variants: p.variants,
        wishlistedVariantIds: p.variants?.length ? [String(p.variants[0].id)] : [],
      }));
  },

  async addToWishlist(token, productId) {
    await delay();
    const id = customerIdFromToken(token);
    if (!id) return { ok: false };
    const list = wishlists.get(id) ?? [];
    if (!list.includes(String(productId))) list.push(String(productId));
    wishlists.set(id, list);
    return { ok: true };
  },

  /* The variant is accepted and ignored: the fixture keys favourites on the
     product alone, so clearing the product clears every pack of it — which is
     what moveToCartAction asks for anyway. */
  async removeFromWishlist(token, productId) {
    await delay();
    const id = customerIdFromToken(token);
    if (!id) return { ok: false };
    const key = String(productId);
    wishlists.set(
      id,
      (wishlists.get(id) ?? []).filter((x) => {
        if (x === key) return false;
        /* The fixture stores slugs as well as ids, and the storefront sends
           the numeric id, so a slug row has to be matched through it. */
        const p = products.find((prod) => prod.slug === x);
        return !(p && String(p.id) === key);
      })
    );
    return { ok: true };
  },

  /* Accepts anything and reports success. The fixture keeps no review store:
     the live endpoint writes at status 0 and the read endpoint returns only
     status 1, so a posted review is invisible there too — which makes "it
     worked, you will not see it yet" the honest mock as well as the simple
     one. */
  async submitReview() {
    await delay();
    return { ok: true };
  },

  /* True for the demo customer, who has fixture orders, and false for anyone
     else — enough to exercise both gates in development. */
  async hasPurchasedProduct(token) {
    await delay();
    return customerIdFromToken(token) === 1;
  },

  async requestPasswordReset(email) {
    await delay();
    // Always reports success — whether an address is registered must not be
    // observable from this endpoint.
    return { ok: true };
  },

  /* The fixture sends no reset emails, so there are no tokens to check; any
     well-formed request succeeds, which is enough to walk the page through. */
  async resetPassword() {
    await delay();
    return { ok: true };
  },
};

export const DEMO_CREDENTIALS = { email: DEMO_EMAIL, password: DEMO_PASSWORD };
