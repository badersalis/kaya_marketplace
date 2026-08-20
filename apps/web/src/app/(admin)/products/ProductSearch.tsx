"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { productPlaceholder } from "@/lib/placeholderImage";
import {
  Provider,
  ProductSearchResponse,
  SearchFacets,
  SearchFilters,
  SearchPagination,
  SearchResultItem,
} from "@/lib/types";

// Sent when the admin hasn't typed anything yet, so the page shows a general
// catalog listing instead of an empty state.
const DEFAULT_QUERY = " ";

const EMPTY_FACETS: SearchFacets = { categories: [], brands: [], priceRange: null };
const EMPTY_PAGINATION: SearchPagination = { page: 1, totalResults: null, hasMore: false };

export function ProductSearch({ providers }: { providers: Provider[] }) {
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [facets, setFacets] = useState<SearchFacets>(EMPTY_FACETS);
  const [pagination, setPagination] = useState<SearchPagination>(EMPTY_PAGINATION);
  const [supported, setSupported] = useState(true);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservingKey, setReservingKey] = useState<string | null>(null);
  const [reservedKeys, setReservedKeys] = useState<Set<string>>(new Set());

  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const selectedProvider = providers.find((p) => p.id === providerId) ?? null;

  async function runSearch(providerToUse: Provider | null, q: string, filters: SearchFilters) {
    if (!providerToUse) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ provider: providerToUse.slug, q });
      if (filters.category) params.set("category", filters.category);
      if (filters.brand) params.set("brand", filters.brand);
      if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
      if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
      if (filters.page && filters.page > 1) params.set("page", String(filters.page));

      const result = await api.get<ProductSearchResponse>(`/providers/search?${params.toString()}`);
      setResults(result.results);
      setFacets(result.facets ?? EMPTY_FACETS);
      setPagination(result.pagination ?? EMPTY_PAGINATION);
      setSupported(result.supported);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "La recherche a échoué");
    } finally {
      setLoading(false);
    }
  }

  function currentFilters(): SearchFilters {
    return {
      category: category || undefined,
      brand: brand || undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
    };
  }

  // Show a general listing as soon as a supported store is selected, before the admin types anything.
  useEffect(() => {
    setResults([]);
    setSearched(false);
    setCategory("");
    setBrand("");
    setPriceMin("");
    setPriceMax("");
    runSearch(selectedProvider, query.trim() || DEFAULT_QUERY, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    runSearch(selectedProvider, query.trim() || DEFAULT_QUERY, currentFilters());
  }

  function toggleCategory(value: string) {
    const next = category === value ? "" : value;
    setCategory(next);
    // Category and brand are mutually exclusive on Jumia (both are URL path segments).
    setBrand("");
    runSearch(selectedProvider, query.trim() || DEFAULT_QUERY, { ...currentFilters(), category: next, brand: undefined, page: 1 });
  }

  function handleBrandChange(value: string) {
    setBrand(value);
    setCategory("");
    runSearch(selectedProvider, query.trim() || DEFAULT_QUERY, {
      ...currentFilters(),
      brand: value || undefined,
      category: undefined,
      page: 1,
    });
  }

  function applyPriceRange() {
    runSearch(selectedProvider, query.trim() || DEFAULT_QUERY, { ...currentFilters(), page: 1 });
  }

  function goToPage(page: number) {
    runSearch(selectedProvider, query.trim() || DEFAULT_QUERY, { ...currentFilters(), page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleReserve(item: SearchResultItem) {
    const key = item.externalId ?? item.url;
    setReservingKey(key);
    setError(null);
    try {
      await api.post("/reservations", {
        providerId: selectedProvider?.id,
        externalId: item.externalId,
        url: item.url,
        title: item.title,
        imageUrl: item.imageUrl,
        price: item.price,
        currency: item.currency,
      });
      setReservedKeys((prev) => new Set(prev).add(key));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de réserver ce produit");
    } finally {
      setReservingKey(null);
    }
  }

  const hasFilters = facets.categories.length > 0 || facets.brands.length > 0 || facets.priceRange != null;

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-abidjan-600 via-abidjan-500 to-niamey-500 p-6 text-white shadow-theme-lg sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Sourcing produits</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Rechercher &amp; réserver</h1>
        <p className="mt-1.5 max-w-xl text-sm text-white/80">
          Parcourez une boutique ou cherchez un produit, puis réservez-le pour le retrouver dans{" "}
          <Link href="/reservations" className="underline">
            Réservations
          </Link>
          .
        </p>
      </div>

      <div className="mb-6">
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Boutique
        </p>
        <div className="flex flex-wrap gap-2.5">
          {providers.map((p) => {
            const active = p.id === providerId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProviderId(p.id)}
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? "border-abidjan-500 bg-abidjan-50 text-abidjan-700 ring-2 ring-abidjan-500/20 dark:border-abidjan-400 dark:bg-abidjan-500/10 dark:text-abidjan-400"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                {p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logoUrl} alt="" className="h-5 w-5 object-contain" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-[10px] font-semibold text-gray-400 dark:bg-white/10">
                    {p.name.slice(0, 1)}
                  </span>
                )}
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Rechercher chez ${selectedProvider?.name ?? "une boutique"}...`}
            className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-abidjan-400 focus:outline-hidden focus:ring-3 focus:ring-abidjan-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !selectedProvider}
          className="rounded-xl bg-abidjan-600 px-6 text-sm font-medium text-white shadow-theme-xs transition hover:bg-abidjan-700 disabled:opacity-60"
        >
          {loading ? "Recherche..." : "Rechercher"}
        </button>
      </form>

      {hasFilters && (
        <div className="mb-8 space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          {facets.categories.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Catégorie</p>
              <div className="flex flex-wrap gap-1.5">
                {facets.categories.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => toggleCategory(c.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      category === c.value
                        ? "border-abidjan-500 bg-abidjan-600 text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-4">
            {facets.brands.length > 0 && (
              <label className="text-sm">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">Marque</span>
                <select
                  value={brand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="">Toutes les marques</option>
                  {facets.brands.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {facets.priceRange && (
              <div className="text-sm">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Prix (FCFA, {facets.priceRange.min.toLocaleString("fr-FR")}–{facets.priceRange.max.toLocaleString("fr-FR")})
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={facets.priceRange.min}
                    max={facets.priceRange.max}
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="Min"
                    className="h-9 w-24 rounded-lg border border-gray-300 bg-transparent px-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                  <span className="text-gray-400">–</span>
                  <input
                    type="number"
                    min={facets.priceRange.min}
                    max={facets.priceRange.max}
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="Max"
                    className="h-9 w-24 rounded-lg border border-gray-300 bg-transparent px-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                  <button
                    type="button"
                    onClick={applyPriceRange}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </p>
      )}

      {searched && !supported && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-white/[0.03]">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Recherche indisponible pour {selectedProvider?.name}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-gray-500 dark:text-gray-400">
            {selectedProvider?.notes ?? "Cette boutique ne propose pas de recherche par mot-clé pour le moment."}
          </p>
          <Link
            href="/orders"
            className="mt-3 inline-block text-xs font-medium text-abidjan-600 underline dark:text-abidjan-400"
          >
            Coller un lien produit dans une nouvelle commande
          </Link>
        </div>
      )}

      {searched && supported && results.length === 0 && !loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Aucun résultat pour cette recherche.</p>
      )}

      {results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((item) => {
            const key = item.externalId ?? item.url;
            const isReserved = reservedKeys.has(key);
            return (
              <div
                key={key}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs transition hover:-translate-y-0.5 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-gray-50 dark:bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl || productPlaceholder(key)}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {selectedProvider?.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedProvider.logoUrl}
                      alt=""
                      className="absolute left-2 top-2 h-6 w-6 rounded-md bg-white/90 object-contain p-1 shadow-sm"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <p className="line-clamp-2 flex-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {item.title ?? "Produit sans titre"}
                  </p>
                  {item.price != null && (
                    <p className="mt-2 text-base font-semibold text-abidjan-700 dark:text-abidjan-400">
                      {item.price.toLocaleString("fr-FR")}{" "}
                      <span className="text-xs font-normal text-gray-400">{item.currency} · prix source, à titre indicatif</span>
                    </p>
                  )}
                  <button
                    onClick={() => handleReserve(item)}
                    disabled={reservingKey === key || isReserved}
                    className={`mt-3 w-full rounded-lg py-2 text-xs font-semibold transition disabled:opacity-70 ${
                      isReserved
                        ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                        : "bg-abidjan-600 text-white hover:bg-abidjan-700"
                    }`}
                  >
                    {isReserved ? "Réservé ✓" : reservingKey === key ? "Réservation..." : "Réserver"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results.length > 0 && (pagination.page > 1 || pagination.hasMore) && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={loading || pagination.page <= 1}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            ← Précédent
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Page {pagination.page}
            {pagination.totalResults != null && ` · ${pagination.totalResults.toLocaleString("fr-FR")} résultats`}
          </span>
          <button
            type="button"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={loading || !pagination.hasMore}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
