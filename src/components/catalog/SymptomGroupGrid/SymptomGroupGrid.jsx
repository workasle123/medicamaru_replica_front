import Link from 'next/link';

import styles from './SymptomGroupGrid.module.css';
import SymptomGroupIcon from './SymptomGroupIcon';
import { formatNumber } from '@/lib/format';

/**
 * SymptomGroupGrid — the 症状から探す landing grid.
 *
 * Replaces what this page used to be: all ~300 symptoms as one flat wall of
 * chips. Those are supplier indication strings, half of them carrying a single
 * product, so the wall was unscannable and most of its destinations were a
 * one-product listing. This is ~19 cards in customer language instead, and the
 * raw symptoms become refinements inside whichever card you open.
 *
 * The whole card is the target: the name carries the link and its ::after is
 * stretched over the card, which keeps this to one anchor per card rather than
 * wrapping everything in an <a>.
 *
 * @param {Object} props
 * @param {import('@/lib/types').SymptomGroup[]} props.groups
 */
export default function SymptomGroupGrid({ groups = [] }) {
  if (!groups.length) return null;

  return (
    <ul className={styles.grid} role="list">
      {groups.map((group) => (
        <li key={group.slug}>
          <div className={styles.card}>
            <span className={styles.iconFrame}>
              <SymptomGroupIcon name={group.icon} />
            </span>

            <Link href={`/symptom/${group.slug}`} className={styles.name}>
              {group.name}
            </Link>

            {/* Only when the API supplied one. The count is what tells a
                browsing customer which cards are worth opening, so it is part
                of the card rather than a detail on the page behind it. */}
            {typeof group.productCount === 'number' && group.productCount > 0 && (
              <span className={styles.count}>{formatNumber(group.productCount)}件</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
