/**
 * JsonLd — the one place structured data is written into the page.
 *
 * Takes a node, or a list of them, and emits one `<script type="application/
 * ld+json">` each. Nulls are dropped, so a caller can pass a builder that
 * returned nothing (an FAQ block for a product with no FAQs, say) without
 * guarding at the call site.
 *
 * A Server Component with no state: the JSON is in the initial HTML, which is
 * the only form a crawler is guaranteed to read.
 */
export default function JsonLd({ data }) {
  const nodes = (Array.isArray(data) ? data : [data]).filter(Boolean);

  if (!nodes.length) return null;

  return (
    <>
      {nodes.map((node, i) => (
        <script
          /* The index is the only key available: the list is rebuilt on every
             render and its entries have no identity of their own. */
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serialise(node) }}
        />
      ))}
    </>
  );
}

/**
 * JSON, with `<` escaped.
 *
 * Product names, descriptions and admin-authored FAQ answers all reach this
 * function, and any one of them containing the literal text `</script>` would
 * otherwise close the block early and put the rest of the JSON into the
 * document as markup. `<` is valid JSON and parses back to `<`, so the
 * structured data is unchanged — only the HTML boundary is made safe.
 */
function serialise(node) {
  return JSON.stringify(node).replace(/</g, '\\u003c');
}
