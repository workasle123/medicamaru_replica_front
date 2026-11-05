/**
 * Medicamaru — backend endpoint map.
 *
 * Centralised so a backend rename is a one-line change here rather than a
 * find-and-replace across the app.
 *
 * NOTE: These paths are the CONTRACT WE ARE PROPOSING, not paths that exist
 * yet. The Phase 0 audit confirmed the source platform has no read API at
 * all — only camelCase mutation helpers (addProductToCart, placeOrder, …).
 * Until the backend replica lands, services resolve against the mock adapter.
 *
 * @see docs/PHASE-0-AUDIT.md §2.2
 */

/**
 * Real endpoints, verified live against https://adminpanel.medicamaru.com.
 *
 * These are the backend's actual routes (routes/webApi.php, mounted at the
 * `/api` prefix) — NOT the `/api/storefront/v1/*` contract proposed in
 * Phase 0, which turned out to be unnecessary because a full storefront API
 * already existed. See docs/PHASE-0.5-BACKEND-AUDIT.md.
 *
 * ⚠️ Two routes return 500 on the live server and are deliberately unused:
 *      /home/CategoriesWithProducts        → "Class Log not found"
 *      /home/products-by-category-slug/…   → renders an HTML error page
 *    `categoryProducts?category_id=` is the working equivalent.
 */
const V1 = '/api';

export const endpoints = {
  // --- Catalogue (read) ------------------------------------------------
  /**
   * Without an argument this returns only categories flagged
   * `category_home_page`, which is 8 of the 11 active ones. Pass `true` for
   * the full set — the route's `{all?}` segment switches that filter off.
   * Use the full set anywhere completeness matters (the category index, the
   * filter sidebar, the sitemap); the flagged subset is for the homepage.
   */
  categories: (includeAll = false) => `${V1}/home/categories${includeAll ? '/1' : ''}`,
  subcategories: (categoryId) => `${V1}/home/get-subcategories/${categoryId}`,
  category: (categoryId) => `${V1}/home/get-category/${categoryId}`,
  subcategory: (subcategoryId) => `${V1}/home/get-sub-category/${subcategoryId}`,

  /** Richest product list: includes variants, ratings and per-unit pricing. */
  categoryProducts: () => `${V1}/home/categoryProducts`,
  subcategoryProducts: (subcategoryId) => `${V1}/home/get-products/${subcategoryId}`,

  rankedProducts: () => `${V1}/home/rankedProducts`,
  featuredProducts: () => `${V1}/home/featuredProducts`,
  supplementProducts: () => `${V1}/home/supplimentProducts`,
  allActiveProducts: () => `${V1}/home/get-all-active-products`,

  productsByName: () => `${V1}/home/productsByName`,
  productDetails: () => `${V1}/product-details/productDetails`,
  productReviews: (productId) => `${V1}/product/${productId}/reviews`,
  /* Write side of the same feature. One endpoint for both posting and
     editing: the backend upserts on (customer, product), so a second
     submission replaces the first rather than adding a duplicate. Takes
     multipart, because a review may carry a photo. */
  submitReview: () => `${V1}/product/review`,
  /* Whether this customer has ever ordered this product — what gates the
     review form. Takes customer_id (the CUS-style string) and product_id. */
  hasPurchasedProduct: () => `${V1}/orders/hasPurchasedProduct`,

  // --- Banners (admin-managed, schedule applied server-side) ------------
  banners: () => `${V1}/home/banners`,
  carousel: (forCampaign) => `${V1}/home/carousel${forCampaign ? `/${forCampaign}` : ''}`,
  leftBanners: (forCampaign) => `${V1}/home/left${forCampaign ? `/${forCampaign}` : ''}`,
  rightBanners: (forCampaign) => `${V1}/home/right${forCampaign ? `/${forCampaign}` : ''}`,
  /** The strip beside the homepage headline — the LINE promotion slot. */
  homepageLineBanners: (forCampaign) =>
    `${V1}/home/homepage-line${forCampaign ? `/${forCampaign}` : ''}`,
  /** All category banners in one call; pass an id for a single category. */
  categoryBanners: (categoryId) =>
    `${V1}/home/category-banners${categoryId ? `/${categoryId}` : ''}`,
  /* The campaign page's feed. The path segment is not optional in the way it
     looks: WITHOUT it the endpoint returns something else entirely — the
     offers that carry a coupon, a discount type and a minimum spend, which is
     a checkout concern. WITH it, the banners flagged 「Show on Campaign Page」
     and currently inside their date window. Only the second is a campaign
     list, so campaignOffers always passes the flag. */
  campaignOffers: () => `${V1}/home/alloffers/1`,

  // --- Symptoms (second browse axis) -----------------------------------
  /** Most-used product tags, ordered by live product count. */
  topTags: (limit = 25) => `${V1}/home/tags/${limit}`,
  symptoms: () => `${V1}/home/symptoms`,
  symptomProducts: (slug) => `${V1}/home/symptom-products/${encodeURIComponent(slug)}`,
  /* The browse layer above the symptoms. `symptomGroups` returns every group
     with its symptoms nested; `symptomGroupProducts` returns one group's
     products in the same envelope as symptomProducts. */
  symptomGroups: () => `${V1}/home/symptom-groups`,
  symptomGroupProducts: (slug) => `${V1}/home/symptom-group-products/${encodeURIComponent(slug)}`,
  offers: () => `${V1}/home/offers`,

  // --- Content ---------------------------------------------------------
  articles: () => `${V1}/articles/list`,
  article: (id) => `${V1}/articles/details/${id}`,
  /** FAQs are scoped to a CMS page — `page_slug` is required, not optional. */
  faqs: () => `${V1}/faqs/list`,
  /** The /faq page: active headings (Admin → FAQ Groups), each with its FAQs, in order. */
  faqGroups: () => `${V1}/faqs/groups`,
  notices: () => `${V1}/notices/list`,
  cms: (slug) => `${V1}/cms/${encodeURIComponent(slug)}`,

  /* --- SEO ---------------------------------------------------------------
     Meta titles/descriptions authored in the admin panel. These return a bare
     `{status, data:{meta_title, meta_description, meta_keywords}}` — NOT the
     usual `{message, code, results}` envelope, so the shared unwrap does not
     apply.
     

     categorySeo takes the SLUG, not the id: /category-seo/ed returns the row,
     /category-seo/70 returns empty strings. */
  seoMeta: (pageSlug) => `${V1}/seo-meta?page_slug=${encodeURIComponent(pageSlug)}`,
  productSeo: (productId) => `${V1}/product-seo/${productId}`,
  categorySeo: (slug) => `${V1}/category-seo/${slug}`,
  subcategorySeo: (slug) => `${V1}/sub-category-seo/${slug}`,

  // --- Cart (all POST) --------------------------------------------------
  cart: () => `${V1}/cart/listProducts`,
  cartAdd: () => `${V1}/cart/addProduct`,
  cartUpdate: (id, qty) => `${V1}/cart/updateQuantity/${id}/${qty}`,
  cartRemove: (id) => `${V1}/cart/removeProduct/${id}`,
  cartCoupon: () => `${V1}/cart/applyCoupons`,
  /* Which coupons this customer has already spent. The campaign list is a
     public endpoint and cannot know who is reading it, so the picker asks
     separately and drops what it is told. */
  redeemedCoupons: () => `${V1}/cart/redeemedCoupons`,
  cartPoints: () => `${V1}/update-point-discounts`,
  cartDeliveryType: () => `${V1}/update-cart-delivery-type`,

  // --- Checkout & orders ------------------------------------------------
  placeOrder: () => `${V1}/checkout/placeOrder`,
  orders: () => `${V1}/orders/allOrderList`,

  /* The points wallet: every credit and debit with its reason, plus the
     balance. Behind auth:sanctum despite the /home/ prefix — it reads
     request()->user(). It has existed since the wallet was built and nothing
     called it, which is why the account page showed 0. */
  loyaltyPoints: () => `${V1}/home/loyalty_points`,

  /* The points values the shop advertises, from Admin → Settings. Public and
     unauthenticated — what quotes it is shown to visitors who have no account
     yet. Whitelisted server-side; it is not the whole settings table. */
  pointsSettings: () => `${V1}/home/points-settings`,

  /* Admin → Popups: every popup that is live right now. Public for the same
     reason as pointsSettings — what it feeds is shown to signed-out visitors.
     Returns the whole live set, not a per-path answer: see getPopups in the
     backend for why the matching happens on this side. */
  popups: () => `${V1}/home/popups`,
  order: (orderId, customerId) => `${V1}/orders/details/${orderId}/${customerId}`,
  orderInvoice: (orderId, customerId) => `${V1}/orders/invoice-details/${orderId}/${customerId}`,

  // --- Account ----------------------------------------------------------
  login: () => `${V1}/customer/login`,
  register: () => `${V1}/customer/register`,
  /** Finishes a registration for an email with guest orders, from the emailed link. */
  registerConfirm: () => `${V1}/customer/register/confirm`,
  logout: () => `${V1}/customer/logout`,
  forgotPassword: () => `${V1}/customer/forgot-password`,
  resetPassword: () => `${V1}/customer/reset-password`,
  profile: () => `${V1}/customer`,
  updateProfile: () => `${V1}/customer/update`,

  /* Email verification. Public, like the password-reset pair: the customer
     cannot be signed in yet, which is the point of them. */
  verifyEmail: () => `${V1}/customer/verify-email`,
  resendVerification: () => `${V1}/customer/resend-verification`,
  changePassword: () => `${V1}/customer/change-password`,

  /* The customer's own referral code, plus who they have referred and who
     referred them. The response also carries a `referral_link`, which is
     built with Laravel's url() and therefore points at the ADMIN host — the
     storefront builds its own and ignores that field. */
  referrals: () => `${V1}/customer/my-referrals`,

  /* /getcustomerAddress does not exist — it 404s. The real route is
     GET /api/addresses (AddressController@index). */
  addresses: () => `${V1}/addresses`,
  addAddress: () => `${V1}/customerAddAddress`,
  editAddress: (id) => `${V1}/customerEditAddress/${id}`,
  deleteAddress: (id) => `${V1}/customerDelAddress/${id}`,

  wishlist: () => `${V1}/wishlist/products`,
  /* Add and remove take BOTH ids as path segments and sit behind
     auth:sanctum — the customer comes from the bearer token, not the body. */
  wishlistItem: (productId, variantId) => `${V1}/products/${productId}/${variantId}/wishlist`,
  wishlistToggle: (productId, variantId) => `${V1}/products/${productId}/${variantId}/wishlist`,

  // Articles are the CMS's blog equivalent.
  blogs: () => `${V1}/articles/list`,
  blog: (id) => `${V1}/articles/details/${id}`,

  contact: () => `${V1}/contact`,

  /* CMS page metadata, authored in Admin → SEO Pages. Keyed on
     `pages.page_slug`, which is the admin's own naming and does NOT match the
     storefront's routes — see CMS_PAGE_SLUG in lib/seo.js for the mapping. */
  seoMeta: (pageSlug) => `${V1}/seo-meta?page_slug=${encodeURIComponent(pageSlug)}`,
  subscribe: () => `${V1}/subscribe`,
  sitemap: () => `${V1}/create-sitemap`,
};
