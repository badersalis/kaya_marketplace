import * as cheerio from "cheerio";
import {
  ProviderAdapter,
  ExtractedProduct,
  SearchFacets,
  SearchFilters,
  SearchOutcome,
  SearchResultItem,
  emptyPagination,
} from "./types";
import { fetchHtml } from "./fetchHtml";
import { parseOpenGraph } from "./parseOpenGraph";
import { env } from "../../../config/env";

const JUMIA_DOMAINS = ["jumia.ci", "jumia.com"];
const JUMIA_ORIGIN = "https://www.jumia.ci";
const MAX_SEARCH_RESULTS = 40; // matches Jumia's own per-page count
const MAX_BRAND_FACETS = 40;

/** Brand facet values are "{numericId}-{slug}" (e.g. "9-apple"); the store slug alone is the URL path segment. */
function brandSlugFromFacetValue(value: string): string {
  return value.replace(/^\d+-/, "");
}

function parseFcfaPrice(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (!digitsOnly) return undefined;
  const value = Number(digitsOnly);
  return Number.isFinite(value) ? value : undefined;
}

/** Category links carry the slug in their href, e.g. "/telephone-tablette/?q=...#catalog-listing". */
function categorySlugFromHref(href: string): string | null {
  const match = href.match(/^\/([a-z0-9-]+)\/\?/i);
  return match ? match[1] : null;
}

function buildSearchUrl(query: string, filters?: SearchFilters): string {
  // Both category and brand are URL path segments on Jumia ("/telephone-tablette/?q=..." or
  // "/apple/?q=..."), not query params — the two can't be combined this way, so brand (more
  // specific) wins if both are set.
  let base: string;
  if (filters?.brand) {
    base = `${JUMIA_ORIGIN}/${brandSlugFromFacetValue(filters.brand)}/`;
  } else if (filters?.category) {
    base = `${JUMIA_ORIGIN}/${filters.category}/`;
  } else {
    base = `${JUMIA_ORIGIN}/catalog/`;
  }

  const params = new URLSearchParams({ q: query });
  if (filters?.priceMin != null || filters?.priceMax != null) {
    params.set("price", `${filters?.priceMin ?? 0}-${filters?.priceMax ?? 99999999}`);
  }
  if (filters?.page && filters.page > 1) params.set("page", String(filters.page));
  return `${base}?${params.toString()}`;
}

/** e.g. "(54416 résultats)" in the results-count header. */
function parseTotalResults(html: string): number | null {
  const match = html.match(/\(?\s*([\d\s .,]+)\s*résultats?\s*\)?/i);
  if (!match) return null;
  const digits = match[1].replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

function parseFacets($: cheerio.CheerioAPI): SearchFacets {
  const categories: SearchFacets["categories"] = [];
  $('a[data-eventname="filters_apply"][data-eventaction="category"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    const label = $el.text().trim();
    const slug = href ? categorySlugFromHref(href) : null;
    if (slug && label) categories.push({ value: slug, label });
  });

  const brands: SearchFacets["brands"] = [];
  $('input[name^="brand["]').each((_, el) => {
    if (brands.length >= MAX_BRAND_FACETS) return;
    const $el = $(el);
    const value = $el.attr("value");
    const label = $el.next("label").text().trim() || $el.closest(".fi-w").find("label").first().text().trim();
    if (value && label) brands.push({ value, label });
  });

  const minAttr = $('input[name="min"]').attr("min");
  const maxAttr = $('input[name="max"]').attr("max");
  const priceRange =
    minAttr && maxAttr ? { min: Number(minAttr), max: Number(maxAttr) } : null;

  return { categories, brands, priceRange };
}

/**
 * Jumia has no public buyer/product API, so this is best-effort scraping of
 * the product page's OpenGraph tags. Falls back to {} on any failure —
 * extraction never blocks order creation (see ProviderRegistry.resolve).
 */
export const jumiaAdapter: ProviderAdapter = {
  slug: "jumia",
  matchesUrl(url: string): boolean {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return JUMIA_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
    } catch {
      return false;
    }
  },
  async extractProduct(url: string): Promise<ExtractedProduct> {
    const html = await fetchHtml(url);
    if (!html) return {};
    try {
      const product = parseOpenGraph(html);
      return { ...product, currency: product.currency ?? "XOF" };
    } catch {
      return {};
    }
  },
  /**
   * Jumia's search results page is server-rendered (each hit is an
   * <article class="prd">), so it can be scraped the same way as a single
   * product page. Category is a URL path segment ("/telephone-tablette/?q=...");
   * brand and price are query params ("brand=9-apple", "price=min-max") — both
   * verified against live markup, including the facet lists themselves, which
   * we scrape back out so the UI can offer real, in-range filter options
   * instead of guessed ones. Selectors will need updating if Jumia changes
   * their catalog page template.
   */
  async search(query: string, filters?: SearchFilters): Promise<SearchOutcome> {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const html = await fetchHtml(buildSearchUrl(query, filters), env.SEARCH_TIMEOUT_MS);
    if (!html) return { results: [], facets: { categories: [], brands: [], priceRange: null }, pagination: emptyPagination(page) };
    try {
      const $ = cheerio.load(html);
      const results: SearchResultItem[] = [];

      $("article.prd").each((_, el) => {
        if (results.length >= MAX_SEARCH_RESULTS) return;
        const $el = $(el);
        const link = $el.find("a.core").attr("href");
        if (!link) return;

        // The regular /catalog/ search uses <h3 class="name">; category- and
        // brand-scoped pages ("/telephone-tablette/…", "/apple/…") render the
        // same info as a plain <div class="name"> instead — data-gtm-name is
        // present on both and is the most reliable fallback.
        const title =
          $el.find(".name").first().text().trim() || $el.find("a.core").attr("data-gtm-name") || undefined;
        const price = parseFcfaPrice($el.find(".prc").first().text());
        const image = $el.find("img").attr("data-src") || $el.find("img").attr("src");
        const externalId = $el.find("a.core").attr("data-gtm-id") || undefined;

        results.push({
          externalId,
          url: new URL(link, JUMIA_ORIGIN).toString(),
          title,
          imageUrl: image && !image.startsWith("data:") ? image : undefined,
          price,
          currency: "XOF",
        });
      });

      const totalResults = parseTotalResults(html);
      const hasNextLink = $('link[rel="next"]').length > 0;
      const hasMore = hasNextLink || (totalResults != null && page * MAX_SEARCH_RESULTS < totalResults);

      return { results, facets: parseFacets($), pagination: { page, totalResults, hasMore } };
    } catch {
      return { results: [], facets: { categories: [], brands: [], priceRange: null }, pagination: emptyPagination(page) };
    }
  },
};
