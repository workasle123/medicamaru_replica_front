'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export function useAccountSummary() {
  const pathname = usePathname();
  const [summary, setSummary] = useState(cached);

  useEffect(() => {
    let cancelled = false;

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
          cached = data;
          return data;
        })
        .catch(() => null);
    }

    inflight.then((data) => {
      if (!cancelled) setSummary(data);
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return summary;
}
