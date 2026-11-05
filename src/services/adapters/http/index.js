/**
 * Medicamaru — HTTP catalogue adapter.
 *
 * Talks to the live backend at API_BASE_URL. Implements the same interface as
 * the mock adapter, so `DATA_SOURCE=api|mock` is the only switch needed.
 *
 * Verified live against https://adminpanel.medicamaru.com on 2026-08-13.
 * Response shapes are mapped in ./normalise.js — nothing above the service
 * layer sees the backend's snake_case rows.
 *
 * Every response is wrapped as { message, code, results: { status, data } }.
 */

import { apiFetch } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { ApiError, isUnavailable, logError } from '@/lib/api/errors';
import {
  normaliseReview,
  normaliseCategory,
  normaliseSubcategory,
  normaliseProduct,
  normaliseProductSummary,
  normalisePagination,
  normaliseBanner,
  normaliseCampaign,
  productSlug,
  productIdFromSlug,
  normaliseFaq,
  normaliseFaqGroup,
  normaliseNotice,
  normaliseSymptom,
  normaliseSymptomGroup,
} from './normalise';

/**
 * Our sort vocabulary mapped onto the two orderings the backend implements.
 * Anything else falls through to applyClientQuery, which can only sort the
 * page it was given — see the note there.
 */
const SORT_PARAM = { price_asc: 'low_to_high', price_desc: 'high_to_low' };

/* What getProductReviews answers when there is no product to ask about. A
   constant so every caller destructures the same three keys. */
const EMPTY_REVIEWS = { items: [], average: 0, count: 0 };

/* Revalidation windows, in seconds. */
const TTL = {
  categories: 60 * 60,
  product: 60 * 10,   // price and stock live here
  listing: 60 * 5,
  home: 60 * 5,
  content: 60 * 30,
  faqs: 60 * 10,      // edited in the admin; an edit shows within ten minutes
  notices: 60 * 10,   // same window as the FAQs they sit beside
  seo: 60 * 30,       // page titles change rarely; same window as content
  /* The advertised points figure. Short, because this number is a claim made
     to customers: once it is changed in the admin, every minute the old one
     stays up is a minute the shop is promising something it will not credit.
     The call is one cached row and runs on the layout, so a tight window is
     affordable here in a way it would not be for a listing.

     Note this is a CEILING, not the propagation time. The caller renders in
     the root layout, so on a statically revalidated route the value is held
     until that page refreshes — see RegisterPopupMount. */
  pointsSettings: 60,
  /* Live popups. Same reasoning as pointsSettings and the same ceiling: a
     campaign popup is a claim made to customers, and switching one off in a
     hurry is the main thing anyone will ever do on that screen. */
  popups: 60,
};

/** Unwrap the standard envelope; tolerate the couple of shapes that differ. */
const unwrap = (res) => res?.results?.data ?? res?.data ?? res ?? null;
const meta = (res) => res?.results ?? {};

const asArray = (v) => (Array.isArray(v) ? v : v?.data ?? []);

export const httpAdapter = {
  /**
   * @param {boolean} [includeAll] Include categories not flagged for the
   *   homepage. Three of the eleven active categories are unflagged and hold
   *   270 products between them, so anything that means "the whole catalogue"
   *   has to ask for them explicitly.
   */
  async getCategories(includeAll = false) {
    const res = await apiFetch(endpoints.categories(includeAll), {
      revalidate: TTL.categories,
      tags: ['categories'],
    });
    return asArray(unwrap(res)).map((c) => normaliseCategory(c));
  },

  /**
   * Subcategories are a separate call per category. The nav dropdown would
   * need 26 of them, so callers fetch children only for the category being
   * viewed rather than for the whole tree.
   */
  async getSubcategories(categoryId) {
    const res = await apiFetch(endpoints.subcategories(categoryId), {
      revalidate: TTL.categories,
      tags: ['categories'],
    });
    return asArray(unwrap(res)).map((s) => normaliseSubcategory(s));
  },

  /**
   * Resolve a URL slug to whatever it addresses — a category OR a
   * subcategory. Both live under /category/… in our URLs, and a subcategory
   * slug previously resolved to nothing, so every subcategory link in the app
   * (breadcrumbs, SubcategoryNav) 404'd.
   *
   * Returns `{ category, subcategory }` where `subcategory` is null for a
   * top-level slug. The subcategory search costs one request per category,
   * but only on a miss, and it is cached for an hour like the rest of the
   * taxonomy.
   */
  async resolveTaxonomy(slug) {
    /* The FULL list, not the homepage subset. A category that is simply not
       featured on the front page still has a page, still has products, and
       still gets linked from the category index — resolving against the
       subset made those three 404. */
    const categories = await this.getCategories(true);
    const direct = categories.find((c) => c.slug === slug || String(c.id) === String(slug));
    if (direct) return { category: direct, subcategory: null };

    for (const category of categories) {
      const children = await this.getSubcategories(category.id).catch(() => []);
      const child = children.find((s) => s.slug === slug || String(s.id) === String(slug));
      if (child) return { category, subcategory: child };
    }

    return { category: null, subcategory: null };
  },

  /**
   * Categories are addressed by slug in our URLs but by numeric id in the
   * API, so the slug is resolved against the category list first.
   *
   * A subcategory slug resolves to a page describing that subcategory, with
   * its siblings as the nav and its parent recorded for the breadcrumb.
   */
  async getCategory(slug) {
    const { category, subcategory } = await this.resolveTaxonomy(slug);
    if (!category) return null;

    if (subcategory) {
      const siblings = await this.getSubcategories(category.id).catch(() => []);
      return {
        ...subcategory,
        parent: { slug: category.slug, name: category.name },
        children: siblings,
      };
    }

    const match = category;
    const children = await this.getSubcategories(match.id).catch(() => []);
    return { ...match, children };
  },

  /**
   * Product listing.
   *
   * Uses `categoryProducts` — the richest list endpoint, and the only one
   * that returns variants, ratings and per-unit pricing. Note the two
   * category endpoints that 500 on the live server are avoided entirely
   * (see endpoints.js).
   */
  async getProducts(query = {}) {
    const { category, symptom, q, page = 1, perPage } = query;

    /* Symptom listings cut across categories, so they have their own
       endpoint rather than a parameter on the category one. */
    if (symptom && !q) {
      const res = await apiFetch(endpoints.symptomProducts(symptom), {
        params: { page, per_page: perPage, sort: SORT_PARAM[query.sort] },
        revalidate: TTL.listing,
        tags: ['products', `symptom:${symptom}`],
      });
      const items = asArray(unwrap(res)).map(normaliseProductSummary);
      const paged = normalisePagination(meta(res).pagination, items.length);
      return applyClientQuery(items, { ...query, symptom: undefined }, paged);
    }

    /* The API filters by numeric id, not slug — and the slug may name either
       a category or a subcategory. `categoryProducts` takes both, so a
       subcategory listing is the parent's id plus the child's. */
    let categoryId = null;
    let subcategoryId = null;
    if (category) {
      const resolved = await this.resolveTaxonomy(category);
      categoryId = resolved.category?.id ?? null;
      subcategoryId = resolved.subcategory?.id ?? null;
    }

    /* Keyword search is a different endpoint. `categoryProducts` has no
       search parameter at all, so routing a keyword through it returned one
       arbitrary page of the catalogue which was then filtered in memory —
       and any product outside that page simply did not exist as far as
       search was concerned. `productsByName` searches the whole catalogue,
       and matches symptom names as well as product names. */
    if (q) {
      const res = await apiFetch(endpoints.productsByName(), {
        params: { search_by_name: q, page, per_page: perPage },
        revalidate: TTL.listing,
        tags: ['products'],
      });

      let items = asArray(unwrap(res)).map(normaliseProductSummary);

      /* The endpoint cannot filter by category as well as keyword, so that
         one refinement is applied here. It narrows the current page only —
         same caveat as applyClientQuery below. */
      if (categoryId) {
        items = items.filter((p) => p.category.slug === String(categoryId));
      }

      const paged = normalisePagination(meta(res).pagination, items.length);
      // `q` is already satisfied server-side; the rest still applies.
      return applyClientQuery(items, { ...query, q: undefined }, paged);
    }

    const res = await apiFetch(endpoints.categoryProducts(), {
      params: {
        category_id: categoryId,
        subcategory_id: subcategoryId,
        page,
        per_page: perPage,
        sort: SORT_PARAM[query.sort],
      },
      revalidate: TTL.listing,
      tags: ['products'],
    });

    const rows = asArray(unwrap(res));
    const items = rows.map(normaliseProductSummary);
    const paged = normalisePagination(meta(res).pagination, items.length);

    return applyClientQuery(items, query, paged);
  },

  /** Best-ranking products — the backend's own ranking. */
  async getRankedProducts(limit = 10) {
    const res = await apiFetch(endpoints.rankedProducts(), {
      revalidate: TTL.home,
      tags: ['products'],
    });
    return asArray(unwrap(res)).slice(0, limit).map(normaliseProductSummary);
  },

  async getFeaturedProducts(limit = 10) {
    const res = await apiFetch(endpoints.featuredProducts(), {
      revalidate: TTL.home,
      tags: ['products'],
    });
    return asArray(unwrap(res)).slice(0, limit).map(normaliseProductSummary);
  },

  /**
   * One product, by the URL segment `beauty-grace-ex-3295`.
   *
   * The backend looks products up by id and nothing else, so the id is read
   * off the end of the segment rather than the whole thing being sent. A bare
   * `3295` still parses, which is what keeps every URL indexed before the slug
   * existed resolving.
   *
   * The cache tag is keyed on the id, not the segment: two spellings of the
   * same product — the old URL and the new one — must not become two cache
   * entries that can disagree.
   */
  async getProduct(slug) {
    const id = productIdFromSlug(slug);
    if (!id) return null;

    const res = await apiFetch(endpoints.productDetails(), {
      params: { product_id: id, id },
      revalidate: TTL.product,
      tags: ['products', `product:${id}`],
    });
    const row = unwrap(res);
    const product = Array.isArray(row) ? row[0] : row;
    return product ? normaliseProduct(product) : null;
  },
  /* The moderated reviews for one product.
     
     The endpoint returns `results.data.{reviews, avgRating, reviews_count}`
     and filters to status = 1 itself. Only the list is taken: the aggregate
     already arrives on the product payload as `average_rating`, and reading
     the same number from two places invites them to disagree on screen.

     Short TTL rather than the product's: an approved review should appear
     without waiting for the product page's own revalidate window. */
  /**
   * Approved reviews, WITH the aggregate that comes with them.
   *
   * `avgRating` and `reviews_count` were being thrown away, and that is why
   * no review has ever appeared on a product page. The detail endpoint sends
   * no rating fields at all — productDetails carries neither average_rating
   * nor reviews_count, only the LIST endpoints compute them — so the page's
   * `product.rating.count` was always 0, and ReviewSummary returns its empty
   * state before it looks at the rows.
   *
   * These two numbers are also the better source: they are computed with
   * `status = 1`, where the list endpoints' reviews_count counts pending rows
   * too.
   */
  async getProductReviews(productId) {
    if (!productId) return EMPTY_REVIEWS;

    const res = await apiFetch(endpoints.productReviews(productId), {
      revalidate: 300,
      tags: ['reviews', `product:${productId}`],
    });

    const data = res?.results?.data ?? res?.data ?? {};
    const rows = data.reviews ?? [];

    return {
      items: (Array.isArray(rows) ? rows : []).map(normaliseReview),
      average: Number(data.avgRating) || 0,
      count: Number.parseInt(data.reviews_count, 10) || 0,
    };
  },

  async getRelatedProducts(slug, limit = 6) {
    const product = await this.getProduct(slug).catch(() => null);
    if (!product?.category?.slug) return [];
    const { items } = await this.getProducts({ category: product.category.slug, perPage: limit + 4 });
    return items.filter((p) => p.slug !== slug).slice(0, limit);
  },

  /**
   * Homepage: ranked products plus one rail per category.
   *
   * `CategoriesWithProducts` would do this in one call but returns 500 on the
   * live server, so the rails are assembled from parallel per-category calls.
   * Collapse this back to the single endpoint once that bug is fixed.
   */
  async getHome() {
    /* Categories are load-bearing: the nav, the category grid and every
       product rail are built from them. With none, the page renders as a
       shell with nothing in it — which reads as a broken site rather than a
       degraded one, and gets cached that way. So this one call is allowed
       to fail the page; the rest degrade to empty on their own. */
    const categoriesPromise = this.getCategories();

    /* No symptom fetch here any more: it existed only for the hero's shortcut
       chips, and the hero is gone. Symptoms are still fetched where they are
       actually used — the listing sidebar's filter panel. Dropping it saves a
       request on every revalidation, which matters against the backend's
       500-connections-per-hour ceiling. */
    const [ranked, categories, carousel, left, right, categoryBanners, homepageLine] =
      await Promise.all([
        /* NOT swallowed unconditionally, unlike the banners below.
        
           `ranked` feeds both the hero marquee and the 売れ筋ランキング rail, and
           ProductRail renders nothing at all when its list is empty — so one
           failed request took the entire section off the homepage, heading
           included. With `revalidate = 300` that blank copy was then cached and
           served to everyone for five minutes, which is why the rail appeared to
           vanish for no reason and come back on its own.
        
           A genuine empty result still renders as before. Only an outage — a 5xx,
           a timeout, a dropped connection, which is what the backend's
           500-connections-per-hour ceiling produces — is rethrown, and the same
           reasoning as the categories call above then applies: failing the render
           keeps the last good page in place rather than replacing it with a
           degraded one. */
        this.getRankedProducts(10).catch((error) => {
          if (isUnavailable(error)) throw error;
          return [];
        }),
        categoriesPromise,
        this.getBanners('carousel').catch(() => []),
        this.getBanners('left').catch(() => []),
        this.getBanners('right').catch(() => []),
        this.getBanners('category').catch(() => []),
        /* Swallowed like the rest: one banner slot failing must not take
           the whole homepage down with it. */
        this.getBanners('homepageLine').catch(() => []),
      ]);

    // One lookup rather than a find() per rail.
    const bannerByCategory = new Map(
      categoryBanners.map((banner) => [String(banner.categoryId), banner])
    );

    /* One rail per category the admin ticked "Show On Home Page", in their
       order_no order. This used to be `categories.slice(0, 5)`, which meant
       ticking a sixth category did nothing at all and gave whoever ticked it
       no way to find out — the admin screen said yes and the homepage said
       nothing. The count is an editorial decision, so it belongs with the
       editor, not in this file.

       Note the cost scales with it: each rail is two requests (products and
       subcategories), on top of the seven this method already makes, once per
       revalidation. Against the backend's 500-connections-per-hour ceiling
       that is worth remembering before ticking every category. */
    const sections = await Promise.all(
      categories.map(async (category) => {
        /* Products and subcategories are separate endpoints; running them
           together keeps each rail to one round trip's worth of latency
           rather than two. */
        const [products, subcategories] = await Promise.all([
          /* An outage is rethrown, not read as "no products" — the same rule
             as `ranked` above. A rail whose request failed was being dropped
             from the page like a genuinely empty category, and that page was
             then cached: after the 2026-09-22 deploy the live homepage showed
             3 of its 5 rails until the next revalidation. Rethrowing fails
             the render instead, so a revalidation keeps the last good page,
             and a build retries the page (staticGenerationRetryCount). A
             category that really has no products still drops out below. */
          this.getProducts({ category: category.slug, perPage: 10 })
            .then((r) => r.items.slice(0, 10))
            .catch((error) => {
              if (isUnavailable(error)) throw error;
              return [];
            }),
          // Only the chips under the rail; the rail stands without them.
          this.getSubcategories(category.id).catch(() => []),
        ]);

        return {
          slug: category.slug,
          name: category.name,
          /* Undefined when an editor has not assigned one; the rail simply
             renders without a banner rather than borrowing another. */
          banner: bannerByCategory.get(String(category.id)),
          subcategories,
          products,
        };
      })
    );

    return {
      ranked,
      featured: ranked,
      categorySections: sections.filter((s) => s.products.length > 0),
      newArrivals: [],
      onSale: [],
      seasonal: [],
      categories,
      blogs: [],
      banners: {
        notice: [],
        carousel,
        homepageLine,
        /* Passed through whole — how many tiles fit is a layout question, so
           BannerShowcase caps them rather than the service. */
        left,
        right,
        promo: [],
      },
    };
  },

  /**
   * Banners for one placement.
   *
   * The backend's `banner_position` values (carousel / left / right / youtube)
   * are the same names our placements use, so no translation is needed —
   * only shape mapping and the link rewrite in normalise.js.
   */
  async getBanners(placement) {
    const route =
      placement === 'left' ? endpoints.leftBanners()
      : placement === 'right' ? endpoints.rightBanners()
      : placement === 'carousel' ? endpoints.carousel()
      : placement === 'category' ? endpoints.categoryBanners()
      : placement === 'homepageLine' ? endpoints.homepageLineBanners()
      : endpoints.banners();

    const res = await apiFetch(route, { revalidate: TTL.home, tags: ['banners'] });
    return asArray(unwrap(res))
      .map(normaliseBanner)
      .filter((b) => b.isActive && b.image)
      .sort((a, b) => a.position - b.position);
  },

  /**
   * Every campaign for the /campaign page, soonest to finish first.
   *
   * The backend applies the date window and the 「Show on Campaign Page」 flag,
   * so nothing here re-checks them. Offers with no coupon code are dropped:
   * the page is built around the code being the thing you take away, and a
   * card with an empty chip where the code goes is worse than no card.
   */
  async getCampaigns() {
    const res = await apiFetch(endpoints.campaignOffers(), {
      revalidate: TTL.home,
      tags: ['banners'],
    });
    return asArray(unwrap(res))
      .map(normaliseCampaign)
      .filter((c) => c.isActive && c.title && (c.couponCode || c.isReferral))
      .sort((a, b) => {
        /* Ending soonest first, so anything about to lapse is seen. An offer
           with no end date has nothing to miss and goes last, whatever its
           display_order says. */
        if (!a.endsAt) return 1;
        if (!b.endsAt) return -1;
        const diff = new Date(a.endsAt) - new Date(b.endsAt);
        return diff !== 0 ? diff : a.position - b.position;
      });
  },

  /**
   * FAQs for one CMS page.
   *
   * The endpoint 500s without `page_slug` — it is required, despite reading
   * like a list route. `home` currently holds 26 entries.
   */
  async getFaqs(pageSlug = 'home') {
    const res = await apiFetch(endpoints.faqs(), {
      params: { page_slug: pageSlug },
      revalidate: TTL.content,
      tags: ['faqs'],
    });
    return asArray(unwrap(res))
      .map(normaliseFaq)
      .filter((f) => f.isActive && f.question && f.answer);
  },

  /**
   * The /faq page, grouped under its headings. The backend already drops
   * inactive groups, inactive FAQs and empty groups, and orders both levels.
   */
  async getFaqGroups() {
    const res = await apiFetch(endpoints.faqGroups(), {
      revalidate: TTL.faqs,
      tags: ['faqs'],
    });
    return asArray(unwrap(res))
      .map(normaliseFaqGroup)
      .filter((g) => g.name && g.faqs.length > 0);
  },

  /** Active notices, newest Notice Date first — the endpoint sorts them. */
  async getNotices() {
    const res = await apiFetch(endpoints.notices(), {
      revalidate: TTL.notices,
      tags: ['notices'],
    });
    return asArray(unwrap(res))
      .map(normaliseNotice)
      .filter((n) => n.title);
  },

  /**
   * Newsletter sign-up (POST /api/subscribe, table `subscribers`).
   *
   * The backend's only validation is `required|email|unique`, and the address
   * is checked for shape before it gets here, so a 422 means the address is
   * already on the list. Anything else is thrown for the caller to report.
   */
  async subscribe(email) {
    try {
      await apiFetch(endpoints.subscribe(), { method: 'POST', body: { email } });
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        return { ok: false, alreadySubscribed: true };
      }
      throw error;
    }
  },

  /**
   * Contact form (POST /api/contact, table `inquiry`, read in Admin → Inquiry).
   *
   * The backend takes name / email / subject / message. Our form also asks for
   * an order number, and there is no column for it — so it goes at the top of
   * the message instead of being dropped, because an order enquiry without the
   * order number is a round trip nobody needs.
   *
   * Nothing is swallowed here. If this throws, the caller must NOT tell the
   * customer their message was received: that is exactly the failure this
   * endpoint was wired up to end.
   */
  async submitInquiry({ name, email, subject, message, orderId }) {
    const body = {
      name,
      email,
      subject,
      message: orderId ? `【ご注文番号】${orderId}\n\n${message}` : message,
    };

    await apiFetch(endpoints.contact(), { method: 'POST', body });
    return { ok: true };
  },

  /**
   * Most-used product tags. The endpoint already orders by live product count
   * and excludes tags whose products are all inactive or soft-deleted, so
   * nothing needs ranking or filtering on this side.
   */
  /**
   * CMS page metadata from Admin → SEO Pages.
   *
   * Returns null when the page has no row, when every field is blank, or when
   * the request fails — all three mean the same thing to the caller: use the
   * metadata the page already had. The endpoint answers 200 with empty strings
   * for a missing page rather than 404, so "" has to be treated as absent here
   * or every unconfigured page would get a blank title.
   *
   * Never throws. Metadata runs during render, and a backend hiccup must cost
   * a page its admin-authored title, not its existence.
   */
  async getPageSeo(pageSlug) {
    try {
      const res = await apiFetch(endpoints.seoMeta(pageSlug), {
        revalidate: TTL.seo,
        tags: ['seo'],
      });
      const d = unwrap(res);
      const title = d?.meta_title?.trim() || '';
      const description = d?.meta_description?.trim() || '';
      const keywords = d?.meta_keywords?.trim() || '';

      if (!title && !description && !keywords) return null;
      return { title, description, keywords };
    } catch (error) {
      logError(error, { adapter: 'getPageSeo', pageSlug });
      return null;
    }
  },

  /**
   * Points credited on registration, from Admin → Settings.
   *
   * Returns null when the value cannot be read or is zero — both mean the
   * same thing to the caller: do not advertise a figure. Zero is not "0
   * points on offer", it is how the backend turns the credit off, because
   * UpdateReferralInfo gates on the amount alone.
   *
   * Never throws. This decides whether a promotional popup appears; a
   * backend hiccup must cost the shop a popup, not a page.
   */
  async getRegistrationPoints() {
    try {
      const res = await apiFetch(endpoints.pointsSettings(), {
        revalidate: TTL.pointsSettings,
        tags: ['settings'],
      });
      const points = Number(unwrap(res)?.registration_points);
      return Number.isFinite(points) && points > 0 ? points : null;
    } catch (error) {
      logError(error, { adapter: 'getRegistrationPoints' });
      return null;
    }
  },

  /**
   * Every popup that is live right now (Admin → Popups).
   *
   * Degrades to an empty list on any failure, like getRegistrationPoints
   * above and for the same reason: a popup is an interruption the site can
   * do without, and a backend blip must never take the layout down with it.
   *
   * Rows missing a desktop image are dropped. That is the one field the
   * component cannot render without, and an image whose file was deleted
   * from disk would otherwise reach the browser as a broken frame on top of
   * every page.
   */
  async listPopups() {
    try {
      const res = await apiFetch(endpoints.popups(), {
        revalidate: TTL.popups,
        tags: ['popups'],
      });

      return asArray(unwrap(res))
        .map((raw) => ({
          id: String(raw.id ?? ''),
          title: raw.title ?? '',
          imageDesktop: raw.image_desktop || null,
          /* The backend already falls back to the desktop file, so this is
             only ever null when both are missing — and that row is dropped. */
          imageMobile: raw.image_mobile || raw.image_desktop || null,
          /* Empty string is a legitimate value: decorative artwork beside
             its own link text takes alt="". Only null becomes the title. */
          altText: typeof raw.alt_text === 'string' ? raw.alt_text : '',
          linkUrl: raw.link_url || null,
          includePaths: Array.isArray(raw.include_paths) ? raw.include_paths : [],
          excludePaths: Array.isArray(raw.exclude_paths) ? raw.exclude_paths : [],
          /* Milliseconds here; the admin field is seconds. Converted once, at
             the boundary, so nothing downstream has to remember the unit. */
          delayMs: Math.max(0, Number(raw.delay_seconds) || 0) * 1000,
          priority: Number(raw.priority) || 0,
        }))
        .filter((popup) => popup.id && popup.imageDesktop);
    } catch (error) {
      logError(error, { adapter: 'listPopups' });
      return [];
    }
  },

  async getTopTags(limit = 25) {
    const res = await apiFetch(endpoints.topTags(limit), {
      revalidate: TTL.categories,
      tags: ['tags'],
    });
    return asArray(unwrap(res))
      .map((raw) => ({
        name: raw.name || raw.name_en || '',
        productCount: Number(raw.product_count) || 0,
      }))
      .filter((tag) => tag.name);
  },

  /**
   * The symptom master — the second browse axis.
   *
   * The endpoint already excludes symptoms with no visible products and
   * orders by product count, so the most useful entries come first without
   * the frontend needing to rank them.
   */
  async getSymptoms(limit) {
    const res = await apiFetch(endpoints.symptoms(), {
      params: { limit },
      revalidate: TTL.categories,
      tags: ['symptoms'],
    });
    return asArray(unwrap(res)).map(normaliseSymptom);
  },

  /**
   * The browse groups for /symptom, each carrying its own symptoms.
   *
   * Returns [] while the backend has no groups, or none of them has a product
   * yet. That empty result is load-bearing: it is what lets /symptom fall back
   * to the flat symptom list instead of rendering an empty grid, so the
   * storefront can ship before a single symptom has been assigned.
   */
  async getSymptomGroups() {
    const res = await apiFetch(endpoints.symptomGroups(), {
      revalidate: TTL.categories,
      tags: ['symptoms', 'symptom-groups'],
    });
    return asArray(unwrap(res)).map(normaliseSymptomGroup);
  },

  /**
   * One group's products, with the group itself and its symptoms alongside.
   *
   * The endpoint returns all three in one response, so the page needs no
   * second request to draw its heading or its refinement chips. `result` is
   * the same shape every other listing produces, so ListingLayout takes it
   * without knowing where it came from.
   */
  async getSymptomGroupProducts(slug, query = {}) {
    const { page = 1, perPage } = query;

    const res = await apiFetch(endpoints.symptomGroupProducts(slug), {
      params: { page, per_page: perPage, sort: SORT_PARAM[query.sort] },
      revalidate: TTL.listing,
      tags: ['products', `symptom-group:${slug}`],
    });

    const payload = meta(res);
    if (!payload?.group) return null;

    const items = asArray(unwrap(res)).map(normaliseProductSummary);
    const paged = normalisePagination(payload.pagination, items.length);

    return {
      group: normaliseSymptomGroup(payload.group),
      symptoms: asArray(payload.symptoms).map(normaliseSymptom),
      /* `symptom` is cleared before the client-side pass: the server already
         scoped the result to this group, and leaving it set would make
         applyClientQuery filter the page again against a slug none of these
         products carry. */
      result: applyClientQuery(items, { ...query, symptom: undefined }, paged),
    };
  },

  async getSearchSuggestions(q, limit = 8) {
    if (!q) return [];
    // The parameter really is `search_by_name`. Sending anything else returns
    // the entire catalogue rather than an error, so this failed silently.
    const res = await apiFetch(endpoints.productsByName(), {
      params: { search_by_name: q },
      revalidate: 60,
    });
    return asArray(unwrap(res)).slice(0, limit).map((p) => {
      const s = normaliseProductSummary(p);
      return { slug: s.slug, name: s.name, image: s.image };
    });
  },

  async getBlogs({ page = 1, perPage = 12 } = {}) {
    const res = await apiFetch(endpoints.blogs(), {
      revalidate: TTL.content,
      tags: ['blogs'],
    });
    const rows = asArray(unwrap(res));
    return { items: rows, page, perPage, total: rows.length, totalPages: 1 };
  },

  async getBlog(id) {
    const res = await apiFetch(endpoints.blog(id), { revalidate: TTL.content });
    return unwrap(res);
  },

  async getAllProductSlugs() {
    const res = await apiFetch(endpoints.allActiveProducts(), { revalidate: TTL.content });
    return asArray(unwrap(res)).map((p) => ({
      slug: productSlug(p),
      updatedAt: p.updated_at,
    }));
  },

  /**
   * Every category slug, plus every subcategory slug — used by the sitemap and
   * by generateStaticParams. Both levels resolve to real pages, so both belong
   * here; and it is the full category set, not the homepage subset.
   */
  /**
   * Every taxonomy slug, each with the parent it belongs under.
   *
   * `parentSlug` is what lets callers build /category/{parent}/{child}; it is
   * null for a top-level category. Without it the sitemap and
   * generateStaticParams could only emit the flat form.
   */
  async getAllCategorySlugs() {
    const categories = await this.getCategories(true);
    const nested = await Promise.all(
      categories.map((c) => this.getSubcategories(c.id).catch(() => []))
    );
    return [
      ...categories.map((c) => ({ slug: c.slug, parentSlug: null })),
      ...nested.flatMap((children, i) =>
        children.map((s) => ({ slug: s.slug, parentSlug: categories[i].slug }))
      ),
    ];
  },
};

/**
 * The API filters by category and paginates, but has no parameters for
 * keyword, price band, stock or sort on this route — so those refinements are
 * applied to the returned page here.
 *
 * ⚠️ This narrows only the CURRENT page, not the full result set. It is a
 * stopgap so the existing filter UI keeps working; correct behaviour needs
 * those parameters added server-side.
 */
function applyClientQuery(items, query, paged) {
  const { q, tags, inStock, minPrice, maxPrice, sort } = query;
  let out = items;

  if (q) {
    const needle = q.toLowerCase();
    out = out.filter((p) => p.name.toLowerCase().includes(needle));
  }
  if (tags?.length) out = out.filter((p) => tags.some((t) => p.tags.includes(t)));
  if (inStock) out = out.filter((p) => p.inStock);
  if (typeof minPrice === 'number') out = out.filter((p) => p.fromPrice >= minPrice);
  if (typeof maxPrice === 'number') out = out.filter((p) => p.fromPrice <= maxPrice);

  const sorters = {
    price_asc: (a, b) => a.fromPrice - b.fromPrice,
    price_desc: (a, b) => b.fromPrice - a.fromPrice,
    rating_desc: (a, b) => b.rating.average - a.rating.average,
    popular: (a, b) => b.rating.count - a.rating.count,
    newest: (a, b) => b.id - a.id,
  };
  if (sorters[sort]) out = [...out].sort(sorters[sort]);

  return { items: out, ...paged };
}
