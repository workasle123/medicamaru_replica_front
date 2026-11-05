import styles from './ProductPage.module.css';
import Skeleton, { SkeletonScreen, SkeletonText } from '@/components/ui/Skeleton/Skeleton';
import BreadcrumbsSkeleton from '@/components/skeleton/BreadcrumbsSkeleton';

/**
 * Product detail — loading state.
 *
 * Built on the page's OWN grid, `.page`, so the fallback is laid out by the
 * same three-column map the product is: gallery and 目次 down the left, the
 * title, specs and description in the middle, the pack panel and the ranking
 * in the right-hand rail from 1280px. Below 1280 `.railRight` is
 * `display: contents` and the packs fall back under the title exactly as they
 * do in the real page — that behaviour comes free with the class.
 *
 * This route is ISR (`revalidate = 600`), so most arrivals are served from
 * the cache and never see this. It earns its place on the misses: a cold
 * product is a Laravel render plus image metadata, and a product page reached
 * from a rail is the single most common navigation on the site.
 *
 * Only the first screen is drawn in any detail. The description and reviews
 * are thousands of pixels down, and a skeleton of writing nobody has scrolled
 * to is bytes spent on a guess.
 */
export default function Loading() {
  return (
    <SkeletonScreen label="商品情報を読み込んでいます">
      <div className="container">
        <BreadcrumbsSkeleton depth={2} />

        <div className={styles.page}>
          <div className={styles.galleryColumn}>
            {/* The gallery's main image is square, like the card's. */}
            <Skeleton as="div" style={{ aspectRatio: '1' }} radius="var(--radius-lg)" />

            <div
              style={{
                display: 'flex',
                gap: 'var(--sp-2)',
                marginTop: 'var(--sp-3)',
              }}
            >
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton
                  key={i}
                  height="64px"
                  width="64px"
                  radius="var(--radius-md)"
                />
              ))}
            </div>
          </div>

          <div className={styles.head}>
            <Skeleton height="0.875rem" width="7rem" />
            <h1 className={styles.title}>
              <Skeleton as="div" height="1.75rem" />
              <Skeleton
                as="div"
                height="1.75rem"
                width="55%"
                style={{ marginTop: 'var(--sp-2)' }}
              />
            </h1>

            <div className={styles.headlinePrice}>
              <Skeleton height="2rem" width="9rem" />
              <Skeleton height="1rem" width="5rem" />
            </div>

            <div className={styles.ratingRow}>
              <Skeleton height="1rem" width="7rem" />
              <Skeleton height="1rem" width="4rem" />
              <Skeleton height="1.5rem" width="5rem" radius="var(--radius-pill)" />
            </div>
          </div>

          <div className={styles.railRight}>
            {/* 数量別価格 — the tallest thing on the page, and the one a
                visitor is here to read. A short placeholder would let the
                page settle and then grow by several hundred pixels, so this
                reserves a realistic panel rather than a token one. */}
            <div className={styles.purchase}>
              <Skeleton as="div" height="26rem" radius="var(--radius-lg)" />
            </div>
          </div>

          <div className={styles.details}>
            <Skeleton as="div" height="5rem" radius="var(--radius-md)" />

            <div className={styles.specs}>
              <Skeleton as="div" height="1.25rem" width="10rem" />
              <div
                style={{
                  display: 'grid',
                  gap: 'var(--sp-3)',
                  marginTop: 'var(--sp-4)',
                }}
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} as="div" height="0.875rem" />
                ))}
              </div>
            </div>
          </div>

          <aside className={styles.tocColumn}>
            <Skeleton as="div" height="18rem" radius="var(--radius-lg)" />
          </aside>

          <div className={styles.bodyMain}>
            <Skeleton as="div" height="1.5rem" width="min(18rem, 60%)" />
            <div style={{ marginTop: 'var(--sp-5)' }}>
              <SkeletonText lines={6} />
            </div>
            <div style={{ marginTop: 'var(--sp-8)' }}>
              <SkeletonText lines={4} />
            </div>
          </div>
        </div>
      </div>
    </SkeletonScreen>
  );
}
