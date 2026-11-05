import Skeleton, { SkeletonText } from '@/components/ui/Skeleton/Skeleton';

/**
 * A document body, before the document.
 *
 * Heading, a few paragraphs, repeated. The shape of every informational page
 * on the site — お知らせ, キャンペーン, ご利用ガイド and the legal pages — which
 * all render through ContentPage with prose inside.
 *
 * @param {Object} props
 * @param {number} [props.sections=3]
 */
export default function ArticleSkeleton({ sections = 3 }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--sp-8)' }}>
      {Array.from({ length: sections }, (_, i) => (
        <div key={i}>
          <Skeleton as="div" height="1.25rem" width="min(20rem, 65%)" />
          <div style={{ marginTop: 'var(--sp-4)' }}>
            <SkeletonText lines={i === sections - 1 ? 3 : 5} />
          </div>
        </div>
      ))}
    </div>
  );
}
