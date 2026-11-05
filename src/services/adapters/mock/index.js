/**
 * Medicamaru — mock data adapter.
 *
 * Implements the same interface as the HTTP adapter so services are unaware
 * of which one is active. Sorting, filtering and pagination are implemented
 * here so the UI exercises the real query contract before the backend exists.
 *
 * When the backend replica lands, set DATA_SOURCE=api and nothing outside
 * services/ changes.
 */

import { products, categories, symptoms, blogs, banners } from './fixtures';
import { DEFAULT_PER_PAGE } from '@/constants/site';
import { richTextHtml } from '@/lib/sanitize';

/**
 * Resolve banners for a placement, applying the active flag and schedule
 * window. This gate is deliberately server-side: if the frontend filtered by
 * date, a cached page could keep showing an expired campaign, and a queued
 * one would leak early to anyone with a stale bundle.
 *
 * @param {import('@/lib/types').BannerPlacement} placement
 */
function bannersFor(placement, now = new Date()) {
  return banners
    .filter((b) => b.placement === placement && b.isActive)
    .filter((b) => !b.startsAt || new Date(b.startsAt) <= now)
    .filter((b) => !b.endsAt || new Date(b.endsAt) >= now)
    .sort((a, b) => a.position - b.position);
}

/**
 * Strip a full product down to the card-sized summary shape.
 *
 * Exported for the favourites fixture, which was handing ProductCard the FULL
 * product — and a full product has `images`, not the single `image` the card
 * reads, so every favourite crashed the page on `image.url`.
 */
export function toSummary(p) {
  const inStockVariants = p.variants.filter((v) => v.inStock);
  const priceable = inStockVariants.length ? inStockVariants : p.variants;
  const cheapest = priceable.reduce((a, b) => (a.price <= b.price ? a : b));
  const bestUnit = priceable.reduce((a, b) => (a.unitPrice <= b.unitPrice ? a : b));
  return {
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    image: p.images[0],
    brand: p.brand,
    fromPrice: cheapest.price,
    fromUnitPrice: bestUnit.unitPrice,
    unitLabel: cheapest.unitLabel,
    maxDiscountPct: Math.max(0, ...p.variants.map((v) => v.discountPct)),
    inStock: inStockVariants.length > 0,
    rating: p.rating,
    tags: p.tags,
    category: p.category,
  };
}

const SORTERS = {
  recommended: (a, b) => b.rating.count - a.rating.count,
  price_asc: (a, b) => a.fromPrice - b.fromPrice,
  price_desc: (a, b) => b.fromPrice - a.fromPrice,
  rating_desc: (a, b) => b.rating.average - a.rating.average,
  popular: (a, b) => b.rating.count - a.rating.count,
  newest: (a, b) => b.id - a.id,
};

/** Simulate realistic network latency in development. */
function delay(ms = 40) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockAdapter = {
  async getCategories() {
    await delay();
    return categories;
  },

  async getCategory(slug) {
    await delay();
    for (const c of categories) {
      if (c.slug === slug) return c;
      const child = c.children?.find((ch) => ch.slug === slug);
      if (child) return { ...child, parent: { slug: c.slug, name: c.name } };
    }
    return null;
  },

  async getSymptoms() {
    await delay();
    return symptoms;
  },

  /* The fixtures have no groups, and inventing some would make mock mode
     disagree with every real environment. Returning [] is honest and is
     exactly the case /symptom already handles — it falls back to the flat
     symptom list. */
  async getSymptomGroups() {
    return [];
  },

  async getSymptomGroupProducts() {
    return null;
  },

  /** @param {import('@/lib/types').ProductQuery} query */
  async getProducts(query = {}) {
    await delay();
    const {
      q, category, symptom, tags, inStock,
      minPrice, maxPrice,
      sort = 'recommended',
      page = 1,
      perPage = DEFAULT_PER_PAGE,
    } = query;

    let items = products.map(toSummary);

    if (q) {
      const needle = q.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.shortDescription.toLowerCase().includes(needle) ||
          p.brand.toLowerCase().includes(needle) ||
          p.tags.some((t) => t.toLowerCase().includes(needle))
      );
    }

    if (category) {
      const parent = categories.find((c) => c.slug === category);
      const childSlugs = parent?.children?.map((c) => c.slug) ?? [];
      items = items.filter((p) => {
        const full = products.find((x) => x.id === p.id);
        return (
          p.category.slug === category ||
          full?.subcategory?.slug === category ||
          childSlugs.includes(full?.subcategory?.slug)
        );
      });
    }

    if (symptom) {
      const match = symptoms.find((s) => s.slug === symptom);
      if (match) items = items.filter((p) => match.categorySlugs.includes(p.category.slug));
    }

    if (tags?.length) {
      items = items.filter((p) => tags.some((t) => p.tags.includes(t)));
    }

    if (inStock) items = items.filter((p) => p.inStock);
    if (typeof minPrice === 'number') items = items.filter((p) => p.fromPrice >= minPrice);
    if (typeof maxPrice === 'number') items = items.filter((p) => p.fromPrice <= maxPrice);

    items.sort(SORTERS[sort] ?? SORTERS.recommended);

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * perPage;

    return {
      items: items.slice(start, start + perPage),
      page: safePage,
      perPage,
      total,
      totalPages,
    };
  },

  async getProduct(slug) {
    await delay();
    return products.find((p) => p.slug === slug) ?? null;
  },

  /* Mirrors the http adapter. Two fixtures so the list, the star row and the
     "with photo" case all have something to render under DATA_SOURCE=mock. */
  /* Same shape as the live adapter: rows plus the aggregate. The product
     fixtures carry their own rating, but the live detail endpoint does not —
     so this is the number the page actually renders, and the mock has to
     provide it or the two behave differently. */
  async getProductReviews(productId) {
    await delay(20);
    if (!productId) return { items: [], average: 0, count: 0 };

    const items = [
      {
        id: 'rev-1',
        rating: 5,
        comment: '包装も丁寧で、注文から10日ほどで届きました。また利用します。',
        author: 'タロウ',
        createdAt: '2026-09-18',
        image: null,
      },
      {
        id: 'rev-2',
        rating: 4,
        comment: '効き目については個人差があると思いますが、説明がわかりやすく安心できました。',
        author: 'ご利用者',
        createdAt: '2026-08-02',
        image: null,
      },
    ];

    return {
      items,
      average: items.reduce((sum, r) => sum + r.rating, 0) / items.length,
      count: items.length,
    };
  },

  async getRelatedProducts(slug, limit = 6) {
    await delay();
    const product = products.find((p) => p.slug === slug);
    if (!product) return [];
    return products
      .filter((p) => p.slug !== slug && p.category.slug === product.category.slug)
      .concat(products.filter((p) => p.slug !== slug && p.category.slug !== product.category.slug))
      .slice(0, limit)
      .map(toSummary);
  },

  async getRankedProducts(limit = 10) {
    return (await this.getHome()).ranked.slice(0, limit);
  },

  async getHome() {
    await delay();
    const all = products.map(toSummary);

    /* Best-ranking products. Mirrors the backend's own /home/rankedProducts.
       Ranked by review volume then score — volume first, because a 5.0 from
       two people is not a bestseller. */
    const ranked = [...all]
      .sort((a, b) => b.rating.count - a.rating.count || b.rating.average - a.rating.average)
      .slice(0, 10);

    /* Category rails. The backend exposes this directly as
       getProductCategoriesWithProducts — five categories, each with its own
       products and a link through to the full listing. Categories with no
       products are skipped rather than rendering an empty rail. */
    const categorySections = categories
      .map((category) => ({
        slug: category.slug,
        name: category.name,
        productCount: category.productCount,
        products: all.filter((p) => p.category.slug === category.slug).slice(0, 10),
      }))
      /* No cap, matching the http adapter: the rail count is the admin's
         "Show On Home Page" ticks, not a number fixed in code. The demo
         fixtures have no such flag, so every fixture category gets a rail. */
      .filter((section) => section.products.length > 0);

    return {
      ranked,
      categorySections,
      featured: ranked,
      newArrivals: [...all].sort((a, b) => b.id - a.id).slice(0, 8),
      onSale: all.filter((p) => p.maxDiscountPct > 0).slice(0, 8),
      seasonal: all.filter((p) => p.tags.includes('季節商品')).slice(0, 8),
      categories,
      symptoms,
      blogs: blogs.slice(0, 4),
      banners: {
        notice: bannersFor('notice'),
        carousel: bannersFor('carousel'),
        left: bannersFor('left'),
        right: bannersFor('right'),
        promo: bannersFor('promo'),
      },
    };
  },

  /** Banners for a single placement — used outside the homepage. */
  async getBanners(placement) {
    await delay(20);
    return bannersFor(placement);
  },

  /* Two campaigns, where there used to be none.
     The old comment said [] was the honest mock because campaigns are admin
     content — true of an ordinary coupon, and it stayed [] for that reason.
     It stopped being true for the referral card: that one is NOT just content,
     it is a branch in CampaignCard that renders a My Page link instead of a
     code, and a branch nobody can see is a branch nobody can check. One of
     each kind, so both paths are visible. */
  async getCampaigns() {
    await delay(20);

    return [
      {
        id: 901,
        position: 1,
        title: 'お友達紹介キャンペーン',
        couponCode: null,
        isReferral: true,
        startsAt: '2026-10-15',
        endsAt: '2027-03-31',
        minSpend: 3000,
        benefit: { kind: 'fixed', amount: 500 },
        html: '<p>紹介コードからご登録いただくと、おふたりにポイントを進呈します。</p>',
        isActive: true,
      },
      {
        id: 902,
        position: 2,
        title: '美容製品が一律10%オフ',
        couponCode: 'BEAUTY10',
        isReferral: false,
        startsAt: '2026-01-01',
        endsAt: '2026-12-31',
        minSpend: 1000,
        benefit: { kind: 'percentage', percent: 10 },
        html: '<p>対象の美容製品が10%オフになります。</p>',
        isActive: true,
      },
    ];
  },

  async getFaqs() {
    await delay(20);
    return [
      {
        question: '海外医薬品の個人輸入は合法ですか？',
        answer:
          '個人使用を目的とした数量の範囲内であれば、医薬品医療機器等法により個人輸入が認められています。転売や譲渡は禁止されています。',
        isActive: true,
      },
      {
        question: '注文からお届けまで何日かかりますか？',
        answer: '通常10〜14日程度でお届けします。通関の状況により前後する場合があります。',
        isActive: true,
      },
      {
        question: '医師の処方箋は必要ですか？',
        answer:
          '個人輸入では処方箋は不要ですが、服用前に医師または薬剤師にご相談いただくことを強くおすすめします。',
        isActive: true,
      },
    ];
  },

  /* The /faq page's groups as the backend seeds them
     (2026_09_22_100200_seed_faq_page_groups), trimmed to two per group. */
  async getNotices() {
    await delay(20);
    return [
      {
        id: 2,
        title: '年末年始の発送について',
        html: '<p>12月29日から1月3日までにいただいたご注文は、1月4日より順次発送いたします。</p><p>詳しくは<a href="/faq">よくあるご質問</a>をご覧ください。</p>',
        excerpt: '12月29日から1月3日までにいただいたご注文は、1月4日より順次発送いたします。',
        date: '2026-09-20',
      },
      {
        id: 1,
        title: 'メディカ丸をオープンしました',
        html: '<p>今後ともメディカ丸をよろしくお願いいたします。</p>',
        excerpt: '今後ともメディカ丸をよろしくお願いいたします。',
        date: '2026-09-01',
      },
    ];
  },

  async subscribe() {
    await delay(20);
    return { ok: true };
  },

  async submitInquiry() {
    await delay(20);
    return { ok: true };
  },

  async getFaqGroups() {
    await delay(20);
    const faq = (question, answer) => ({ question, answer, html: richTextHtml(answer), updatedAt: null, isActive: true });
    return [
      { id: 1, name: 'ご注文について', icon: 'order', faqs: [
        faq('会員登録をしなくても購入できますか？', 'はい、会員登録なしでもご注文いただけます。会員登録をされると、注文履歴の確認やお気に入りの保存がご利用いただけます。'),
        faq('注文をキャンセルできますか？', '発送準備に入る前であればキャンセルを承ります。お問い合わせよりできるだけ早くご連絡ください。'),
      ] },
      { id: 2, name: 'お支払いについて', icon: 'payment', faqs: [
        faq('クーポンは併用できますか？', 'クーポンは1回のご注文につき1つまでご利用いただけます。'),
        faq('ポイントはいつ付与されますか？', 'ご注文商品の発送完了後に付与されます。次回以降のお買い物にご利用いただけます。'),
      ] },
      { id: 3, name: '配送について', icon: 'delivery', faqs: [
        faq('届くまでどのくらいかかりますか？', '海外からの発送となるため、通常10〜14日ほどかかります。税関の状況により前後する場合があります。'),
        faq('梱包で中身がわかりますか？', '中身がわからない梱包でお届けしますので、ご家族や配達員に内容を知られることはありません。'),
      ] },
      { id: 4, name: '商品・個人輸入について', icon: 'import', faqs: [
        faq('取り扱っている商品は正規品ですか？', 'はい、当サイトでお取り扱いする商品はすべて正規品です。'),
        faq('購入した医薬品を家族に渡してもよいですか？', 'いいえ。個人輸入した医薬品は、ご本人が使用する場合に限られます。ご家族を含む第三者への譲渡・販売は法律で禁止されています。'),
      ] },
    ];
  },

  async getBlogs({ page = 1, perPage = 12 } = {}) {
    await delay();
    const total = blogs.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    return { items: blogs.slice(start, start + perPage), page, perPage, total, totalPages };
  },

  async getBlog(slug) {
    await delay();
    return blogs.find((b) => b.slug === slug) ?? null;
  },

  async getSearchSuggestions(q, limit = 8) {
    await delay(20);
    if (!q) return [];
    const needle = q.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(needle) || p.brand.toLowerCase().includes(needle))
      .slice(0, limit)
      .map((p) => ({ slug: p.slug, name: p.name, image: p.images[0] }));
  },

  /** Every product slug — used to build the sitemap and generateStaticParams. */
  async getAllProductSlugs() {
    return products.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
  },

  async getAllCategorySlugs() {
    const out = [];
    for (const c of categories) {
      out.push({ slug: c.slug });
      c.children?.forEach((ch) => out.push({ slug: ch.slug }));
    }
    return out;
  },

  /* No fixture. Mock mode exercises the FALLBACK path — the metadata each page
     declares in its own file — which is also what production shows for any
     page with no row in Admin → SEO Pages. */
  async getPageSeo() {
    return null;
  },

  /* A figure, so the registration popup is visible while working in mock
     mode. Deliberately NOT 500: a fixture that happens to match the live
     setting would hide the case this is all for — the number coming from the
     admin rather than from the code. If the popup here says 500, something
     has gone back to hardcoding it. */
  async getRegistrationPoints() {
    return 300;
  },

  /* No popups in mock mode.
     An empty list rather than a fixture on purpose: a managed popup suppresses
     the registration one, so a fixture here would hide the component this
     adapter exists to exercise. Anyone working on the managed popup itself
     needs the real backend, which is where the images live anyway — there is
     no artwork in the fixtures to point it at. */
  async listPopups() {
    return [];
  },
};
