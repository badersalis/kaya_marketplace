import { ProviderAdapter, ExtractedProduct } from "./types";
import { fetchHtml } from "./fetchHtml";
import { parseOpenGraph } from "./parseOpenGraph";

/**
 * Fallback adapter used when no specific store adapter matches a URL.
 * Reads OpenGraph / Twitter-card meta tags, which most product pages expose.
 */
export const genericOpenGraphAdapter: ProviderAdapter = {
  slug: "generic",
  matchesUrl(): boolean {
    return true;
  },
  async extractProduct(url: string): Promise<ExtractedProduct> {
    const html = await fetchHtml(url);
    if (!html) return {};
    try {
      return parseOpenGraph(html);
    } catch {
      return {};
    }
  },
};
