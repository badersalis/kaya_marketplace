export interface ExtractedProduct {
  title?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
}

export interface SearchResultItem extends ExtractedProduct {
  externalId?: string;
  url: string;
}

export interface SearchFacetOption {
  value: string;
  label: string;
}

export interface SearchFacets {
  categories: SearchFacetOption[];
  brands: SearchFacetOption[];
  priceRange: { min: number; max: number } | null;
}

export interface SearchFilters {
  /** Category slug, as returned in SearchFacets.categories[].value */
  category?: string;
  /** Brand id, as returned in SearchFacets.brands[].value */
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  /** 1-based. Defaults to 1. */
  page?: number;
}

export interface SearchPagination {
  page: number;
  totalResults: number | null;
  hasMore: boolean;
}

export interface SearchOutcome {
  results: SearchResultItem[];
  facets: SearchFacets;
  pagination: SearchPagination;
}

export const EMPTY_FACETS: SearchFacets = { categories: [], brands: [], priceRange: null };
export const emptyPagination = (page: number): SearchPagination => ({ page, totalResults: null, hasMore: false });

export interface ProviderAdapter {
  slug: string;
  matchesUrl(url: string): boolean;
  extractProduct(url: string): Promise<ExtractedProduct>;
  /** Keyword catalog search. Omitted entirely for stores with no scrapable search endpoint. */
  search?(query: string, filters?: SearchFilters): Promise<SearchOutcome>;
}
