/**
 * Medicamaru — mock catalogue fixtures.
 *
 * Shapes and field names mirror the real medicine.shop data model captured in
 * the Phase 0 audit (tiered pack variants, per-variant stock and points,
 * purchase limits, spec rows, FAQs). Product NAMES are factual product
 * identifiers; no marketing copy was copied from any competitor.
 *
 * Products are declared as compact specs and expanded by `makeProduct`, so
 * adding a product is a few lines rather than sixty. Every subcategory has at
 * least two products, which is what makes the subcategory navigation and
 * filtering genuinely testable.
 *
 * This file exists ONLY until the backend replica lands. Nothing outside
 * services/adapters/mock/ may import it.
 */

const IMG = (seed) =>
  `https://placehold.co/600x600/f7f0ff/6a34ad/webp?text=${encodeURIComponent(seed)}`;

/**
 * Category tree. `productCount` is derived from the real product list at the
 * bottom of this file, so the numbers in the sidebar can never drift from
 * what a category actually contains.
 */
const CATEGORY_TREE = [
  {
    id: 1, slug: 'ed', name: 'ED治療薬',
    description: '勃起不全（ED）の治療に用いられる医薬品とジェネリックを取り扱っています。',
    children: [
      { id: 11, slug: 'ed-tablets', name: 'ED治療薬（錠剤）' },
      {
        id: 12, slug: 'ed-supplements', name: 'EDサプリメント',
        /* Worked example of the full editorial shape a category page can
           carry — intro, supervision byline, long-form sections with a
           comparison table, and an FAQ. The remaining categories carry the
           short description only until real copy is imported. */
        description:
          '成人男性の活力や自信に関するお悩みは、年齢・ストレス・疲労・睡眠不足・生活習慣など、さまざまな要因が重なって起こります。こうした変化は心身の状態と深く結びついているため、日々のコンディションを整える方法を探す方が多くいらっしゃいます。',
        metaTitle: 'EDサプリメントの通販｜男性の活力と健康維持をサポート',
        metaDescription:
          '男性の活力・スタミナ・自信の維持をサポートするEDサプリメントを取り扱っています。成分や選び方もあわせてご紹介します。',
        supervisedBy: '薬剤師 メディカ丸医療監修チーム',
        updatedAt: '2026-08-13',
        content: [
          {
            id: 'ingredients',
            heading: 'EDサプリメントによく使われる成分',
            html: `<p>このカテゴリーの商品には、男性の健康維持を目的として伝統的に用いられてきたハーブ成分が配合されている場合があります。</p>
<table><thead><tr><th>主な成分</th><th>一般的な用途</th></tr></thead><tbody>
<tr><td>アシュワガンダ</td><td>伝統的に活力と健康維持のサポートに使用</td></tr>
<tr><td>ゴクシュラ</td><td>伝統的に男性の健康維持に使用</td></tr>
<tr><td>カピカチュ</td><td>伝統的に活力の維持に使用</td></tr>
<tr><td>シラジット</td><td>伝統的に滋養のサポートに使用</td></tr>
<tr><td>亜鉛</td><td>栄養補給を目的として使用</td></tr>
</tbody></table>
<p>成分の働きには個人差があります。ご使用の前に必ず医師または薬剤師にご相談ください。</p>`,
          },
          {
            id: 'how-to-choose',
            heading: 'EDサプリメントの選び方',
            html: `<h3>成分から選ぶ</h3><p>配合されている成分と、その一般的な用途を確認したうえでお選びください。</p>
<h3>品質を確認する</h3><p>製造元、正規品であるかどうか、使用期限をご確認ください。当サイトの取扱商品はすべて正規品です。</p>
<h3>目的に合わせて選ぶ</h3>
<table><thead><tr><th>目的</th><th>一般的な成分</th></tr></thead><tbody>
<tr><td>日々の健康維持</td><td>アシュワガンダ、アムラ</td></tr>
<tr><td>活力のサポート</td><td>シラジット、サフェドムスリ</td></tr>
<tr><td>栄養の補給</td><td>亜鉛</td></tr>
</tbody></table>`,
          },
          {
            id: 'ordering',
            heading: 'オンラインでのご注文について',
            html: `<p>当サイトは個人輸入制度に基づき、ご本人が使用する目的での購入をサポートしています。</p>
<table><thead><tr><th>メリット</th><th>ご注意いただく点</th></tr></thead><tbody>
<tr><td>ご自宅から注文できます</td><td>お届けまで通常10〜14日かかります</td></tr>
<tr><td>中身のわからない梱包でお届けします</td><td>商品によって在庫状況が異なります</td></tr>
<tr><td>商品どうしの比較が簡単です</td><td>ご本人の使用に限られます</td></tr>
</tbody></table>`,
          },
        ],
        faqs: [
          {
            question: 'EDサプリメントは医薬品ですか？',
            answer: 'このカテゴリーの多くはサプリメント（健康食品）です。医薬品とは異なり、即効性を目的としたものではありません。',
          },
          {
            question: 'どのくらいの期間続ければよいですか？',
            answer: '製品により異なりますが、一定期間の継続使用を前提とした製品が多くあります。詳しくは各商品ページをご確認ください。',
          },
          {
            question: '治療薬と併用できますか？',
            answer: '併用をご検討の場合は、必ず事前に医師または薬剤師にご相談ください。',
          },
        ],
      },
    ],
  },
  {
    id: 2, slug: 'aga', name: 'AGA・育毛',
    description: '男性型脱毛症（AGA）の治療薬、育毛サプリメントを取り扱っています。',
    children: [
      { id: 21, slug: 'aga-tablets', name: 'AGA治療薬' },
      { id: 22, slug: 'hair-supplements', name: '育毛サプリメント' },
    ],
  },
  {
    id: 3, slug: 'diet', name: 'ダイエット',
    description: '体重管理をサポートする医薬品・サプリメントです。',
    children: [
      { id: 31, slug: 'diet-tablets', name: 'ダイエット医薬品' },
      { id: 32, slug: 'diet-supplements', name: 'ダイエットサプリ' },
    ],
  },
  {
    id: 4, slug: 'skincare', name: '美容・スキンケア',
    description: 'ニキビ・シミ・肌荒れなどのスキンケア商品です。',
    children: [
      { id: 41, slug: 'acne', name: 'ニキビ治療' },
      { id: 42, slug: 'whitening', name: '美白・シミ' },
    ],
  },
  {
    id: 5, slug: 'allergy', name: 'アレルギー・花粉症',
    description: '花粉症、アレルギー性鼻炎、じんましんなどに用いられる医薬品です。',
    children: [
      { id: 51, slug: 'hay-fever', name: '花粉症' },
      { id: 52, slug: 'rhinitis', name: 'アレルギー性鼻炎' },
    ],
  },
  {
    id: 6, slug: 'mental', name: 'メンタルケア・睡眠',
    description: '睡眠の質やこころの健康をサポートする医薬品です。',
    children: [
      { id: 61, slug: 'sleep', name: '睡眠サポート' },
      { id: 62, slug: 'stress', name: 'ストレスケア' },
    ],
  },
  {
    id: 7, slug: 'womens-health', name: '女性の健康',
    description: 'ピル、生理・更年期のお悩みに関する医薬品です。',
    children: [
      { id: 71, slug: 'pill', name: 'ピル' },
      { id: 72, slug: 'menopause', name: '更年期ケア' },
    ],
  },
  {
    id: 8, slug: 'supplements', name: 'サプリメント',
    description: '日々の健康維持をサポートするサプリメントです。',
    children: [
      { id: 81, slug: 'vitamins', name: 'ビタミン' },
      { id: 82, slug: 'herbal', name: 'ハーブ・漢方' },
    ],
  },
];

/** Flat lookup: subcategory slug → {parent, child}. */
const SUBCATEGORY_INDEX = new Map();
for (const parent of CATEGORY_TREE) {
  for (const child of parent.children) {
    SUBCATEGORY_INDEX.set(child.slug, { parent, child });
  }
}

/**
 * Symptom axis — the second, independent browse dimension. Shoppers arrive
 * knowing a symptom, not a category.
 */
export const symptoms = [
  { slug: 'ed', name: '勃起不全（ED）', categorySlugs: ['ed'] },
  { slug: 'hair-loss', name: '抜け毛・薄毛', categorySlugs: ['aga'] },
  { slug: 'hay-fever', name: '花粉症・鼻水', categorySlugs: ['allergy'] },
  { slug: 'acne', name: 'ニキビ・肌荒れ', categorySlugs: ['skincare'] },
  { slug: 'insomnia', name: '寝つきが悪い', categorySlugs: ['mental'] },
  { slug: 'weight', name: '体重が気になる', categorySlugs: ['diet'] },
  { slug: 'fatigue', name: '疲れ・だるさ', categorySlugs: ['supplements'] },
  { slug: 'period', name: '生理のお悩み', categorySlugs: ['womens-health'] },
];

/**
 * Build the tiered pack variants, applying the bulk-discount curve seen on
 * the real platform: bigger packs, deeper discount, lower unit price.
 */
function makeVariants(productId, baseId, unitLabel, packUnit, tiers) {
  return tiers.map((t, i) => {
    const listPrice = t.list ?? t.price;
    const discountPct =
      listPrice > t.price ? Math.round(((listPrice - t.price) / listPrice) * 100) : 0;
    return {
      id: baseId + i,
      productId,
      pack: t.pack,
      unitLabel,
      packLabel: `${t.count} ${packUnit} / ${t.pack} ${unitLabel}`,
      price: t.price,
      listPrice,
      discountPct,
      unitPrice: Math.round(t.price / t.pack),
      points: Math.round(t.price * 0.03),
      purchaseLimit: 300,
      inStock: t.inStock !== false,
    };
  });
}

/**
 * Expand a compact spec into a full Product.
 *
 * Category and subcategory are resolved from a single `sub` slug, so a
 * product can never be filed under a subcategory that belongs to a different
 * parent — a class of data bug that is easy to introduce by hand.
 */
function makeProduct(spec) {
  const entry = SUBCATEGORY_INDEX.get(spec.sub);
  if (!entry) throw new Error(`Unknown subcategory: ${spec.sub}`);
  const { parent, child } = entry;

  const ratingCount = spec.reviews ?? 0;
  const average = spec.rating ?? 0;

  return {
    id: spec.id,
    sku: `PROD-${spec.id}`,
    slug: spec.slug,
    name: spec.name,
    shortDescription: spec.desc,
    brand: spec.brand,
    manufacturer: spec.maker ?? spec.brand,
    images: [
      { url: IMG(spec.name), alt: `${spec.name}のパッケージ画像`, width: 600, height: 600 },
    ],
    variants: makeVariants(spec.id, spec.variantBase, spec.unit, spec.packUnit, spec.tiers),
    specs: [
      { label: '効果', value: spec.effect },
      { label: '有効成分', value: spec.ingredient },
      { label: '製薬会社', value: spec.maker ?? spec.brand },
      { label: '対象', value: spec.target ?? '成人' },
      { label: '配達日数目安', value: '通常10〜14日' },
      { label: '服用方法', value: spec.dosage, href: '#usage' },
      ...(spec.sideEffects
        ? [{ label: '副作用', value: spec.sideEffects, href: '#safety' }]
        : []),
    ],
    category: { slug: parent.slug, name: parent.name },
    subcategory: { slug: child.slug, name: child.name },
    tags: spec.tags ?? [],
    rating: {
      average,
      count: ratingCount,
      histogram: buildHistogram(ratingCount, average),
      recommendPct: ratingCount ? Math.round(average * 20) : 0,
    },
    faqs: spec.faqs ?? [
      {
        question: `${spec.name}はどのような商品ですか？`,
        answer: spec.desc,
      },
      {
        question: '使用前に相談は必要ですか？',
        answer: 'ご使用の前には、必ず医師または薬剤師にご相談ください。',
      },
    ],
    shippingEstimate: '通常10〜14日で発送予定',
    updatedAt: spec.updatedAt,
    supervisedBy: 'メディカ丸医療監修チーム',
    content: [
      { id: 'about', heading: '', html: `<p>${spec.desc}</p>` },
      { id: 'usage', heading: '使用方法', html: `<p>${spec.dosage}を目安にご使用ください。用量は医師の指示に従って調整してください。</p>` },
      {
        id: 'safety',
        heading: '安全性と副作用',
        html: `<p>${spec.sideEffects ?? '重篤な副作用の報告は多くありませんが、体調に異変を感じた場合は使用を中止してください。'}異常を感じた場合は使用を中止し、医師にご相談ください。</p>`,
      },
    ],
    references: [],
    disclaimer:
      '本ページの情報は製品の概要を提供するものであり、医療上の助言・診断・治療に代わるものではありません。ご使用前に必ず医師にご相談ください。',
  };
}

/** Plausible star distribution for a given average, so bars are not flat. */
function buildHistogram(count, average) {
  if (!count) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const five = Math.round(count * Math.max(0, (average - 3) / 2) * 0.9);
  const four = Math.round((count - five) * 0.55);
  const three = Math.round((count - five - four) * 0.6);
  const two = Math.round((count - five - four - three) * 0.6);
  const one = Math.max(0, count - five - four - three - two);
  return { 5: five, 4: four, 3: three, 2: two, 1: one };
}

/**
 * Product specs. At least two per subcategory, so subcategory navigation,
 * filtering and counts are all exercisable.
 */
const SPECS = [
  // --- ED / 錠剤 -------------------------------------------------------
  {
    id: 101, slug: 'sildenafil-50mg', name: 'シルデナフィル 50mg', sub: 'ed-tablets',
    brand: 'CIPLA', desc: 'ED治療に用いられるシルデナフィル製剤のジェネリック医薬品です。',
    effect: '勃起不全（ED）の改善', ingredient: 'シルデナフィルクエン酸塩 50mg',
    target: '成人男性', dosage: '性行為の約1時間前に1錠', sideEffects: '頭痛、ほてり、鼻づまりなど',
    unit: '錠', packUnit: 'シート', variantBase: 40100, updatedAt: '2026-08-04',
    rating: 4.5, reviews: 118, tags: ['ED', '男性向け', '人気'],
    tiers: [
      { pack: 4, count: 1, price: 1200 },
      { pack: 12, count: 3, price: 3200, list: 3600 },
      { pack: 40, count: 10, price: 9200, list: 12000 },
    ],
  },
  {
    id: 102, slug: 'tadalafil-20mg', name: 'タダラフィル 20mg', sub: 'ed-tablets',
    brand: 'CIPLA', desc: '効果の持続時間が長いことで知られるタダラフィル製剤です。',
    effect: '勃起不全（ED）の改善', ingredient: 'タダラフィル 20mg',
    target: '成人男性', dosage: '性行為の約1時間前に1錠', sideEffects: '頭痛、消化不良、背部痛など',
    unit: '錠', packUnit: 'シート', variantBase: 40200, updatedAt: '2026-08-06',
    rating: 4.6, reviews: 164, tags: ['ED', '男性向け', '長時間'],
    tiers: [
      { pack: 4, count: 1, price: 1650 },
      { pack: 12, count: 3, price: 4400, list: 4950 },
      { pack: 40, count: 10, price: 13200, list: 16500 },
    ],
  },
  {
    id: 103, slug: 'vardenafil-20mg', name: 'バルデナフィル 20mg', sub: 'ed-tablets',
    brand: 'GENERIC', desc: '即効性が特徴とされるバルデナフィル製剤のジェネリック医薬品です。',
    effect: '勃起不全（ED）の改善', ingredient: 'バルデナフィル塩酸塩 20mg',
    target: '成人男性', dosage: '性行為の約30分前に1錠', sideEffects: '頭痛、ほてり、めまいなど',
    unit: '錠', packUnit: 'シート', variantBase: 40300, updatedAt: '2026-07-21',
    rating: 4.2, reviews: 73, tags: ['ED', '男性向け'],
    tiers: [
      { pack: 4, count: 1, price: 1780 },
      { pack: 12, count: 3, price: 4700, list: 5340 },
    ],
  },

  // --- ED / サプリメント ------------------------------------------------
  {
    id: 118, slug: 'speman', name: 'スペマン', sub: 'ed-supplements',
    brand: 'HIMALAYA', maker: 'Himalaya Wellness',
    desc: '天然ハーブを配合した男性向けサプリメント。日々の活力と健康維持をサポートします。',
    effect: '男性の活力・健康維持のサポート', ingredient: 'ムクナ・プルリエンス、ゴクシュラ ほか',
    target: '成人男性', dosage: '1日2回、1回1〜2錠', sideEffects: '軽度の胃部不快感などが現れる場合があります',
    unit: '錠', packUnit: 'ボトル', variantBase: 23288, updatedAt: '2026-07-28',
    rating: 4.3, reviews: 42, tags: ['ハーブ', '健康維持', '男性向け'],
    tiers: [
      { pack: 60, count: 1, price: 1400 },
      { pack: 120, count: 2, price: 2700, list: 2800 },
      { pack: 180, count: 3, price: 3700, list: 4200 },
      { pack: 300, count: 5, price: 5800, list: 7000 },
    ],
  },
  {
    id: 346, slug: 'tentex-royal', name: 'テンテックスロイヤル', sub: 'ed-supplements',
    brand: 'HIMALAYA', maker: 'Himalaya Wellness',
    desc: '男性の健康維持を目的としたアーユルヴェーダ由来のカプセルです。',
    effect: '男性の活力サポート', ingredient: 'ゴクシュラ、シラジット ほか',
    target: '成人男性', dosage: '1日1〜2カプセル',
    unit: 'カプセル', packUnit: 'ボトル', variantBase: 24100, updatedAt: '2026-07-14',
    rating: 4.1, reviews: 28, tags: ['ハーブ', '男性向け'],
    tiers: [
      { pack: 10, count: 1, price: 920 },
      { pack: 30, count: 3, price: 2480, list: 2760 },
      { pack: 60, count: 6, price: 4600, list: 5520 },
    ],
  },

  // --- AGA / 治療薬 -----------------------------------------------------
  {
    id: 423, slug: 'finpecia-1mg', name: 'フィンペシア 1mg', sub: 'aga-tablets',
    brand: 'CIPLA', maker: 'Cipla Ltd.',
    desc: 'AGA（男性型脱毛症）の治療に用いられるフィナステリド製剤です。',
    effect: '男性型脱毛症（AGA）の進行抑制', ingredient: 'フィナステリド 1mg',
    target: '成人男性', dosage: '1日1回1錠', sideEffects: '性欲減退、肝機能値の変動などが報告されています',
    unit: '錠', packUnit: 'シート', variantBase: 25200, updatedAt: '2026-08-02',
    rating: 4.6, reviews: 137, tags: ['AGA', '男性向け', '継続'],
    tiers: [
      { pack: 30, count: 1, price: 1980 },
      { pack: 90, count: 3, price: 5200, list: 5940 },
      { pack: 180, count: 6, price: 9600, list: 11880 },
    ],
  },
  {
    id: 424, slug: 'dutasteride-05mg', name: 'デュタステリド 0.5mg', sub: 'aga-tablets',
    brand: 'GENERIC', maker: 'Dr. Reddy\'s',
    desc: 'フィナステリドとは異なる作用をもつAGA治療薬のジェネリック医薬品です。',
    effect: '男性型脱毛症（AGA）の進行抑制', ingredient: 'デュタステリド 0.5mg',
    target: '成人男性', dosage: '1日1回1カプセル', sideEffects: '性欲減退、乳房の張りなど',
    unit: 'カプセル', packUnit: 'シート', variantBase: 25300, updatedAt: '2026-07-25',
    rating: 4.4, reviews: 96, tags: ['AGA', '男性向け'],
    tiers: [
      { pack: 30, count: 1, price: 2680 },
      { pack: 90, count: 3, price: 7200, list: 8040 },
    ],
  },

  // --- AGA / 育毛サプリ -------------------------------------------------
  {
    id: 431, slug: 'biotin-10000mcg', name: 'ビオチン 10000mcg', sub: 'hair-supplements',
    brand: 'NOW FOODS', maker: 'NOW Foods',
    desc: '髪や爪の健康維持をサポートするビオチンサプリメントです。',
    effect: '髪・爪・肌の健康維持のサポート', ingredient: 'ビオチン 10000mcg',
    dosage: '1日1錠',
    unit: '錠', packUnit: 'ボトル', variantBase: 25400, updatedAt: '2026-07-30',
    rating: 4.5, reviews: 112, tags: ['サプリメント', '健康維持', 'コスパ'],
    tiers: [
      { pack: 120, count: 1, price: 1180 },
      { pack: 360, count: 3, price: 3000, list: 3540 },
    ],
  },
  {
    id: 432, slug: 'saw-palmetto-320mg', name: 'ノコギリヤシ 320mg', sub: 'hair-supplements',
    brand: 'SWANSON', maker: 'Swanson Health',
    desc: '男性の健康維持に用いられるノコギリヤシ由来のサプリメントです。',
    effect: '男性の健康維持のサポート', ingredient: 'ノコギリヤシエキス 320mg',
    target: '成人男性', dosage: '1日1カプセル',
    unit: 'カプセル', packUnit: 'ボトル', variantBase: 25500, updatedAt: '2026-06-18',
    rating: 4.0, reviews: 58, tags: ['サプリメント', '男性向け', 'ハーブ'],
    tiers: [
      { pack: 60, count: 1, price: 1350 },
      { pack: 180, count: 3, price: 3500, list: 4050 },
    ],
  },

  // --- ダイエット / 医薬品 ----------------------------------------------
  {
    id: 802, slug: 'orlistat-120mg', name: 'オルリスタット 120mg', sub: 'diet-tablets',
    brand: 'GENERIC', maker: 'Cipla Ltd.',
    desc: '食事由来の脂肪の吸収を抑える働きが報告されている医薬品です。',
    effect: '食事由来の脂肪吸収の抑制', ingredient: 'オルリスタット 120mg',
    dosage: '食事のたびに1カプセル', sideEffects: '油性便、便意の切迫感など',
    unit: 'カプセル', packUnit: 'シート', variantBase: 29600, updatedAt: '2026-07-08',
    rating: 3.8, reviews: 52, tags: ['ダイエット', '医薬品'],
    tiers: [
      { pack: 21, count: 1, price: 2400 },
      { pack: 63, count: 3, price: 6400, list: 7200 },
      { pack: 126, count: 6, price: 11800, list: 14400 },
    ],
  },
  {
    id: 803, slug: 'metformin-500mg', name: 'メトホルミン 500mg', sub: 'diet-tablets',
    brand: 'GENERIC', maker: 'Sun Pharmaceutical',
    desc: '血糖値の管理に用いられるメトホルミン製剤のジェネリック医薬品です。',
    effect: '血糖値の管理', ingredient: 'メトホルミン塩酸塩 500mg',
    dosage: '医師の指示に従い1日1〜3回', sideEffects: '消化器系の不快感、下痢など',
    unit: '錠', packUnit: 'シート', variantBase: 29700, updatedAt: '2026-06-24',
    rating: 4.1, reviews: 67, tags: ['医薬品', '継続'],
    tiers: [
      { pack: 100, count: 1, price: 1850 },
      { pack: 300, count: 3, price: 4900, list: 5550 },
    ],
  },

  // --- ダイエット / サプリ ----------------------------------------------
  {
    id: 811, slug: 'garcinia-cambogia', name: 'ガルシニアカンボジア', sub: 'diet-supplements',
    brand: 'NOW FOODS', maker: 'NOW Foods',
    desc: '体重管理をサポートする植物由来のサプリメントです。',
    effect: '体重管理のサポート', ingredient: 'ガルシニアカンボジアエキス 1000mg',
    dosage: '食前に1〜2錠',
    unit: '錠', packUnit: 'ボトル', variantBase: 29800, updatedAt: '2026-07-02',
    rating: 3.7, reviews: 44, tags: ['ダイエット', 'サプリメント'],
    tiers: [
      { pack: 90, count: 1, price: 1420 },
      { pack: 270, count: 3, price: 3700, list: 4260 },
    ],
  },
  {
    id: 812, slug: 'l-carnitine-500mg', name: 'L-カルニチン 500mg', sub: 'diet-supplements',
    brand: 'SWANSON', maker: 'Swanson Health',
    desc: '日常的な運動習慣とあわせてお使いいただくサプリメントです。',
    effect: 'エネルギー代謝のサポート', ingredient: 'L-カルニチン酒石酸塩 500mg',
    dosage: '1日1〜2錠',
    unit: '錠', packUnit: 'ボトル', variantBase: 29900, updatedAt: '2026-05-29',
    rating: 4.0, reviews: 39, tags: ['ダイエット', 'サプリメント'],
    tiers: [
      { pack: 60, count: 1, price: 1680 },
      { pack: 180, count: 3, price: 4400, list: 5040 },
    ],
  },

  // --- スキンケア / ニキビ ----------------------------------------------
  {
    id: 604, slug: 'tretinoin-cream-005', name: 'トレチノインクリーム 0.05%', sub: 'acne',
    brand: 'GENERIC', maker: 'Johnson & Johnson',
    desc: 'ニキビや肌のターンオーバーのケアに用いられる外用クリームです。',
    effect: 'ニキビ・肌のターンオーバーのサポート', ingredient: 'トレチノイン 0.05%',
    dosage: '1日1回、就寝前に薄く塗布', sideEffects: '赤み、乾燥、皮むけなど',
    unit: 'g', packUnit: 'チューブ', variantBase: 27400, updatedAt: '2026-06-30',
    rating: 4.0, reviews: 61, tags: ['スキンケア', '外用'],
    tiers: [
      { pack: 20, count: 1, price: 1650 },
      { pack: 60, count: 3, price: 4400, list: 4950 },
    ],
  },
  {
    id: 605, slug: 'benzoyl-peroxide-gel', name: '過酸化ベンゾイルゲル 5%', sub: 'acne',
    brand: 'GENERIC', maker: 'Galderma',
    desc: 'ニキビの原因菌に働きかける外用ゲルです。',
    effect: 'ニキビのケア', ingredient: '過酸化ベンゾイル 5%',
    dosage: '1日1〜2回、患部に薄く塗布', sideEffects: '乾燥、刺激感など',
    unit: 'g', packUnit: 'チューブ', variantBase: 27500, updatedAt: '2026-07-16',
    rating: 4.2, reviews: 83, tags: ['スキンケア', '外用'],
    tiers: [
      { pack: 30, count: 1, price: 1280 },
      { pack: 90, count: 3, price: 3400, list: 3840 },
    ],
  },

  // --- スキンケア / 美白 ------------------------------------------------
  {
    id: 611, slug: 'hydroquinone-cream-4', name: 'ハイドロキノンクリーム 4%', sub: 'whitening',
    brand: 'GENERIC', maker: 'Cipla Ltd.',
    desc: '色素沈着が気になる部分のケアに用いられる外用クリームです。',
    effect: '色素沈着のケア', ingredient: 'ハイドロキノン 4%',
    dosage: '1日1回、就寝前にパッチテストのうえ使用', sideEffects: '刺激感、赤みなど',
    unit: 'g', packUnit: 'チューブ', variantBase: 27600, updatedAt: '2026-07-11',
    rating: 4.1, reviews: 71, tags: ['スキンケア', '外用', '美白'],
    tiers: [
      { pack: 30, count: 1, price: 1980 },
      { pack: 90, count: 3, price: 5200, list: 5940 },
    ],
  },
  {
    id: 612, slug: 'vitamin-c-serum-20', name: 'ビタミンC美容液 20%', sub: 'whitening',
    brand: 'GENERIC', maker: 'Ethicare',
    desc: '毎日のスキンケアに取り入れやすいビタミンC配合の美容液です。',
    effect: '肌の明るさの維持', ingredient: 'アスコルビン酸 20%',
    dosage: '1日1回、朝の洗顔後に使用',
    unit: 'ml', packUnit: 'ボトル', variantBase: 27700, updatedAt: '2026-08-01',
    rating: 4.4, reviews: 128, tags: ['スキンケア', '美白', '人気'],
    tiers: [
      { pack: 20, count: 1, price: 2280 },
      { pack: 60, count: 3, price: 6100, list: 6840 },
    ],
  },

  // --- アレルギー / 花粉症 ----------------------------------------------
  {
    id: 512, slug: 'allegra-generic-120mg', name: 'アレグラジェネリック 120mg', sub: 'hay-fever',
    brand: 'GENERIC', maker: 'Sun Pharmaceutical',
    desc: '花粉症やアレルギー性鼻炎の症状緩和に用いられるフェキソフェナジン製剤です。',
    effect: '花粉症・アレルギー性鼻炎の症状緩和', ingredient: 'フェキソフェナジン塩酸塩 120mg',
    dosage: '1日2回、1回1錠', sideEffects: '眠気、口の渇きなど',
    unit: '錠', packUnit: 'シート', variantBase: 26300, updatedAt: '2026-08-05',
    rating: 4.4, reviews: 89, tags: ['花粉症', '季節商品', '眠くなりにくい'],
    tiers: [
      { pack: 10, count: 1, price: 780 },
      { pack: 30, count: 3, price: 2100, list: 2340 },
      { pack: 100, count: 10, price: 6200, list: 7800 },
    ],
  },
  {
    id: 513, slug: 'cetirizine-10mg', name: 'セチリジン 10mg', sub: 'hay-fever',
    brand: 'GENERIC', maker: 'Dr. Reddy\'s',
    desc: 'くしゃみ・鼻水などのアレルギー症状に用いられる抗ヒスタミン薬です。',
    effect: 'アレルギー症状の緩和', ingredient: 'セチリジン塩酸塩 10mg',
    dosage: '1日1回1錠（就寝前）', sideEffects: '眠気、倦怠感など',
    unit: '錠', packUnit: 'シート', variantBase: 26400, updatedAt: '2026-07-27',
    rating: 4.3, reviews: 104, tags: ['花粉症', '季節商品'],
    tiers: [
      { pack: 10, count: 1, price: 620 },
      { pack: 30, count: 3, price: 1650, list: 1860 },
      { pack: 100, count: 10, price: 4900, list: 6200 },
    ],
  },

  // --- アレルギー / 鼻炎 ------------------------------------------------
  {
    id: 521, slug: 'montelukast-10mg', name: 'モンテルカスト 10mg', sub: 'rhinitis',
    brand: 'GENERIC', maker: 'Cipla Ltd.',
    desc: 'アレルギー性鼻炎や喘息の管理に用いられる医薬品です。',
    effect: 'アレルギー性鼻炎・喘息の管理', ingredient: 'モンテルカストナトリウム 10mg',
    dosage: '1日1回1錠（就寝前）', sideEffects: '頭痛、腹痛など',
    unit: '錠', packUnit: 'シート', variantBase: 26500, updatedAt: '2026-07-19',
    rating: 4.2, reviews: 66, tags: ['鼻炎', '継続'],
    tiers: [
      { pack: 30, count: 1, price: 2150 },
      { pack: 90, count: 3, price: 5700, list: 6450 },
    ],
  },
  {
    id: 522, slug: 'fluticasone-nasal-spray', name: 'フルチカゾン点鼻薬', sub: 'rhinitis',
    brand: 'GENERIC', maker: 'Cipla Ltd.',
    desc: '鼻の炎症をおさえる働きが報告されているステロイド点鼻薬です。',
    effect: '鼻炎症状の緩和', ingredient: 'フルチカゾンプロピオン酸エステル',
    dosage: '1日1回、各鼻腔に1〜2噴霧', sideEffects: '鼻の乾燥、鼻血など',
    unit: '本', packUnit: 'セット', variantBase: 26600, updatedAt: '2026-06-27',
    rating: 4.0, reviews: 48, tags: ['鼻炎', '外用'],
    tiers: [
      { pack: 1, count: 1, price: 1480 },
      { pack: 3, count: 3, price: 3900, list: 4440 },
    ],
  },

  // --- メンタル / 睡眠 --------------------------------------------------
  {
    id: 711, slug: 'melatonin-5mg', name: 'メラトニン 5mg', sub: 'sleep',
    brand: 'NATROL', maker: 'Natrol LLC',
    desc: '睡眠リズムの調整をサポートするサプリメントです。',
    effect: '睡眠リズムの調整サポート', ingredient: 'メラトニン 5mg',
    dosage: '就寝30分前に1錠',
    unit: '錠', packUnit: 'ボトル', variantBase: 28500, updatedAt: '2026-07-19',
    rating: 4.2, reviews: 74, tags: ['睡眠', 'サプリメント'],
    tiers: [
      { pack: 60, count: 1, price: 1250 },
      { pack: 180, count: 3, price: 3300, list: 3750 },
      { pack: 300, count: 5, price: 5100, list: 6250, inStock: false },
    ],
  },
  {
    id: 712, slug: 'valerian-root-500mg', name: 'バレリアンルート 500mg', sub: 'sleep',
    brand: 'SWANSON', maker: 'Swanson Health',
    desc: '休息の質をサポートするハーブ由来のサプリメントです。',
    effect: '休息のサポート', ingredient: 'バレリアンルートエキス 500mg',
    dosage: '就寝前に1〜2カプセル',
    unit: 'カプセル', packUnit: 'ボトル', variantBase: 28600, updatedAt: '2026-06-14',
    rating: 3.9, reviews: 37, tags: ['睡眠', 'ハーブ'],
    tiers: [
      { pack: 60, count: 1, price: 1120 },
      { pack: 180, count: 3, price: 2900, list: 3360 },
    ],
  },

  // --- メンタル / ストレス ----------------------------------------------
  {
    id: 721, slug: 'ashwagandha-600mg', name: 'アシュワガンダ 600mg', sub: 'stress',
    brand: 'HIMALAYA', maker: 'Himalaya Wellness',
    desc: 'アーユルヴェーダで広く用いられてきたハーブのサプリメントです。',
    effect: '心身のバランスのサポート', ingredient: 'アシュワガンダエキス 600mg',
    dosage: '1日1〜2錠',
    unit: '錠', packUnit: 'ボトル', variantBase: 28700, updatedAt: '2026-07-23',
    rating: 4.5, reviews: 156, tags: ['ハーブ', '健康維持', '人気'],
    tiers: [
      { pack: 60, count: 1, price: 1380 },
      { pack: 180, count: 3, price: 3600, list: 4140 },
      { pack: 300, count: 5, price: 5500, list: 6900 },
    ],
  },
  {
    id: 722, slug: 'l-theanine-200mg', name: 'L-テアニン 200mg', sub: 'stress',
    brand: 'NOW FOODS', maker: 'NOW Foods',
    desc: '緑茶に含まれるアミノ酸、L-テアニンを配合したサプリメントです。',
    effect: 'リラックスのサポート', ingredient: 'L-テアニン 200mg',
    dosage: '1日1カプセル',
    unit: 'カプセル', packUnit: 'ボトル', variantBase: 28800, updatedAt: '2026-05-31',
    rating: 4.3, reviews: 62, tags: ['サプリメント', '健康維持'],
    tiers: [
      { pack: 60, count: 1, price: 1580 },
      { pack: 180, count: 3, price: 4200, list: 4740 },
    ],
  },

  // --- 女性の健康 / ピル ------------------------------------------------
  {
    id: 901, slug: 'marvelon-21', name: 'マーベロン 21', sub: 'pill',
    brand: 'ORGANON', maker: 'Organon',
    desc: '低用量ピルとして広く用いられている経口避妊薬です。',
    effect: '避妊、生理周期の調整', ingredient: 'デソゲストレル、エチニルエストラジオール',
    target: '成人女性', dosage: '1日1錠を毎日同じ時間に', sideEffects: '不正出血、吐き気、頭痛など',
    unit: '錠', packUnit: 'シート', variantBase: 31000, updatedAt: '2026-08-03',
    rating: 4.4, reviews: 142, tags: ['ピル', '女性向け', '継続'],
    tiers: [
      { pack: 21, count: 1, price: 1850 },
      { pack: 63, count: 3, price: 4900, list: 5550 },
      { pack: 126, count: 6, price: 9200, list: 11100 },
    ],
  },
  {
    id: 902, slug: 'yaz-generic', name: 'ヤーズジェネリック', sub: 'pill',
    brand: 'GENERIC', maker: 'Bayer',
    desc: '月経困難症の治療にも用いられる超低用量ピルのジェネリック医薬品です。',
    effect: '避妊、月経困難症の緩和', ingredient: 'ドロスピレノン、エチニルエストラジオール',
    target: '成人女性', dosage: '1日1錠を毎日同じ時間に', sideEffects: '不正出血、頭痛、乳房の張りなど',
    unit: '錠', packUnit: 'シート', variantBase: 31100, updatedAt: '2026-07-17',
    rating: 4.5, reviews: 118, tags: ['ピル', '女性向け'],
    tiers: [
      { pack: 28, count: 1, price: 2380 },
      { pack: 84, count: 3, price: 6300, list: 7140 },
    ],
  },

  // --- 女性の健康 / 更年期 ----------------------------------------------
  {
    id: 911, slug: 'menosan', name: 'メノサン', sub: 'menopause',
    brand: 'HIMALAYA', maker: 'Himalaya Wellness',
    desc: '更年期の体調変化をサポートするハーブ由来のサプリメントです。',
    effect: '更年期の体調変化のサポート', ingredient: 'シャタバリ、アシュワガンダ ほか',
    target: '成人女性', dosage: '1日2回、1回1錠',
    unit: '錠', packUnit: 'ボトル', variantBase: 31200, updatedAt: '2026-06-20',
    rating: 4.0, reviews: 54, tags: ['ハーブ', '女性向け'],
    tiers: [
      { pack: 60, count: 1, price: 1320 },
      { pack: 180, count: 3, price: 3500, list: 3960 },
    ],
  },
  {
    id: 912, slug: 'black-cohosh-40mg', name: 'ブラックコホシュ 40mg', sub: 'menopause',
    brand: 'SWANSON', maker: 'Swanson Health',
    desc: '更年期の健康維持に用いられるハーブサプリメントです。',
    effect: '更年期の健康維持のサポート', ingredient: 'ブラックコホシュエキス 40mg',
    target: '成人女性', dosage: '1日1カプセル',
    unit: 'カプセル', packUnit: 'ボトル', variantBase: 31300, updatedAt: '2026-05-22',
    rating: 3.9, reviews: 31, tags: ['ハーブ', '女性向け'],
    tiers: [
      { pack: 60, count: 1, price: 1560 },
      { pack: 180, count: 3, price: 4100, list: 4680 },
    ],
  },

  // --- サプリメント / ビタミン ------------------------------------------
  {
    id: 905, slug: 'vitamin-d3-5000iu', name: 'ビタミンD3 5000IU', sub: 'vitamins',
    brand: 'NOW FOODS', maker: 'NOW Foods',
    desc: '日々の健康維持をサポートするビタミンDサプリメントです。',
    effect: '健康維持のサポート', ingredient: 'ビタミンD3（コレカルシフェロール）5000IU',
    dosage: '1日1錠',
    unit: '錠', packUnit: 'ボトル', variantBase: 30700, updatedAt: '2026-08-09',
    rating: 4.7, reviews: 203, tags: ['サプリメント', '健康維持', 'コスパ'],
    tiers: [
      { pack: 120, count: 1, price: 980 },
      { pack: 360, count: 3, price: 2500, list: 2940 },
    ],
  },
  {
    id: 906, slug: 'vitamin-b-complex', name: 'ビタミンBコンプレックス', sub: 'vitamins',
    brand: 'NOW FOODS', maker: 'NOW Foods',
    desc: 'ビタミンB群をバランスよく配合したサプリメントです。',
    effect: 'エネルギー代謝のサポート', ingredient: 'ビタミンB1・B2・B6・B12 ほか',
    dosage: '1日1カプセル',
    unit: 'カプセル', packUnit: 'ボトル', variantBase: 30800, updatedAt: '2026-07-06',
    rating: 4.5, reviews: 147, tags: ['サプリメント', '健康維持', 'コスパ'],
    tiers: [
      { pack: 100, count: 1, price: 1240 },
      { pack: 300, count: 3, price: 3200, list: 3720 },
    ],
  },

  // --- サプリメント / ハーブ --------------------------------------------
  {
    id: 921, slug: 'triphala-tablets', name: 'トリファラ', sub: 'herbal',
    brand: 'HIMALAYA', maker: 'Himalaya Wellness',
    desc: 'アーユルヴェーダで伝統的に用いられてきた3種の果実の配合サプリメントです。',
    effect: '消化と健康維持のサポート', ingredient: 'アムラ、ハリタキ、ビビタキ',
    dosage: '1日2回、1回1〜2錠',
    unit: '錠', packUnit: 'ボトル', variantBase: 30900, updatedAt: '2026-06-09',
    rating: 4.2, reviews: 88, tags: ['ハーブ', '健康維持'],
    tiers: [
      { pack: 60, count: 1, price: 880 },
      { pack: 180, count: 3, price: 2300, list: 2640 },
    ],
  },
  {
    id: 922, slug: 'turmeric-curcumin-500mg', name: 'ターメリック クルクミン 500mg', sub: 'herbal',
    brand: 'SWANSON', maker: 'Swanson Health',
    desc: 'ウコン由来のクルクミンを配合したサプリメントです。',
    effect: '健康維持のサポート', ingredient: 'クルクミン 500mg',
    dosage: '1日1〜2カプセル',
    unit: 'カプセル', packUnit: 'ボトル', variantBase: 31400, updatedAt: '2026-07-13',
    rating: 4.3, reviews: 95, tags: ['ハーブ', '健康維持'],
    tiers: [
      { pack: 60, count: 1, price: 1180 },
      { pack: 180, count: 3, price: 3100, list: 3540 },
    ],
  },
];

/** @type {import('@/lib/types').Product[]} */
export const products = SPECS.map(makeProduct);

/**
 * Categories with counts derived from the actual product list, so the numbers
 * shown in navigation can never drift from reality.
 */
export const categories = CATEGORY_TREE.map((parent) => {
  const children = parent.children.map((child) => ({
    ...child,
    productCount: products.filter((p) => p.subcategory?.slug === child.slug).length,
  }));

  return {
    ...parent,
    children,
    productCount: products.filter((p) => p.category.slug === parent.slug).length,
  };
});

/**
 * Sample banners.
 *
 * Placement names mirror the backend's own banner endpoints so wiring the
 * real data is a rename, not a redesign:
 *  - `carousel`     — the wide slot at the centre of the showcase row
 *  - `left`/`right` — square banners flanking it
 *  - `promo`        — three evergreen entry tiles
 *  - `notice`       — text-only announcement strip (not currently rendered)
 *
 * Artwork is placeholder. Real banners are uploaded through the admin panel;
 * only the URLs change.
 */
/* Placeholder artwork tinted to the current palette. Real banners are
   uploaded through the admin panel; only these URLs change. */
const BANNER_IMG = (text, w, h, bg = '7b3fc6', fg = 'ffffff') =>
  `https://placehold.co/${w}x${h}/${bg}/${fg}/webp?text=${encodeURIComponent(text)}`;

export const banners = [
  // --- Notice ----------------------------------------------------------
  {
    id: 1,
    placement: 'notice',
    position: 1,
    title: '年末年始の発送についてのお知らせ',
    subtitle: '12月28日〜1月4日はご注文の発送をお休みいたします。',
    href: '/faq',
    isActive: true,
    startsAt: '2026-01-01',
    endsAt: '2027-01-04',
  },

  // --- Hero strip ------------------------------------------------------
  {
    id: 10,
    placement: 'carousel',
    position: 1,
    badge: 'キャンペーン',
    title: 'まとめ買いで最大17%OFF',
    subtitle: '数量が多いほど1錠あたりの価格が下がります。',
    ctaLabel: 'お得な商品を見る',
    href: '/category',
    theme: 'primary',
    image: {
      url: BANNER_IMG('まとめ買いキャンペーン', 1120, 400),
      alt: 'まとめ買いで最大17%OFFキャンペーンのバナー',
      width: 1120,
      height: 400,
    },
    isActive: true,
  },
  {
    id: 11,
    placement: 'carousel',
    position: 2,
    badge: '季節のおすすめ',
    title: '花粉症シーズンの備えを',
    subtitle: '早めの対策で、つらい季節を快適に。',
    ctaLabel: '花粉症の商品を見る',
    href: '/symptom/hay-fever',
    theme: 'accent',
    image: {
      url: BANNER_IMG('花粉症シーズン特集', 1120, 400, 'ec4899'),
      alt: '花粉症シーズンの対策商品特集のバナー',
      width: 1120,
      height: 400,
    },
    isActive: true,
  },
  {
    id: 12,
    placement: 'carousel',
    position: 3,
    badge: '送料無料',
    title: '10,000円以上のご購入で送料無料',
    subtitle: 'まとめてご注文いただくとよりお得です。',
    ctaLabel: '商品を探す',
    href: '/category',
    theme: 'neutral',
    image: {
      url: BANNER_IMG('送料無料キャンペーン', 1120, 400, '3d1470'),
      alt: '10,000円以上のご購入で送料無料キャンペーンのバナー',
      width: 1120,
      height: 400,
    },
    isActive: true,
  },

  // --- Side banners (square, flanking the carousel) ---------------------
  {
    id: 40,
    placement: 'left',
    position: 1,
    badge: '初めての方へ',
    title: 'ご注文からお届けまで',
    subtitle: '個人輸入のしくみをやさしく解説',
    href: '/faq',
    theme: 'primary',
    image: {
      url: BANNER_IMG('ご利用ガイド', 600, 600, '7b3fc6'),
      alt: 'ご利用ガイドへのバナー',
      width: 600,
      height: 600,
    },
    isActive: true,
  },
  {
    id: 41,
    placement: 'right',
    position: 1,
    badge: '人気',
    title: '売れ筋ランキング',
    subtitle: 'よく選ばれている商品',
    href: '/category',
    theme: 'accent',
    image: {
      url: BANNER_IMG('人気ランキング', 600, 600, 'd81b7a'),
      alt: '人気ランキングへのバナー',
      width: 600,
      height: 600,
    },
    isActive: true,
  },

  // --- Promo tiles -----------------------------------------------------
  {
    id: 20,
    placement: 'promo',
    position: 1,
    title: '症状から探す',
    subtitle: '商品名がわからなくても大丈夫',
    href: '/symptom',
    theme: 'primary',
    image: {
      url: BANNER_IMG('症状から探す', 720, 400, '8b52d4'),
      alt: '症状から商品を探すページへのバナー',
      width: 720,
      height: 400,
    },
    isActive: true,
  },
  {
    id: 21,
    placement: 'promo',
    position: 2,
    title: '人気ランキング',
    subtitle: 'よく選ばれている商品',
    href: '/category',
    theme: 'accent',
    image: {
      url: BANNER_IMG('人気ランキング', 720, 400, 'd81b7a'),
      alt: '人気ランキングページへのバナー',
      width: 720,
      height: 400,
    },
    isActive: true,
  },
  {
    id: 22,
    placement: 'promo',
    position: 3,
    title: 'はじめての方へ',
    subtitle: 'ご注文からお届けまで',
    href: '/faq',
    theme: 'neutral',
    image: {
      url: BANNER_IMG('はじめての方へ', 720, 400, '453a4a'),
      alt: 'ご利用ガイドへのバナー',
      width: 720,
      height: 400,
    },
    isActive: true,
  },

  // --- Scheduling examples ---------------------------------------------
  // These three must NEVER render. They exist to prove the server-side gate
  // works and to show the admin panel what each field does.
  {
    id: 90,
    placement: 'carousel',
    position: 90,
    title: '【期限切れ】夏のセール',
    subtitle: 'endsAt を過ぎているため表示されません。',
    href: '/category',
    theme: 'neutral',
    isActive: true,
    startsAt: '2026-06-01',
    endsAt: '2026-06-30',
  },
  {
    id: 91,
    placement: 'carousel',
    position: 91,
    title: '【公開前】冬のキャンペーン',
    subtitle: 'startsAt がまだ到来していないため表示されません。',
    href: '/category',
    theme: 'neutral',
    isActive: true,
    startsAt: '2026-12-01',
    endsAt: '2026-12-31',
  },
  {
    id: 92,
    placement: 'promo',
    position: 92,
    title: '【下書き】未公開バナー',
    subtitle: 'isActive が false のため表示されません。',
    href: '/category',
    theme: 'neutral',
    isActive: false,
  },
];

/** Editorial content for the health column. */
export const blogs = [
  {
    slug: 'hay-fever-basics',
    title: '花粉症の基礎知識と対策',
    excerpt: '花粉症の仕組みと、日常生活でできる対策をわかりやすく解説します。',
    image: { url: IMG('花粉症'), alt: '花粉症の解説記事のイメージ画像' },
    publishedAt: '2026-08-01',
    updatedAt: '2026-08-06',
    category: '季節の健康',
    readingMinutes: 6,
  },
  {
    slug: 'aga-treatment-guide',
    title: 'AGA治療をはじめる前に知っておきたいこと',
    excerpt: '治療の選択肢、続けるうえでの注意点、相談先について整理しました。',
    image: { url: IMG('AGA'), alt: 'AGA治療の解説記事のイメージ画像' },
    publishedAt: '2026-07-22',
    updatedAt: '2026-07-22',
    category: '男性の健康',
    readingMinutes: 8,
  },
  {
    slug: 'personal-import-explained',
    title: '医薬品の個人輸入とは？ルールと注意点',
    excerpt: '個人輸入の範囲、数量の目安、注意すべき点を解説します。',
    image: { url: IMG('個人輸入'), alt: '個人輸入の解説記事のイメージ画像' },
    publishedAt: '2026-07-10',
    updatedAt: '2026-08-04',
    category: 'ご利用ガイド',
    readingMinutes: 5,
  },
  {
    slug: 'sleep-quality-tips',
    title: '睡眠の質を上げる生活習慣',
    excerpt: '寝つきや睡眠の質に関わる要因と、見直しやすい習慣を紹介します。',
    image: { url: IMG('睡眠'), alt: '睡眠に関する解説記事のイメージ画像' },
    publishedAt: '2026-06-28',
    updatedAt: '2026-06-28',
    category: '生活習慣',
    readingMinutes: 7,
  },
];
