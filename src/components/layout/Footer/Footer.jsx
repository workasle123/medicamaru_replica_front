import Image from 'next/image';
import Link from 'next/link';

import styles from './Footer.module.css';
import { SITE, TRUST_POINTS } from '@/constants/site';
import { FOOTER_NAV, SOCIAL_LINKS } from '@/constants/nav';
import { listAllCategories, listTopTags } from '@/services/categories.service';
import SocialIcon from '@/components/ui/SocialIcon/SocialIcon';

/**
 * Footer.
 *
 * Brand block on the left, then four link columns. The brand block carries what
 * a link list cannot: the logo, a sentence saying what the site is, the social
 * accounts, and a contact button — so the footer introduces the shop as well as
 * indexing it.
 *
 * Every category is listed, not the homepage's top five. The footer is the one
 * place on every page that can hold the whole taxonomy without competing for
 * attention, and it gives each category an internal link from every page.
 * Fetched live, so a category added in the admin panel appears on its own.
 */
export default async function Footer() {
  /* Both in parallel: the footer is on every page, so a waterfall here costs
     a round trip on every render. */
  const [categories, tags] = await Promise.all([
    /* Every active category, matching the header — see the note there. The
       footer column is a catalogue index, not a feature slot. */
    listAllCategories().catch(() => []),
    /* Ten, not 25: the tag column sits beside four lines of disclaimer, and 25
       ran to seven rows against the text’s two — leaving the gap under the text
       that the tags were meant to close. Ten lands both columns at a similar
       height. */
    listTopTags(10).catch(() => []),
  ]);
  const socials = SOCIAL_LINKS.filter((s) => s.url);

  return (
    <footer className={styles.footer}>
      <div className={styles.trust}>
        <div className="container">
          <h2 className="visually-hidden">当サイトの安心・安全への取り組み</h2>
          <ul className={styles.trustGrid} role="list">
            {TRUST_POINTS.map((point) => (
              <li key={point.title} className={styles.trustItem}>
                <span className={styles.trustIcon} aria-hidden="true">
                  <TrustIcon name={point.icon} />
                </span>
                <span>
                  <span className={styles.trustTitle}>{point.title}</span>
                  <span className={styles.trustBody}>{point.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.main}>
        <div className="container">
          <div className={styles.columns}>
            {/* Brand block */}
            <div className={styles.brand}>
              <Link href="/" className={styles.brandLogo} aria-label={`${SITE.name} ホーム`}>
                {/* unoptimized, matching the header — see the note there. */}
                <Image
                  src="/brand/logo.png"
                  alt={SITE.name}
                  width={225}
                  height={117}
                  className={styles.brandLogoImg}
                  unoptimized
                />
              </Link>

              <p className={styles.brandText}>{SITE.description}</p>

              {socials.length > 0 && (
                <ul className={styles.socials} role="list">
                  {socials.map((s) => (
                    <li key={s.key}>
                      <a
                        href={s.url}
                        className={`${styles.social} ${styles[`social_${s.key}`]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                      >
                        <SocialIcon name={s.key} />
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              <Link href="/contact" className={styles.contactBtn}>
                <MailIcon />
                お問い合わせ
              </Link>
            </div>

            {/* Link columns. Categories sit second, matching where someone
                looking for products expects to find them. */}
            <FooterColumn heading={FOOTER_NAV[0].heading} icon={FOOTER_NAV[0].icon}>
              {FOOTER_NAV[0].links.map((link) => (
                <FooterLink key={link.href} href={link.href} external={link.external}>
                  {link.label}
                </FooterLink>
              ))}
            </FooterColumn>

            {categories.length > 0 && (
              <FooterColumn heading="カテゴリー" icon="category" wide>
                {categories.map((category) => (
                  <FooterLink key={category.slug} href={`/category/${category.slug}`}>
                    {category.name}
                  </FooterLink>
                ))}
              </FooterColumn>
            )}

            {FOOTER_NAV.slice(1).map((group) => (
              <FooterColumn key={group.heading} heading={group.heading} icon={group.icon}>
                {group.links.map((link) => (
                  <FooterLink key={link.href} href={link.href} external={link.external}>
                    {link.label}
                  </FooterLink>
                ))}
              </FooterColumn>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.legal}>
        <div className="container">
          <div className={styles.legalRow}>
            <div className={styles.legalText}>
              {/* A heading to match 人気のタグ opposite. Without one the two
                  columns could not line up: the disclaimer's first line sat
                  level with the tag HEADING while the pills began 27px lower,
                  so nothing in the row agreed with anything else. With both
                  columns headed, the headings align and the bodies align. */}
              <h2 className={styles.legalTitle}>ご利用にあたって</h2>
              <p className={styles.disclaimer}>
                当サイトは、医薬品の個人輸入をサポートする通販サイトです。掲載している情報は製品の概要を
                提供するものであり、医療上の助言・診断・治療に代わるものではありません。ご使用の前には
                必ず医師または薬剤師にご相談ください。個人輸入した医薬品は、ご本人の使用に限られ、
                第三者への譲渡・販売は法律で禁止されています。
              </p>
            </div>

            {tags.length > 0 && (
              <div className={styles.tagBand}>
                <h2 className={styles.tagTitle}>人気のタグ</h2>
                {/* No longer links — same reason as the product page. These
                    pointed at /search?q=<tag>, which matches product NAMES and
                    never the tag tables, so the destination had little to do
                    with the tag.

                    The product count is gone too. A number on a capsule you
                    cannot click promises a list that is not there, and in a
                    row of ten it is ten numbers competing with the words they
                    sit beside. listTopTags still returns productCount — it is
                    what the endpoint ranks by — this just does not print it. */}
                <ul className={styles.tagList} role="list">
                  {tags.map((tag) => (
                    <li key={tag.name} className={styles.tag}>
                      {tag.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Outside legalRow on purpose. Inside it this sat in the left-hand
              column of a two-column grid, so centring the text would have
              centred it against the disclaimer rather than the footer. As its
              own full-width line it is centred on the page. */}
          <p className={styles.copyright}>© 2026 メディカ丸  All Rights Reserved.</p>

          {/* Its own line rather than appended to the copyright: they are two
              different statements, and a reader scanning the footer should not
              have to read through one to find the other.

              "Managed by", not 運営. 運営者 is the term 特定商取引法 uses for the
              party legally answerable for the shop, and putting it here would
              make a claim about who that is on every page of a YMYL pharmacy
              site. Revisit the wording when the 特商法 page is written and
              settles the question properly. */}
          <p className={styles.operator}>
            Managed by{' '}
            <a
              href="https://www.sensepharmaceuticals.com/"
              className={styles.operatorLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sense Pharmaceuticals
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * One footer column. `wide` gives the categories twice the width so eight
 * entries flow as two sub-columns instead of running to double the height of
 * everything beside them.
 */
function FooterColumn({ heading, icon, wide = false, children }) {
  return (
    <div className={wide ? `${styles.column} ${styles.columnWide}` : styles.column}>
      <h3 className={styles.heading}>
        <span className={styles.headingIcon} aria-hidden="true">
          <ColumnIcon name={icon} />
        </span>
        {heading}
      </h3>
      <ul className={wide ? `${styles.list} ${styles.listWide}` : styles.list} role="list">
        {children}
      </ul>
    </div>
  );
}

/* The chevron is a pseudo-element on the <li>, not a character in the link, so
   it never lands in the accessible name or in copied text. */
/**
 * One footer link.
 *
 * `external` renders a plain <a> with a new tab. next/link would navigate to
 * an absolute URL perfectly well, but it would not carry target or rel, and
 * sending someone to the carrier's site in the same tab loses the page they
 * were on. noopener because it opens a new tab; the referrer is left alone,
 * since there is nothing to hide from 日本郵便.
 */
function FooterLink({ href, children, external = false }) {
  return (
    <li className={styles.item}>
      {external ? (
        <a href={href} target="_blank" rel="noopener">
          {children}
        </a>
      ) : (
        <Link href={href}>{children}</Link>
      )}
    </li>
  );
}

function ColumnIcon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  if (name === 'category') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (name === 'info') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    );
  }

  if (name === 'support') {
    return (
      <svg {...common}>
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <path d="M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2Zm16 0a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2Z" />
        <path d="M17 18v1a3 3 0 0 1-3 3h-2" />
      </svg>
    );
  }

  /* guide */
  return (
    <svg {...common}>
      <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M15 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function TrustIcon({ name }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  if (name === 'truck') {
    return (
      <svg {...common}>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17" cy="18" r="1.6" />
      </svg>
    );
  }

  if (name === 'lock') {
    return (
      <svg {...common}>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  if (name === 'card') {
    return (
      <svg {...common}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 3 4 6v6c0 4.4 3.4 8.4 8 9 4.6-.6 8-4.6 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
