'use client';

import { useEffect, useState } from 'react';

import styles from './ProductToc.module.css';

/**
 * ProductToc — the 目次 for a product detail page.
 *
 * Owned by the page rather than by ProductContent, which is where it used to
 * live. That version could only see its own content blocks, and the API
 * returns exactly one, so its `entries.length > 1` guard was never satisfied
 * and no product page ever rendered a TOC. Lifting it here lets it list every
 * section the page actually has — specs, body, FAQs, reviews, references —
 * which is what makes it worth having.
 *
 * Rendered only when there are at least two destinations — a table of
 * contents listing one item is noise.
 *
 * ## The selected entry
 *
 * Whichever entry was last clicked keeps a background colour, so the 目次
 * shows where you went. That is all it does. It does NOT follow the scroll
 * position: an earlier version used an IntersectionObserver to track the
 * heading currently in view, which is a different feature and a fussier one —
 * it needs a tuned viewport band, it fights ties between sections visible at
 * once, and it moves the highlight while you read rather than marking a choice
 * you made.
 *
 * Seeded from the URL hash on mount, so arriving at /product/x#副作用 — a
 * shared or bookmarked link — marks the right row rather than none.
 *
 * The links are ordinary `<a href="#id">`: server-rendered, crawlable, and
 * they jump correctly before this hydrates. The client half adds one
 * attribute, and nothing depends on it.
 *
 * @param {Object} props
 * @param {{id: string, label: string}[]} props.sections
 */
export default function ProductToc({ sections = [] }) {
  const [selectedId, setSelectedId] = useState(null);

  /* The hash is not available during render — this is a Client Component but
     it still renders on the server first, where there is no location. Reading
     it in an effect keeps the server and client markup identical. */
  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id) setSelectedId(id);
    };
    fromHash();
    /* Back and forward move the hash without a click, and the highlight should
       follow — otherwise it marks a row the reader has navigated away from. */
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  if (sections.length < 2) return null;

  return (
    <nav className={styles.toc} aria-labelledby="product-toc-title">
      <h2 className={styles.title} id="product-toc-title">
        目次
      </h2>
      <ul className={styles.list} role="list">
        {sections.map((section) => (
          <li key={section.id} className={styles.item}>
            <a
              href={`#${section.id}`}
              className={styles.link}
              /* Set on click as well as from the hash: clicking the entry you
                 are already on does not fire hashchange, and the highlight
                 should not depend on whether the hash happened to change. */
              onClick={() => setSelectedId(section.id)}
              /* `location`, not `true`: this is the current place within a set
                 of links, which is what aria-current="location" means — and it
                 gives the CSS something real to hang off instead of a
                 presentational class. */
              aria-current={section.id === selectedId ? 'location' : undefined}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
