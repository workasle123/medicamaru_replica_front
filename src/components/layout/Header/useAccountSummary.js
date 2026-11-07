'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';

/**
 * Sign-in state and the visitor's default delivery address.
 *
 * Two header components need this — the account link and the "お届け先" line —
 * and they render in different parts of the bar, so they cannot share a parent
 * without restructuring the header. The request is deduplicated at module level
 * instead: whichever mounts first starts the fetch, the second joins the same
 * promise, and one request serves both.
 *
 * Refetched on navigation, because signing in or out is a navigation and the
 * header must not keep saying ログイン to someone who just signed in.
 *
 * @returns {{signedIn: boolean, name: string|null, address: object|null}|null}
 *   null while unresolved — which the callers render as a placeholder rather
 *   than guessing, since guessing wrong is the bug this replaces.
 */

/** Shared across every component instance, deliberately. */
let inflight = null;
let lastPath = null;
let cached = null;

/* The cache is read through useSyncExternalStore, not useState(cached).
 *
 * useState(cached) seeded the first render with whatever the module held at
 * that moment. During hydration that is a race: the header's account link
 * mounts first, its fetch can resolve, and `cached` is filled in BEFORE a
 * lazily-hydrating component such as SidebarLogin renders — so the browser's
 * first render produced the login box while the server HTML held the
 * placeholder, and React threw hydration error #418 and rebuilt the tree.
 *
 * useSyncExternalStore takes a separate server snapshot (null, matching the
 * HTML) and only switches to the live value after hydration, so the server
 * and first client render always agree. */
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setCached(data) {
  cached = data;
  listeners.forEach((listener) => listener());
}

const getSnapshot = () => cached;
const getServerSnapshot = () => null;

export function useAccountSummary() {
  const pathname = usePathname();
  const summary = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    /* A new path means the answer may have changed — a login redirect being the
       case that matters — so the shared promise is dropped and refetched. */
    if (lastPath !== pathname) {
      lastPath = pathname;
      inflight = null;
    }

    if (!inflight) {
      inflight = fetch('/api/account/summary')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setCached(data);
          return data;
        })
        .catch(() => null);
    }
  }, [pathname]);

  return summary;
}
