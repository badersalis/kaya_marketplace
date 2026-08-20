import { GeoLocation, GeoProvider } from "./types";

/**
 * Uses ipapi.co's free IP-geolocation lookup. Best-effort: any failure
 * (timeout, rate limit, private/local IP) resolves to null so onboarding
 * falls back to manual hub selection rather than blocking.
 */
export const ipapiGeoProvider: GeoProvider = {
  async resolveFromIp(ip: string): Promise<GeoLocation | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        error?: boolean;
        latitude?: number;
        longitude?: number;
        country_name?: string;
        city?: string;
      };
      if (
        data.error ||
        typeof data.latitude !== "number" ||
        typeof data.longitude !== "number" ||
        !data.country_name ||
        !data.city
      ) {
        return null;
      }
      return {
        country: data.country_name,
        city: data.city,
        lat: data.latitude,
        lng: data.longitude,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  },
};
