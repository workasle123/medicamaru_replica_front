import styles from './RequiredNote.module.css';

/**
 * RequiredNote — the key for the asterisk that marks required fields.
 *
 * Field and Select mark required inputs with a bare `*`. That is a convention
 * someone either knows or does not, and it carries no meaning on its own, so any
 * form using it needs to say what it means once, above the first field it
 * applies to.
 *
 * Worth placing on any form mixing required and optional inputs. A form where
 * every field is required — login, say — has nothing to disambiguate and reads
 * better without it.
 */
export default function RequiredNote() {
  return (
    <p className={styles.note}>
      {/* aria-hidden because the sentence is meaningless read aloud: screen
          readers already announce each required field by name, from the hidden
          必須 text in the label. */}
      <span className={styles.mark} aria-hidden="true">
        *
      </span>
      は必須項目です。
    </p>
  );
}
