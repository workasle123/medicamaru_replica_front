/**
 * Where an order has got to, as five steps a customer can read.
 *
 * The admin panel tracks THREE INDEPENDENT COLUMNS — `order_status`,
 * `payment_status` and `delivery_status` — and staff move them separately: an
 * order is commonly `Processing / Paid / Dispatched`, and the delivery column
 * is the one the logistics screen writes when a parcel goes out. The
 * storefront used to render `order_status` alone, so marking an order
 * Dispatched changed nothing the customer could see.
 *
 * Collapsing three columns into one line of text was always going to lose
 * something; this keeps all three and lays them out in the order they
 * actually happen.
 *
 * THE PAYMENT STEP IS NOT DECORATION. This is a furikomi shop: ALIJ issues a
 * virtual bank account per order and the customer transfers into it, so there
 * is a real, days-long gap between "ordered" and "paid" during which the only
 * question they have is whether their money arrived. On a card shop that step
 * would be noise. Here it is the main thing.
 */

/** Steps in the order they occur. `key` is stable; labels are display only. */
export const ORDER_STEP_KEYS = ['ordered', 'payment', 'preparing', 'shipped', 'delivered'];

/**
 * Badge colour for a stage, for the one-chip callers.
 *
 * @param {string} stageKey  from orderProgress().stageKey
 */
export function orderStageVariant(stageKey) {
  switch (stageKey) {
    case 'delivered':
    case 'shipped':
      return 'inStock';
    case 'preparing':
      return 'info';
    case 'cancelled':
      return 'outOfStock';
    /* 'ordered' and 'payment' both mean money is still outstanding. */
    default:
      return 'warning';
  }
}

const STEP_LABELS = {
  ordered: 'ご注文受付',
  payment: 'ご入金確認',
  preparing: '発送準備',
  shipped: '発送済み',
  delivered: 'お届け完了',
};

/* What is happening while this step is the one being WAITED ON — so every
   line is forward-looking. Shown under the current step only: a column of
   five explanations is a wall of text, and four of them would describe
   something already finished.

   The tense matters more than it looks. These first read as descriptions of
   the step itself ("商品を発送しました" against 発送済み), which put
   「お届けが完了しました」 under a parcel that was still in transit — the bar
   told a customer their order had arrived while it was somewhere over the
   Indian Ocean. A step that has not happened yet cannot be described in the
   past tense. */
const STEP_HINTS = {
  ordered: 'ご注文を承りました。',
  payment: 'お振込の確認が取れ次第、発送の準備に進みます。',
  preparing: '商品をご用意しています。',
  shipped: '発送まで今しばらくお待ちください。',
  delivered: 'お届けまで今しばらくお待ちください。お問い合わせ番号から配送状況をご確認いただけます。',
};

/* The only step whose COMPLETED state is worth a line of its own — it is the
   end of the order, and 「お届け完了」 alone reads as a status rather than as
   the thank-you it should be. */
const DELIVERED_DONE_HINT = 'お届けが完了しました。ありがとうございました。';

const lower = (v) => String(v ?? '').toLowerCase();

/**
 * How far along the order is, as an index into ORDER_STEP_KEYS.
 *
 * Deliberately MONOTONIC — each test can only push the figure forward, never
 * back. The three columns are set by hand and do go out of step with one
 * another: an order marked Delivered whose `order_status` is still Processing
 * is normal in the panel, and a bar that read the lowest of them would walk
 * backwards in front of the customer.
 */
function reachedIndex(order) {
  const orderStatus = order?.status ?? null;
  const payment = lower(order?.paymentStatus);
  const delivery = lower(order?.deliveryStatus);

  /* The order exists, so the first step is always behind us. */
  let reached = 0;

  /* 'Pay Later' (後払い) is a promise, not a payment, so it does not clear
     this step — the money has not arrived and the parcel is not going out on
     it. It gets its own note in the UI rather than a tick here. */
  if (payment === 'paid') reached = Math.max(reached, 1);

  /* Being prepared. `order_status` Processing is what staff set once they
     pick the order; the delivery row moving at all says the same thing. */
  if (
    orderStatus === 'Processing' ||
    orderStatus === 'Completed' ||
    delivery === 'processing' ||
    delivery === 'dispatched' ||
    delivery === 'delivered'
  ) {
    reached = Math.max(reached, 2);
  }

  /* Handed to the carrier. The same test the admin panel uses to decide
     whether to send 発送のお知らせ — OrderController::isShipped — so the bar
     and the email can never disagree about whether a parcel has left. */
  if (orderStatus === 'Completed' || delivery === 'dispatched' || delivery === 'delivered') {
    reached = Math.max(reached, 3);
  }

  if (delivery === 'delivered') reached = Math.max(reached, 4);

  return reached;
}

/**
 * The progress model for one order.
 *
 * @param {object} order  a normalised order summary
 * @returns {{
 *   cancelled: boolean,
 *   paymentFailed: boolean,
 *   payLater: boolean,
 *   awaitingPayment: boolean,
 *   currentIndex: number,
 *   steps: Array<{key: string, label: string, hint: string|null, state: 'done'|'current'|'todo'}>
 * }}
 */
export function orderProgress(order) {
  const payment = lower(order?.paymentStatus);

  /* A cancelled order has no progress left to show. The caller renders a
     notice instead of a bar — a half-filled track above the word
     「キャンセル」 invites the reader to wait for the rest of it. */
  const cancelled = order?.status === 'Cancelled';

  const reached = reachedIndex(order);

  const paid = payment === 'paid';

  const steps = ORDER_STEP_KEYS.map((key, i) => {
    let state = 'todo';
    if (i <= reached) state = 'done';
    /* The step being waited on is the one AFTER the last completed one. At
       the end of the sequence nothing is pending, so the final step stays
       'done' and the bar reads as finished rather than still running. */
    if (i === reached + 1) state = 'current';

    /* THE ONE STEP THAT CAN BE PASSED WITHOUT BEING SATISFIED.
       `reached` is monotonic, so anything that moves the order to 発送準備 or
       beyond fills every earlier marker — including this one. That is right
       for the other four, which cannot happen out of order, and wrong here:
       a 後払い order ships before the money arrives, so the bar would show a
       green tick against 「ご入金確認」 while the customer still owes us.
       Telling someone they have paid when they have not is the one error on
       this bar that costs them money, so the marker is flagged and rendered
       as outstanding while the track behind it stays filled. */
    const unsettled = key === 'payment' && !paid && state === 'done';

    /* One line, under one step: the one being waited on — or, at the end of
       the sequence where nothing is pending, under the finished last step. */
    let hint = null;
    if (state === 'current') {
      hint = STEP_HINTS[key];
    } else if (state === 'done' && i === ORDER_STEP_KEYS.length - 1) {
      hint = DELIVERED_DONE_HINT;
    }

    return {
      key,
      label: STEP_LABELS[key],
      hint,
      state,
      unsettled,
    };
  });

  return {
    cancelled,
    /* The furthest step actually reached, for callers with room for one chip
       rather than a bar — the order list. Reading `order_status` there is
       what made a Dispatched order still say 「準備中」, because staff move
       the delivery column and leave the order column alone. */
    stageKey: cancelled ? 'cancelled' : ORDER_STEP_KEYS[reached],
    stageLabel: cancelled ? 'キャンセル' : STEP_LABELS[ORDER_STEP_KEYS[reached]],
    /* Both are terminal for the money and neither is a step: they are called
       out beside the bar so a customer is not left reading 「ご入金確認」 as
       merely slow when the payment has actually failed. */
    paymentFailed: payment === 'failed' || payment === 'refunded',
    payLater: payment === 'pay later',
    awaitingPayment: reached < 1 && !cancelled,
    currentIndex: Math.min(reached + 1, ORDER_STEP_KEYS.length - 1),
    steps,
  };
}
