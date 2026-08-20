export interface GeoLocation {
  country: string;
  city: string;
  lat: number;
  lng: number;
}

export interface GeoProvider {
  resolveFromIp(ip: string): Promise<GeoLocation | null>;
}
