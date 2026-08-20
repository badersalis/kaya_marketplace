import { ProviderAdapter, ExtractedProduct } from "./types";
import { fetchHtml } from "./fetchHtml";
import { parseOpenGraph } from "./parseOpenGraph";

const AMAZON_DOMAINS = ["amazon.com", "amazon.fr", "amazon.co.uk"];

/**
 * Amazon has no public buyer/product API and actively blocks non-browser
 * requests — its edge returns a 503 page reading "To discuss automated
 * access to Amazon data please contact api-services-support@amazon.com" for
 * both product and search pages (verified live). extractProduct is kept for
 * interface consistency and will usually resolve to {}; that's fine, link
 * preview is best-effort and never blocks order creation.
 *
 * No search() here: unlike Jumia, this isn't a "the markup is just static
 * HTML" gap — Amazon is explicitly telling automated clients to use their
 * official API instead, so building around the block would mean evading it.
 * Use the Product Advertising API if real Amazon catalog search is needed.
 */
export const amazonAdapter: ProviderAdapter = {
  slug: "amazon",
  matchesUrl(url: string): boolean {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return AMAZON_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
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
