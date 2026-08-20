import {
  ProviderAdapter,
  ExtractedProduct,
  SearchFacets,
  SearchFilters,
  SearchResultItem,
  SearchPagination,
  EMPTY_FACETS,
  emptyPagination,
} from "./adapters/types";
import { jumiaAdapter } from "./adapters/jumia";
import { temuAdapter } from "./adapters/temu";
import { amazonAdapter } from "./adapters/amazon";
import { genericOpenGraphAdapter } from "./adapters/generic";
import { env } from "../../config/env";
import { redis } from "../../lib/redis";
import { prisma } from "../../lib/prisma";

// Order matters: specific adapters first, generic fallback last.
const adapters: ProviderAdapter[] = [jumiaAdapter, temuAdapter, amazonAdapter];

function pickAdapter(url: string): ProviderAdapter {
  return adapters.find((a) => a.matchesUrl(url)) ?? genericOpenGraphAdapter;
}

export interface ResolveResult {
  providerId: string | null;
  providerSlug: string | null;
  product: ExtractedProduct;
}

const CACHE_TTL_SECONDS = 60 * 10;

async function findProviderForUrl(url: string) {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }

  const providers = await prisma.provider.findMany({ where: { isActive: true } });
  return (
    providers.find((p) => p.domains.some((d) => host === d || host.endsWith(`.${d}`))) ?? null
  );
}

export async function resolve(url: string): Promise<ResolveResult> {
  const provider = await findProviderForUrl(url);

  if (!env.LINK_PREVIEW_ENABLED) {
    return { providerId: provider?.id ?? null, providerSlug: provider?.slug ?? null, product: {} };
  }

  const cacheKey = `link-preview:${url}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return {
        providerId: provider?.id ?? null,
        providerSlug: provider?.slug ?? null,
        product: JSON.parse(cached),
      };
    }
  } catch {
    // cache is best-effort; ignore failures and fall through to a live fetch
  }

  const adapter = pickAdapter(url);
  let product: ExtractedProduct = {};
  try {
    product = await adapter.extractProduct(url);
  } catch {
    product = {};
  }

  try {
    await redis.set(cacheKey, JSON.stringify(product), "EX", CACHE_TTL_SECONDS);
  } catch {
    // best-effort cache write
  }

  return { providerId: provider?.id ?? null, providerSlug: provider?.slug ?? null, product };
}

export interface SearchResult {
  supported: boolean;
  results: SearchResultItem[];
  facets: SearchFacets;
  pagination: SearchPagination;
}

const SEARCH_CACHE_TTL_SECONDS = 60 * 5;

function facetKeyPart(filters?: SearchFilters): string {
  if (!filters) return "";
  return [
    filters.category ?? "",
    filters.brand ?? "",
    filters.priceMin ?? "",
    filters.priceMax ?? "",
    filters.page ?? 1,
  ].join(":");
}

export async function search(providerSlug: string, query: string, filters?: SearchFilters): Promise<SearchResult> {
  const page = filters?.page && filters.page > 0 ? filters.page : 1;
  const adapter = adapters.find((a) => a.slug === providerSlug);
  if (!adapter?.search) {
    return { supported: false, results: [], facets: EMPTY_FACETS, pagination: emptyPagination(page) };
  }

  if (!env.LINK_PREVIEW_ENABLED) {
    return { supported: true, results: [], facets: EMPTY_FACETS, pagination: emptyPagination(page) };
  }

  const cacheKey = `product-search:${providerSlug}:${query.trim().toLowerCase()}:${facetKeyPart(filters)}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return { supported: true, ...JSON.parse(cached) };
  } catch {
    // cache is best-effort; ignore failures and fall through to a live fetch
  }

  let outcome = { results: [] as SearchResultItem[], facets: EMPTY_FACETS, pagination: emptyPagination(page) };
  try {
    outcome = await adapter.search(query, filters);
  } catch {
    outcome = { results: [], facets: EMPTY_FACETS, pagination: emptyPagination(page) };
  }

  // An empty result is far more likely a transient timeout/block than a
  // genuine zero-match search (especially for the heavier category/brand
  // pages) — caching it would keep poisoning every request for the full TTL
  // even after the underlying hiccup clears up, so only cache real hits.
  if (outcome.results.length > 0) {
    try {
      await redis.set(cacheKey, JSON.stringify(outcome), "EX", SEARCH_CACHE_TTL_SECONDS);
    } catch {
      // best-effort cache write
    }
  }

  return { supported: true, ...outcome };
}
