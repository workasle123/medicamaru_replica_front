import styles from './SearchBar.module.css';

/**
 * SearchBar — global catalogue search.
 *
 * A plain GET form, so it works with JavaScript disabled and is a Server
 * Component. Typeahead suggestions will be layered on in Phase 7 as a small
 * Client Component wrapper; the no-JS path must keep working underneath.
 *
 * The placeholder mirrors kusuriexpress's strongest idea — inviting search by
 * *symptom* as well as product name, since shoppers arrive knowing how they
 * feel, not what the drug is called. It is phrased as an invitation, unlike
 * net-kusuri's「商品名を正しく入力してください」, which scolds before you type.
 *
 * 「商品名・症状で検索」 is "search by product name or symptoms" — the 「・」 is the
 * Japanese list separator doing the work of "or". The parenthetical example that
 * used to follow it 「（例：花粉症）」 is gone: it made the line long enough to
 * truncate in the mobile field, which cut off the half naming symptoms and left
 * the placeholder saying only 「商品名・症状で検...」.
 */
export default function SearchBar({ defaultValue = '', id = 'site-search' }) {
  return (
    <form className={styles.form} action="/search" method="get" role="search">
      <label htmlFor={id} className="visually-hidden">
        商品名・症状から検索
      </label>

      <input
        id={id}
        className={styles.input}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="商品名・症状で検索"
        autoComplete="off"
      />

      <button type="submit" className={styles.submit} aria-label="検索する">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  );
}
