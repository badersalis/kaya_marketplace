import { ProviderAdapter, ExtractedProduct } from "./types";
import { fetchHtml } from "./fetchHtml";
import { parseOpenGraph } from "./parseOpenGraph";

const TEMU_DOMAINS = ["temu.com"];

/**
 * Temu has no public buyer/product API, so this is best-effort scraping of
 * the product page's OpenGraph tags. Falls back to {} on any failure —
 * extraction never blocks order creation (see ProviderRegistry.resolve).
 *
 * No search() here: Temu's search results page ships as an empty shell
 * hydrated client-side by JS (verified — zero <img> tags or product data in
 * the raw HTML), so there's nothing to scrape without running a headless
 * browser. Not implemented for now; admins fall back to pasting a link.
 */
export const temuAdapter: ProviderAdapter = {
  slug: "temu",
  matchesUrl(url: string): boolean {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return TEMU_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
    } catch {
      return false;
    }
  },
  async extractProduct(url: string): Promise<ExtractedProduct> {
    const html = await fetchHtml(url);
    if (!html) return {};
    try {
      const product = parseOpenGraph(html);
      return { ...product, currency: product.currency ?? "USD" };
    } catch {
      return {};
    }
  },
};
