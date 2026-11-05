'use client';

import { useRouter } from 'next/navigation';
import styles from './SortSelect.module.css';
import { SORT_OPTIONS } from '@/constants/site';
import { buildListingUrl } from '@/lib/query';

/**
 * SortSelect — result ordering.
 *
 * A Client Component, because changing sort must navigate on selection
 * without a submit button. It is deliberately tiny: the surrounding listing
 * page stays a Server Component, so this is the only JavaScript the catalogue
 * ships.
 *
 * medicine.shop offers no sorting at all — this is one of the clearest
 * competitive gaps identified in Phase 2.
 *
 * @param {Object} props
 * @param {string} props.basePath
 * @param {import('@/lib/types').ProductQuery} props.query
 */
export default function SortSelect({ basePath, query }) {
  const router = useRouter();

  function handleChange(event) {
    router.push(buildListingUrl(basePath, query, { sort: event.target.value }), {
      scroll: true,
    });
  }

  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor="sort-select">
        並び替え
      </label>
      <select
        id="sort-select"
        className={styles.select}
        value={query.sort || 'recommended'}
        onChange={handleChange}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
