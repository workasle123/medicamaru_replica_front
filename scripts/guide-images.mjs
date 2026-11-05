/**
 * Build the お薬ガイド figures from the raw captures.
 *
 * The captures are taken at deviceScaleFactor 2 (see the capture script kept
 * with them), so a 2,720px file is a 1,360 CSS-px screenshot. The article
 * column is ~700px, so capping the long edge at 1,400 still leaves a 2x
 * image inside the measure while cutting the files to a tenth of the PNGs.
 *
 * WebP, not the PNG: these are screenshots of flat UI, where WebP holds text
 * edges at a fraction of the size. One file per figure, no AVIF — next/image
 * negotiates the delivered format anyway, and a second source set would
 * double what the repo carries for a page nobody is going to pinch-zoom.
 *
 *   node scripts/guide-images.mjs <raw-dir>
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const MAX_WIDTH = 1400;
const QUALITY = 82;

/* Capture name -> published name. Keeping these explicit means renaming a
   capture cannot silently change a path the page references.
   03-product-toc is captured but not published: the contents rail is 664x1380
   and would run 1,455px tall in a 700px article column. */
const FIGURES = {
  '01-search': 'search',
  '02-categories': 'categories',
  '04-product-info': 'product-info',
  '05-product-precautions': 'product-precautions',
  '06-cart': 'cart',
  '07-checkout-form': 'checkout-form',
  '08-checkout-summary': 'checkout-summary',
};

const rawDir = process.argv[2];
if (!rawDir) {
  console.error('usage: node scripts/guide-images.mjs <raw-dir>');
  process.exit(1);
}

const outDir = path.join(process.cwd(), 'public', 'guide');
await fs.mkdir(outDir, { recursive: true });

const manifest = [];

for (const [from, to] of Object.entries(FIGURES)) {
  const src = path.join(rawDir, `${from}.png`);
  const dest = path.join(outDir, `${to}.webp`);

  const image = sharp(src);
  const meta = await image.metadata();
  const width = Math.min(meta.width, MAX_WIDTH);

  await image
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(dest);

  const out = await sharp(dest).metadata();
  const { size } = await fs.stat(dest);
  const before = (await fs.stat(src)).size;

  manifest.push({ file: `/guide/${to}.webp`, width: out.width, height: out.height, kb: Math.round(size / 1024) });
  console.log(
    `${to.padEnd(20)} ${String(out.width).padStart(4)}x${String(out.height).padEnd(4)}  ` +
      `${String(Math.round(size / 1024)).padStart(4)} KB  (png was ${Math.round(before / 1024)} KB)`
  );
}

console.log(`\ntotal ${manifest.reduce((n, m) => n + m.kb, 0)} KB\n`);
console.log(JSON.stringify(manifest, null, 2));
