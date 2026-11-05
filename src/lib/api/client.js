/**
 * Medicamaru — HTTP client.
 *
 * Centralised fetch wrapper. Every backend call goes through here so that
 * timeouts, error normalisation and auth are handled in exactly one place.
 *
 * The base URL is read server-side only. NEXT_PUBLIC_* is deliberately NOT
 * used for the API origin: browser calls go through our own /api proxy route
 * handlers so the backend token never reaches the client.
 */

import { ApiError, NetworkError, TimeoutError } from './errors';

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Retry policy for reads.
 *
 * The backend drops connections intermittently — sustained ECONNRESET
 * stretches are routine on this host. Without a retry, one dropped packet
 * anywhere in a ~2,500-page build fails the whole build, and one dropped
 * packet at request time serves an error to a customer whose second attempt
 * would have worked.
 *
 * Only GET is retried. Retrying a POST could place an order twice.
 * A 500 is not retried either: the failures we have seen from this backend
 * are deterministic (a missing class), so a second attempt just costs time.
 */
const RETRY_ATTEMPTS = 2;
const RETRY_BACKOFF_MS = [300, 900];
const RETRY_STATUSES = new Set([502, 503, 504]);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @returns {string} */
function getBaseUrl() {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error(
      'API_BASE_URL is not set. Copy .env.example to .env.local. ' +
        'While the backend replica is unavailable, set DATA_SOURCE=mock.'
    );
  }
  return url.replace(/\/$/, '');
}

/**
 * Build a query string from a params object, dropping empty values so we
 * never emit `?q=&page=` noise into URLs.
 *
 * @param {Record<string, unknown>} [params]
 * @returns {string}
 */
export function buildQuery(params) {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.filter((v) => v !== undefined && v !== null && v !== '')
        .forEach((v) => sp.append(key, String(v)));
    } else if (typeof value === 'boolean') {
      if (value) sp.set(key, '1');
    } else {
      sp.set(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/**
 * @param {string} path        Path beginning with '/'
 * @param {Object} [options]
 * @param {string} [options.method]
 * @param {Record<string, unknown>} [options.params]
 * @param {unknown} [options.body]
 * @param {Record<string, string>} [options.headers]
 * @param {string} [options.token]     Bearer token for authenticated calls
 * @param {number} [options.timeoutMs]
 * @param {number|false} [options.revalidate]  Next.js ISR hint
 * @param {string[]} [options.tags]            Next.js cache tags
 * @returns {Promise<any>}
 */
export async function apiFetch(path, options = {}) {
  const retries = (options.method ?? 'GET') === 'GET' ? RETRY_ATTEMPTS : 0;

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await requestOnce(path, options);
    } catch (error) {
      const transient =
        error instanceof NetworkError ||
        error instanceof TimeoutError ||
        (error instanceof ApiError && RETRY_STATUSES.has(error.status));

      if (attempt >= retries || !transient) throw error;
      await delay(RETRY_BACKOFF_MS[attempt] ?? RETRY_BACKOFF_MS.at(-1));
    }
  }
}

async function requestOnce(path, options = {}) {
  const {
    method = 'GET',
    params,
    body,
    headers = {},
    token,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    revalidate,
    tags,
  } = options;

  const url = `${getBaseUrl()}${path}${buildQuery(params)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  /* A FormData body goes through untouched. It is the only way to send a file
     — the review photo — and fetch has to set Content-Type itself, because
     only it knows the multipart boundary. Setting the header here would send a
     boundary-less content type and Laravel would parse no fields at all. */
  const isMultipart = typeof FormData !== 'undefined' && body instanceof FormData;

  /** @type {RequestInit & {next?: object}} */
  const init = {
    method,
    signal: controller.signal,
    headers: {
      Accept: 'application/json',
      ...(body && !isMultipart ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: isMultipart ? body : JSON.stringify(body) } : {}),
  };

  if (revalidate !== undefined || tags) {
    init.next = {
      ...(revalidate !== undefined ? { revalidate } : {}),
      ...(tags ? { tags } : {}),
    };
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      throw new TimeoutError(`Request to ${path} timed out after ${timeoutMs}ms`);
    }
    throw new NetworkError(`Could not reach the API at ${path}`, { cause: err });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    // Try to surface the backend's own message; fall back to the status text.
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(
      payload?.message || response.statusText || 'Request failed',
      { status: response.status, path, payload }
    );
  }

  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch (err) {
    throw new ApiError('The API returned a malformed JSON response', {
      status: response.status,
      path,
      cause: err,
    });
  }
}
