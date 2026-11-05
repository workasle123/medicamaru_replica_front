/**
 * There is ONE popup slot on this site, and this decides who gets it.
 *
 * Two independent popups can now want the screen at the same moment: the
 * hardcoded 新規会員登録 offer, and whatever campaign an admin has scheduled.
 * Two modals stacked on one page is not a design anyone chose — it is what
 * happens by default when two components each own their own timer.
 *
 * ## Why a module-level variable and not React state or context
 *
 * These two components are siblings in the ROOT LAYOUT with no shared parent
 * below it, and the layout is a Server Component — it cannot hold client
 * state, and wrapping the whole site in a client provider to arbitrate a
 * popup would opt every page out of static rendering. A module is the only
 * shared thing they genuinely have. It lives for the page's lifetime, which
 * is exactly how long the decision needs to last.
 *
 * ## Reserve, then claim
 *
 * Two steps, because the timers fire at different times and the first to
 * fire is not necessarily the one that should win.
 *
 *   reserve()  on MOUNT, by a popup that knows it has something to show
 *   claim()    when its timer fires and it is about to open
 *
 * Both popups mount in the same commit, well before any timer, so a
 * reservation is normally in place before the first one fires — and a
 * reservation BLOCKS a claim, so the outcome does not depend on which timer
 * is shorter. The alternative, first-timer-wins, silently handed the slot to
 * whichever popup had the shorter delay: an admin setting a 10-second delay
 * would have found their campaign never appeared, with nothing anywhere to
 * explain why.
 *
 * The one case the reservation cannot cover: the two mounts sit in separate
 * Suspense boundaries, so a popups request slow enough to resolve after the
 * registration popup's 4.5s fuse lets that one claim first. The campaign is
 * then skipped for that page view. Still exactly one popup, which is the
 * property that matters; it simply is not the preferred one. Worth knowing
 * before chasing a campaign that "sometimes does not show" on a bad day for
 * the backend.
 *
 * The managed popup reserves; the registration popup does not, and stands
 * down when it finds a reservation. A campaign is deliberate, scheduled and
 * temporary, so it outranks the standing offer.
 */

/** Set by a popup that has decided it will show. */
let reservedBy = null;

/** Set when a popup actually opens. */
let claimedBy = null;

/**
 * Has any popup already been shown during this visit?
 *
 * ONE INVITATION PER VISIT. That was always the intent, and it used to be
 * enforced by accident: both popups armed in a mount-only effect, and the
 * root layout they live in never remounts, so the timers could only ever run
 * once — on a full page load.
 *
 * The accident was also the bug. A visitor who arrived on the top page and
 * then clicked ANYWHERE never saw another popup, because a client-side
 * navigation does not remount a layout. The free-shipping popup targets
 * `/product/*`, a page people reach by clicking, so it could essentially
 * never fire. Only pressing reload made a popup appear, which is exactly how
 * it was reported.
 *
 * The popups now re-evaluate on every path change, which fixes that and
 * reintroduces the question the accident had been answering: what stops a
 * popup appearing on all five product pages someone browses? This flag does.
 *
 * Deliberately NOT cleared by releasePopupSlot. The slot is per-page-view
 * bookkeeping and has to reset so the next path can arm; this is per-VISIT
 * and must not. Module state dies with the page, so a genuine new visit —
 * a reload, a new tab, coming back tomorrow — starts fresh, which is the
 * definition of a visit that matters here.
 *
 * Records WHICH popups have had a turn, not merely that one has, because the
 * two ranks get different budgets — see canPopupShowThisVisit.
 */
const shownOwners = new Set();

/**
 * Declare an intent to show. Called on mount, before any timer.
 *
 * Last reservation wins, which cannot happen in practice — only the managed
 * popup reserves — but if a third popup is ever added, it should reserve too
 * and this will need a priority rather than a single variable.
 */
export function reservePopupSlot(owner) {
  reservedBy = owner;
}

/**
 * Give up a reservation — the popup was dismissed before it opened, or its
 * effect is being torn down.
 */
export function releasePopupSlot(owner) {
  if (reservedBy === owner) reservedBy = null;
  if (claimedBy === owner) claimedBy = null;
}

/**
 * Is some OTHER popup intending to show?
 *
 * The caller passes its own id so it never stands down for itself — a React
 * effect can run twice in development's Strict Mode, and a popup that
 * refused to open because it had already reserved the slot would be a bug
 * that only appears locally.
 */
export function isPopupSlotTaken(owner) {
  if (reservedBy && reservedBy !== owner) return true;
  if (claimedBy && claimedBy !== owner) return true;
  return false;
}

/**
 * Take the slot. Returns false if someone else already has it, in which case
 * the caller must not open.
 */
export function claimPopupSlot(owner) {
  if (claimedBy && claimedBy !== owner) return false;

  /* A RESERVATION BLOCKS A CLAIM. Without this line the reservation did
     nothing at fire time, and the slot went to whichever timer went off
     first: the registration popup is on a fixed 4.5s fuse, so any admin
     delay above 4.5 seconds lost the slot to it and the campaign never
     appeared. Nothing would have reported that — the admin screen would say
     the popup was live, and it would be, and it would never show.
     A 1-second delay in testing hid this completely. */
  if (reservedBy && reservedBy !== owner) return false;

  claimedBy = owner;
  /* Recorded HERE rather than in each popup, because this is the one function
     both of them must call to open and the only one that knows the answer was
     yes. A caller that forgot would silently reintroduce a popup following
     someone around the site. */
  shownOwners.add(owner);
  return true;
}

/**
 * May this popup still have a turn this visit?
 *
 * Checked before arming a timer, so a popup that cannot show never starts one
 * — and, more importantly, never reserves the slot it would then sit on.
 *
 * NOT a flat one-per-visit rule, and the difference is the whole point. A
 * flat rule was tried and starved exactly the popups that matter: the
 * registration offer matches almost every page and is on a fixed 4.5s fuse,
 * so a visitor who paused anywhere spent the budget on it — and the targeted
 * campaigns could then never show, however deliberately an admin had aimed
 * them. Measured: landing on /cart, clicking to a category, then to a
 * product gave the registration popup on the category page and the
 * free-shipping popup never once, which is the bug this was meant to fix.
 *
 * So the budget follows the priority this module already states. A campaign
 * is scheduled, targeted and temporary; the registration offer is always
 * there and can wait:
 *
 *   managed campaign   blocked only once a CAMPAIGN has shown
 *   registration offer blocked once ANYTHING has shown
 *
 * The worst case is therefore the registration offer early in a visit and
 * one campaign later, on the page it was aimed at. Never two on a page — the
 * slot handles that — and never a popup on every page.
 */
export function canPopupShowThisVisit(owner) {
  if (owner === MANAGED_POPUP) return !shownOwners.has(MANAGED_POPUP);
  return shownOwners.size === 0;
}

/** The hardcoded 新規会員登録 popup. */
export const REGISTER_POPUP = 'register-offer';

/** Any admin-managed popup. Only one can match a page, so one id is enough. */
export const MANAGED_POPUP = 'managed';
