import { env } from "../../config/env";
import { GeoProvider } from "./types";
import { staticGeoProvider } from "./staticProvider";
import { ipapiGeoProvider } from "./ipapiProvider";

export const geoProvider: GeoProvider = env.GEO_PROVIDER === "ipapi" ? ipapiGeoProvider : staticGeoProvider;

export * from "./types";
