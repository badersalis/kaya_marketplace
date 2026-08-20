import { env } from "../../config/env";
import { GeoLocation, GeoProvider } from "./types";

/**
 * Zero-credential fallback: always resolves to the seeded default hub's
 * location, so onboarding has something sensible to suggest in dev/offline.
 */
export const staticGeoProvider: GeoProvider = {
  async resolveFromIp(): Promise<GeoLocation | null> {
    return {
      country: env.SEED_HUB_COUNTRY,
      city: env.SEED_HUB_CITY,
      lat: env.SEED_HUB_LAT,
      lng: env.SEED_HUB_LNG,
    };
  },
};
