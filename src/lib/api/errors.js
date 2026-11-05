/**
 * Medicamaru — error taxonomy.
 *
 * Every API integration must handle: Loading, Success, Empty, Validation,
 * Auth, API, Network, Unexpected (project brief §16). These classes give
 * each case a distinct, catchable type.
 *
 * User-facing copy lives in toUserMessage() and is written in Japanese;
 * the technical detail stays on the error object for logs.
 */

export class AppError extends Error {
  /**
   * @param {string} message
   * @param {{cause?: unknown}} [options]
   */
  constructor(message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = this.constructor.name;
  }
}

/** The request never reached the server. */
export class NetworkError extends AppError {}

/** The request reached the server but took too long. */
export class TimeoutError extends AppError {}

/** The server responded with a non-2xx status. */
export class ApiError extends AppError {
  /**
   * @param {string} message
   * @param {{status?: number, path?: string, payload?: unknown, cause?: unknown}} [meta]
   */
  constructor(message, meta = {}) {
    super(message, { cause: meta.cause });
    this.status = meta.status ?? 0;
    this.path = meta.path;
    this.payload = meta.payload;
  }

  get isAuth() {
    return this.status === 401 || this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isValidation() {
    return this.status === 422 || this.status === 400;
  }

  get isServer() {
    return this.status >= 500;
  }
}

/** Field-level validation failures, keyed by field name. */
export class ValidationError extends AppError {
  /**
   * @param {string} message
   * @param {Record<string, string[]>} [fields]
   */
  constructor(message, fields = {}) {
    super(message);
    this.fields = fields;
  }
}

/**
 * True when a failure leaves us not knowing what the answer is.
 *
 * This is the line between the two things a service can do with an error:
 *
 *   - The backend ANSWERED and the answer was "nothing here" (404) or "your
 *     input is wrong" (400/422). That is a real, cacheable fact, and a page
 *     may safely render its empty state.
 *
 *   - The backend did NOT answer — the request never landed, timed out, or
 *     the server broke (5xx). We do not know whether the data exists. On an
 *     ISR route, rendering that as "empty" is worse than failing: the render
 *     succeeds, so Next caches the blank page and serves it to everyone for
 *     the length of the revalidate window, even after the backend recovers.
 *     Throwing keeps the last good copy in place instead.
 *
 * Anything unrecognised is treated as unavailable. An unexpected error is by
 * definition an unknown state, and guessing "empty" is how a bug turns into
 * a silently blank page.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export function isUnavailable(error) {
  if (error instanceof ApiError) {
    return error.isServer || error.status === 0;
  }
  if (error instanceof ValidationError) return false;
  return true;
}

/**
 * Map any thrown value to a message safe to show a customer.
 * Deliberately vague about internals — detail belongs in logs, not the UI.
 *
 * @param {unknown} error
 * @returns {string} Japanese user-facing message
 */
export function toUserMessage(error) {
  if (error instanceof NetworkError) {
    return '通信エラーが発生しました。インターネット接続をご確認のうえ、もう一度お試しください。';
  }
  if (error instanceof TimeoutError) {
    return '通信に時間がかかっています。しばらくしてから、もう一度お試しください。';
  }
  if (error instanceof ValidationError) {
    return error.message || '入力内容をご確認ください。';
  }
  if (error instanceof ApiError) {
    if (error.isAuth) return 'ログインの有効期限が切れました。再度ログインしてください。';
    if (error.isNotFound) return 'お探しのページは見つかりませんでした。';
    if (error.isValidation) return error.message || '入力内容をご確認ください。';
    if (error.isServer) return 'サーバーで問題が発生しました。時間をおいて再度お試しください。';
  }
  return '予期しないエラーが発生しました。時間をおいて再度お試しください。';
}

/**
 * Structured server-side logging. Keeps full detail out of the browser.
 * @param {unknown} error
 * @param {Record<string, unknown>} [context]
 */
export function logError(error, context = {}) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[medicamaru]', { error, ...context });
    return;
  }
  console.error(
    JSON.stringify({
      level: 'error',
      name: error?.name,
      message: error?.message,
      status: error?.status,
      path: error?.path,
      ...context,
    })
  );
}
