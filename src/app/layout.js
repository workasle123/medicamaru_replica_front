import { Suspense } from 'react';
import { Noto_Sans_JP } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

import Header from '@/components/layout/Header/Header';
import Footer from '@/components/layout/Footer/Footer';
import MobileTabBar from '@/components/layout/MobileTabBar/MobileTabBar';
import RegisterPopupMount from '@/components/marketing/RegisterPopup/RegisterPopupMount';
import SitePopupMount from '@/components/marketing/SitePopup/SitePopupMount';
import ChatLauncher from '@/components/layout/Header/ChatLauncher';
import { SITE } from '@/constants/site';
import { absoluteUrl, ALLOW_INDEXING, CLARITY_ID, GA_ID } from '@/lib/seo';

/**
 * Noto Sans JP — the only genuinely complete, well-hinted open Japanese
 * family, and already the choice of the strongest reference site.
 *
 * preload is disabled deliberately: the Japanese glyph set splits into a
 * large number of unicode-range chunks, and preloading them all would hurt
 * LCP far more than the swap costs. Revisit with a self-hosted subset before
 * launch (Phase 12).
 */
/* TWO WEIGHTS, NOT THREE — this is the single biggest lever on CSS weight.
 *
 * Google serves Noto Sans JP as 124 unicode-range subsets PER WEIGHT, so each
 * weight is 124 @font-face rules. Three weights built a 283 KB stylesheet
 * (94 KB gzipped) that is render-blocking on every page — 67% of all the CSS
 * this site ships, to declare fonts.
 *
 * The subsetting itself is worth keeping: it is what lets a browser fetch the
 * few glyph files a page actually needs instead of a multi-megabyte CJK font.
 * Self-hosting one full file per weight would shrink this CSS to nothing and
 * cost far more in font bytes. So the lever is the number of weights.
 *
 * 500 went because it was the cheapest to lose: 24 rules used it against 205
 * for 700, all of them small UI text — chips, breadcrumbs, pagination, form
 * labels, section subtitles. --fw-medium now resolves to 400, so those sit at
 * body weight rather than a step above it.
 *
 * TO PUT IT BACK: add '500' here and set --fw-medium back to 500 in
 * tokens.css. Nothing else refers to the weight directly.
 */
const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-sans-jp',
});

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}｜${SITE.tagline}`,
    template: `%s｜${SITE.name}`,
  },
  description: SITE.description,
  alternates: { canonical: absoluteUrl('/') },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: SITE.locale,
    url: absoluteUrl('/'),
  },
  twitter: { card: 'summary_large_image' },
  /* noindex, nofollow everywhere except a deployment that has explicitly opted
     in via NEXT_PUBLIC_ALLOW_INDEXING. Keeps the Vercel preview, branch builds
     and local dev out of the index without anyone having to remember. */
  robots: ALLOW_INDEXING
    ? { index: true, follow: true }
    : { index: false, follow: false },
  /* Search Console. Next turns this into
     <meta name="google-site-verification" content="…">, so the variable holds
     the TOKEN only — the string out of the content attribute Google shows you,
     not the whole tag.

     Undefined simply omits the meta, so a deployment without the variable is
     unverified rather than broken. Unlike robots this is not gated on
     ALLOW_INDEXING: verifying a property is independent of being indexed, and
     the site is still noindex until launch. */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7b3fc6',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang={SITE.lang}
      className={notoSansJp.variable}
      data-scroll-behavior="smooth"
    >
      <body>
        {/* No structured data here. Organization and WebSite are declared on
            the HOMEPAGE (src/schema/home.js) and referenced by @id from the
            pages that need them — Google's Organization guidance puts that
            markup on one page, and emitting it from the layout as well gave
            the homepage two conflicting definitions of the same @id. */}

        <a href="#main" className="skip-link">
          本文へスキップ
        </a>

        {/* The whole application sits inside one centred frame, so the
            header and footer are bounded by it too rather than bleeding to
            the viewport edge. */}
        <div className="app-shell">
          <Header />

          <main id="main">{children}</main>

          <Footer />
        </div>

        {/* Docked above the tab bar, not inside the header — so it is out
            of the way while reading down a page and comes back with the
            scroll-up. Rendered here rather than per page so it is present on
            every route. */}
        <ChatLauncher />

        <MobileTabBar />

        {/* 新規会員登録キャンペーン, a few seconds after someone arrives.

            Replaces the LINE friend-add invitation that sat here disabled. That
            one was held back because it promised 30% against a 10% coupon —
            景品表示法's 有利誤認. This advertises the registration points
            instead, which the backend credits automatically when the account is
            created, so the promise and the mechanism are one event rather than
            two things to keep aligned.

            The figure is read from Admin → Settings at render, by the Mount
            wrapper — which also decides whether the popup appears at all. No
            points configured, or an unreachable backend, means no popup
            rather than a hardcoded number nobody is going to keep in step.

            Mounted here rather than per-page so one visit gets one popup
            wherever the visitor landed.

            Inside Suspense because the wrapper awaits: the popup is on a 4.5
            second timer and must not hold up the shell around it. The
            fallback is null — there is nothing to show in its place. */}
        <Suspense fallback={null}>
          <RegisterPopupMount />
        </Suspense>

        {/* Admin-managed campaign popups (Admin → Popups).

            Both popups mount; only one can ever be on screen. They settle it
            between themselves through lib/popup-slot.js — a managed campaign
            reserves the slot on mount and the registration offer stands down
            when it finds a reservation. Deliberate, scheduled and temporary
            beats the standing offer.

            Rendered AFTER the registration popup, and that must not matter:
            the arbitration happens in effects, which run for both before
            either timer fires. If it ever does start to matter, popup-slot
            has the bug, not this file.

            Its own Suspense boundary, so a slow popups request cannot delay
            the registration popup's own fetch. */}
        <Suspense fallback={null}>
          <SitePopupMount />
        </Suspense>

        {/* GA4. Last in the body, and only when there is an ID to report to —
            see GA_ID for why that gate matters on a build-time-inlined var.

            No `strategy`: afterInteractive is the default in this version and
            is the one we want. beforeInteractive would block render, which
            these pages can least afford — the Japanese font splits into many
            unicode-range chunks and LCP already carries that.

            The inline script has an id because next/script requires one to
            track and optimise it; without it the script is not managed. */}
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <Script id="gtag-init">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
        {/* Microsoft Clarity — session replay and heatmaps. Same placement and
            same gate as GA4 above: last in the body, and only when there is a
            project to report to.

            The snippet is Clarity's own loader, verbatim apart from the id. It
            appends its own <script> to the head, so next/script only has to
            run it once — hence an inline Script with an id rather than `src`. */}
        {CLARITY_ID && (
          <Script id="clarity-init">
            {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_ID}");`}
          </Script>
        )}
      </body>
    </html>
  );
}
