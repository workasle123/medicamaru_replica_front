import Image from 'next/image';
import BannerCarousel from './BannerCarousel';
import ScrollRail from '@/components/ui/ScrollRail/ScrollRail';
import { Frame, Copy } from './BannerParts';
import styles from './BannerShowcase.module.css';

/**
 * BannerShowcase — the admin-managed banner block.
 *
 * Layout: a full-width carousel with the static banners (`/home/left` and
 * `/home/right`) as a row of tiles beneath it. The `left`/`right` split is
 * the backend's own placement vocabulary and nothing here flanks the
 * carousel, so the two are merged into one row and ordered by the Display
 * Order the admin panel sets — see drawTiles.
 *
 * The homepage renders this twice with disjoint props — the carousel above
 * the hero, the tiles below it — which is why every prop defaults to empty
 * and each block is omitted when it has nothing to show.
 *
 * A Server Component: only the carousel needs client JavaScript, and that is
 * isolated in BannerCarousel.
 *
 * @param {Object} props
 * @param {import('@/lib/types').Banner[]} [props.carousel]
 * @param {import('@/lib/types').Banner[]} [props.left]
 * @param {import('@/lib/types').Banner[]} [props.right]
 */

/* The tile grid is 3-up on desktop and 2-up on mobile, so six fills both
   without an orphan stretched across a row on its own. */
const MAX_TILES = 6;

export default function BannerShowcase({ carousel = [], left = [], right = [] }) {
  const tiles = drawTiles(left, right, MAX_TILES);
  if (!carousel.length && !tiles.length) return null;

  return (
    <div className={styles.row}>
      {carousel.length > 0 && <BannerCarousel banners={carousel} />}

      {tiles.length > 0 && (
        /* One row, three across, arrows for the next three — rather than the
           two stacked rows this used to be. */
        /* One per view below 640px. Two across put each tile at 173x87 on a
             390px phone, and these are composed graphics carrying a Japanese
             headline and a call to action — at that width neither could be
             read. One across gives 358x179. */
        /* Advances on its own below 768px, so the tiles that are off-screen
             are still seen without anyone having to think to swipe; on desktop
             all three fit and the arrows are enough. */
        <ScrollRail
          perView={3}
          perViewTablet={3}
          perViewMobile={1}
          autoPlayBelow={768}
          /* Phones see one banner at a time and the rail advances on its own,
             so without these there is nothing to say how many there are or
             which one is showing — the row simply changes under you. The
             arrows sit over the artwork at that width and there is no hover
             to reveal them, so the dots are the only usable control. */
          dots
          label="ご案内バナー"
        >
          {tiles.map((banner) => (
            <li key={banner.id}>
              <Square banner={banner} />
            </li>
          ))}
        </ScrollRail>
      )}
    </div>
  );
}

/**
 * Pick the tiles to show, in the admin's own display_order across BOTH
 * placements.
 *
 * This used to alternate left/right, which was wrong once the banners were
 * numbered as one sequence. Display Order is authored as the reading order a
 * visitor should get — left 1, right 3, left 2, right 6, left 5 came out of
 * the round-robin as 1, 3, 2, 6, 5, and the numbers in the admin panel bore
 * no relation to the row on the page.
 *
 * Round-robin existed so that `right` was not dropped when `left` held six
 * banners and `right` held one. A merged sort cannot do that unfairly: the
 * tiles beyond the limit are the ones the admin numbered last, which is the
 * answer they asked for.
 *
 * display_order is unique per placement but NOT across them, so a left 1 and
 * a right 1 can collide. Placement then id breaks the tie, which keeps the
 * row stable between renders rather than leaving it to sort order.
 */
const PLACEMENT_TIEBREAK = { left: 0, right: 1 };

function drawTiles(left, right, limit) {
  return [...left, ...right]
    .sort(
      (a, b) =>
        a.position - b.position ||
        (PLACEMENT_TIEBREAK[a.placement] ?? 9) - (PLACEMENT_TIEBREAK[b.placement] ?? 9) ||
        a.id - b.id,
    )
    .slice(0, limit);
}

/**
 * One static banner tile in the row below the carousel.
 *
 * Takes the SECOND upload (「Mobile Image」 / thumbnail_path), not the first.
 * The same banner row feeds two slots that want different shapes: this tile is
 * a fixed 2:1 box that crops, and the campaign card wants a wide rectangle.
 * One file cannot be both, and the admin has exactly two uploads — so the
 * first carries the wide artwork the campaign page reads, and the second the
 * 2:1 artwork this tile reads.
 *
 * That way round rather than the reverse because the campaign page already
 * reads the first upload, and the carousel-placement campaigns already hold
 * wide artwork there (1330x300, 1880x424). Swapping them would have broken
 * every one of those cards.
 *
 * Falls back to the first upload, so a banner with only one file still shows
 * something rather than nothing.
 */
function Square({ banner }) {
  const art = banner.imageMobile ?? banner.image;

  return (
    <Frame banner={banner} className={styles.square}>
      <div className={styles.squareMedia}>
        {art && (
          <Image
            src={art.url}
            alt=""
            /* The published spec for this slot, not a measurement — the
               endpoint sends paths only. The box pins its own 2:1 ratio, so
               these do not drive layout. */
            width={1600}
            height={800}
            className={styles.image}
            /* Measured, per breakpoint: one tile across below 640px
               (358/390 = 92vw), three above it (224/768 = 29vw, 555/1760 =
               32vw). The old 50vw dated from two-up on phones and now
               under-states the tile by half, which buys a 640px file for a
               358px slot. */
            sizes="(max-width: 639px) 92vw, (max-width: 1023px) 30vw, min(33vw, 580px)"
          />
        )}
      </div>

      <Copy banner={banner} />
    </Frame>
  );
}
