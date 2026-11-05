import SectionHeader from '@/components/ui/SectionHeader/SectionHeader';
import Skeleton, { SkeletonScreen } from '@/components/ui/Skeleton/Skeleton';
import BreadcrumbsSkeleton from '@/components/skeleton/BreadcrumbsSkeleton';
import styles from './SymptomIndex.module.css';
import groupStyles from '@/components/catalog/SymptomGroupGrid/SymptomGroupGrid.module.css';

/**
 * Symptom index — loading state.
 *
 * Nineteen group tiles over the search box, in the real grid's own columns
 * (2/3/4/5 as the viewport widens).
 *
 * The search form is drawn rather than rendered. The real one is a plain GET
 * form that needs neither JavaScript nor data, so it could have been included
 * working — but it is about to be replaced by its twin, and anything typed
 * into it in the meantime would be thrown away by the swap. A field that
 * silently loses what you put in it is worse than a field that is obviously
 * not ready.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="症状の一覧を読み込んでいます">
      <div className="container">
        <BreadcrumbsSkeleton depth={1} />

        <div className="section">
          <SectionHeader
            title="症状から探す"
            subtitle="気になる症状を選ぶと、関連する商品をご覧いただけます。"
            as="h1"
          />

          <div className={styles.search}>
            {/* The real input's own class, border included — a bordered box
                with a grey fill reads as a field that is not ready yet,
                where a bare grey bar would just be another block. */}
            <Skeleton as="div" className={styles.input} height="var(--control-h-md)" />
            <Skeleton height="var(--control-h-md)" width="5.5rem" radius="var(--radius-md)" />
          </div>

          <ul className={groupStyles.grid} role="list">
            {Array.from({ length: 19 }, (_, i) => (
              <li key={i}>
                <div className={groupStyles.card}>
                  <Skeleton as="div" className={groupStyles.iconFrame} radius="var(--radius-lg)" />
                  <Skeleton height="0.875rem" width="72%" />
                  <Skeleton height="0.625rem" width="38%" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SkeletonScreen>
  );
}
