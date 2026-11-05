import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Medicamaru — the order receipt a guest sees after checkout.
 *
 * WHY THIS EXISTS
 *
 * The confirmation page reads the order back through /orders/details, which
 * sits behind auth:sanctum. A guest has no token, so that answered 401 and the
 * page rendered a 404 — for an order that had been placed, and with the bank
 * account the customer has to pay into nowhere on screen.
 *
 * The checkout response already carries everything the page shows (the order,
 * the gateway's virtual account, and the cart it was placed from), so it is kept
 * here: one httpOnly cookie, signed so its contents cannot be altered, scoped to
 * /checkout/complete, and valid for 24 hours. After that, or on another device,
 * the confirmation email has the same details.
 *
 * Nothing new is exposed on the server — the cookie only ever goes back to the
 * browser that placed the order. It holds only what the page renders.
 *
 * ORDER_RECEIPT_SECRET signs it — set it in production. The signature is what
 * stops a cookie planted from elsewhere (a sibling subdomain can set cookies
 * for this one) from showing a customer someone else's bank account to pay.
 */

const COOKIE = 'medicamaru_receipt';
const TTL_SECONDS = 60 * 60 * 24;

/* Browsers cap a cookie at ~4 KB including its name and attributes. */
const MAX_VALUE_LENGTH = 3800;

/* Without the variable, a random key kept on globalThis — NOT in a module
   constant. Next bundles the checkout action and the confirmation page
   separately, each with its own copy of this module, so a module-level random
   key differed between the two and no receipt ever verified (found in testing).
   globalThis is shared by every copy in the process. The cost of relying on it:
   receipts written before a restart or redeploy stop verifying. */
function secret() {
  if (process.env.ORDER_RECEIPT_SECRET) return process.env.ORDER_RECEIPT_SECRET;
  globalThis.__medicamaruReceiptKey ??= randomBytes(32).toString('hex');
  return globalThis.__medicamaruReceiptKey;
}

const sign = (data) => createHmac('sha256', secret()).update(data).digest('base64url');
const encode = (value) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

/** Only the fields the confirmation page renders. */
function pick(order) {
  return {
    id: String(order.id ?? ''),
    orderNumber: order.orderNumber ?? null,
    placedAt: order.placedAt ?? null,
    paymentMethod: order.paymentMethod ?? null,
    subtotal: order.subtotal ?? 0,
    discount: order.discount ?? 0,
    shipping: order.shipping ?? 0,
    total: order.total ?? 0,
    pointsEarned: order.pointsEarned ?? 0,
    bankTransfer: order.bankTransfer ?? null,
    lines: (order.lines ?? []).map((l) => ({
      slug: l.slug,
      productName: l.productName,
      packLabel: l.packLabel,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
    })),
    moreLines: 0,
    shippingAddress: order.shippingAddress ?? null,
  };
}

/**
 * Keep the receipt for the confirmation page. Oversized carts are trimmed —
 * trailing lines first (the page says how many more there were), then the
 * address — rather than failing: the bank details must always fit.
 *
 * @param {object} order  An order summary plus lines, bank details and address.
 */
export async function saveReceipt(order) {
  const receipt = { ...pick(order), exp: Math.floor(Date.now() / 1000) + TTL_SECONDS };

  let payload = encode(receipt);
  while (payload.length > MAX_VALUE_LENGTH && receipt.lines.length > 1) {
    receipt.lines.pop();
    receipt.moreLines += 1;
    payload = encode(receipt);
  }
  if (payload.length > MAX_VALUE_LENGTH) {
    receipt.shippingAddress = null;
    payload = encode(receipt);
  }

  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/checkout/complete',
    maxAge: TTL_SECONDS,
  });
}

/**
 * The receipt for this order, or null when there is none, it was tampered
 * with, it has expired, or it belongs to a different order.
 *
 * @param {string} orderId
 */
export async function readReceipt(orderId) {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;

  const dot = raw.lastIndexOf('.');
  if (dot < 1) return null;
  const payload = raw.slice(0, dot);
  const given = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(sign(payload));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  let receipt;
  try {
    receipt = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!receipt || receipt.exp < Math.floor(Date.now() / 1000)) return null;
  if (String(receipt.id) !== String(orderId)) return null;

  delete receipt.exp;
  return receipt;
}
