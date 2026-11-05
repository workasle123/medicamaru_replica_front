import Skeleton from '@/components/ui/Skeleton/Skeleton';

/**
 * A side column of ContentPage, before its panels.
 *
 * These columns carry the category menu, the member box, a best-seller list
 * and the newsletter sign-up — different panels on different pages, all of
 * them bordered cards in one stack. Reserving the stack is what keeps the
 * reading column in the middle: ContentPage is a three-column grid from
 * 768px, and a fallback that passed no side columns at all would render the
 * article full width and then shove it sideways when they arrive.
 *
 * @param {Object} props
 * @param {number[]} [props.panels=[13, 9]] A height in rem per panel.
 */
export default function SidePanelSkeleton({ panels = [13, 9] }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--sp-4)' }}>
      {panels.map((height, i) => (
        <Skeleton key={i} as="div" height={`${height}rem`} radius="var(--radius-lg)" />
      ))}
    </div>
  );
}
