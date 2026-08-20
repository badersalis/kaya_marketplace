import { env } from "../../../config/env";

const USER_AGENT =
  "Mozilla/5.0 (compatible; KayaLinkPreview/1.0; +https://kaya.app) AppleWebKit/537.36";

export async function fetchHtml(url: string, timeoutMs: number = env.LINK_PREVIEW_TIMEOUT_MS): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
