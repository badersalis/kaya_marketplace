import * as cheerio from "cheerio";
import { ExtractedProduct } from "./types";

function parsePrice(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(/,(?=\d{3}\b)/g, "");
  const normalized = cleaned.replace(",", ".");
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : undefined;
}

export function parseOpenGraph(html: string): ExtractedProduct {
  const $ = cheerio.load(html);

  const meta = (name: string) =>
    $(`meta[property="${name}"]`).attr("content") ?? $(`meta[name="${name}"]`).attr("content");

  const title = meta("og:title") ?? meta("twitter:title") ?? $("title").first().text().trim();
  const imageUrl = meta("og:image") ?? meta("twitter:image");
  const currency = meta("og:price:currency") ?? meta("product:price:currency");
  const price = parsePrice(meta("og:price:amount") ?? meta("product:price:amount"));

  return {
    title: title || undefined,
    imageUrl: imageUrl || undefined,
    price,
    currency: currency || undefined,
  };
}
