import styles from './Select.module.css';

/**
 * Select — labelled dropdown, matching Field's structure and accessibility
 * wiring so form rows stay visually and semantically consistent.
 *
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.name
 * @param {string} props.label
 * @param {{value: string, label: string}[]} props.options
 * @param {string|null} [props.placeholder]  `null` omits the empty first
 *   option entirely, for a select that always has a value — a country code
 *   has no meaningful blank state, and offering 「選択してください」 there invites
 *   someone to choose it.
 * @param {boolean} [props.required]
 * @param {string} [props.error]
 * @param {string} [props.defaultValue]
 */
export default function Select({
  id,
  name,
  label,
  options = [],
  placeholder = '選択してください',
  required = false,
  error,
  defaultValue,
  ...rest
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {/* Matches Field: an asterisk, with 必須 kept for screen readers. */}
        {required ? (
          <span className={styles.required}>
            <span aria-hidden="true">*</span>
            <span className="visually-hidden">必須</span>
          </span>
        ) : (
          <span className={styles.optional}>任意</span>
        )}
      </div>

      <select
        className={`${styles.select} ${error ? styles.invalid : ''}`}
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className={styles.error} id={errorId}>
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
