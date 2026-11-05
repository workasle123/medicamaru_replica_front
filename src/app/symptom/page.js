import Breadcrumbs from '@/components/layout/Breadcrumbs/Breadcrumbs';
import SymptomChips from '@/components/catalog/SymptomChips/SymptomChips';
import SymptomGroupGrid from '@/components/catalog/SymptomGroupGrid/SymptomGroupGrid';
import SectionHeader from '@/components/ui/SectionHeader/SectionHeader';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import { listSymptoms, listSymptomGroups } from '@/services/categories.service';
import { buildMetadata } from '@/lib/seo';
import { formatNumber } from '@/lib/format';
import styles from './SymptomIndex.module.css';

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: '症状から探す',
  description:
    '気になる症状から商品をお探しいただけます。商品名がわからない場合も、症状を選ぶだけで関連商品が見つかります。',
  path: '/symptom',
});

/**
 * Symptom index.
 *
 * A grid of browse groups — 薄毛・AGA, 肌トラブル・スキンケア and 17 others — rather
 * than the ~300 raw indication strings this page used to list. Those are
 * supplier text, more than half carrying a single product, and as one flat
 * wall of chips they were impossible to scan.
 *
 * **Falls back to the flat list when no groups are configured.** That is not
 * defensive padding: the groups are assigned as content in the admin panel,
 * so this page ships before a single assignment exists and switches over by
 * itself as they are made. It is also what a backend blip degrades to.
 *
 * `?q=` still searches the symptoms themselves, because that is what someone
 * types — 「ニキビ」, not the name of the group it lives in. Results are bucketed
 * under their group so a match arrives with the context of where it sits.
 */
export default async function SymptomIndexPage({ searchParams }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp?.q) ? sp.q[0] : sp?.q;
  const q = (raw ?? '').trim();

  const [groups, symptoms] = await Promise.all([listSymptomGroups(), listSymptoms()]);

  const needle = q.toLowerCase();
  const matches = q
    ? symptoms.filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          (s.label ?? '').toLowerCase().includes(needle) ||
          (s.nameEnglish ?? '').toLowerCase().includes(needle)
      )
    : [];

  /* Search results, bucketed by group and in the group's own display order.
     A symptom with no group still appears — under 「その他」 — because it is
     reachable by its flat URL even though it is not on the grid. */
  const buckets = q
    ? [
        ...groups
          .map((group) => ({
            group,
            items: matches.filter((s) => s.groupId === group.id),
          }))
          .filter((b) => b.items.length),
        ...(() => {
          const known = new Set(groups.map((g) => g.id));
          const rest = matches.filter((s) => !known.has(s.groupId));
          return rest.length ? [{ group: null, items: rest }] : [];
        })(),
      ]
    : [];

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: '症状から探す' }]} />

      <div className="section">
        <SectionHeader
          title={q ? `「${q}」に一致する症状` : '症状から探す'}
          subtitle={
            q
              ? `${formatNumber(matches.length)}件見つかりました。`
              : '気になる症状を選ぶと、関連する商品をご覧いただけます。'
          }
          as="h1"
        />

        {/* Kept on the results view too, so a search can be refined without
            going back. */}
        <form action="/symptom" method="get" className={styles.search} role="search">
          <label htmlFor="symptom-index-search" className="visually-hidden">
            症状を検索
          </label>
          <input
            id="symptom-index-search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="症状を検索（例：ニキビ）"
            className={styles.input}
          />
          <button type="submit" className={styles.button}>検索</button>
        </form>

        {q ? (
          buckets.length > 0 ? (
            buckets.map(({ group, items }) => (
              <section className={styles.resultGroup} key={group?.slug ?? 'other'}>
                <h2 className={styles.resultHeading}>{group?.name ?? 'その他'}</h2>
                <SymptomChips
                  symptoms={items}
                  /* The canonical nested path when the group is known, so a
                     result opens directly instead of via a redirect. */
                  basePath={group ? `/symptom/${group.slug}` : '/symptom'}
                />
              </section>
            ))
          ) : (
            <EmptyState
              title="一致する症状が見つかりませんでした"
              body="別のことばでお試しください。商品名での検索もご利用いただけます。"
              actionLabel="症状をすべて見る"
              actionHref="/symptom"
            />
          )
        ) : groups.length > 0 ? (
          <SymptomGroupGrid groups={groups} />
        ) : (
          /* No groups assigned yet — the flat list this page used to be. */
          <SymptomChips symptoms={symptoms} />
        )}
      </div>
    </div>
  );
}
