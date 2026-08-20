export type Role = "SUPER_ADMIN" | "LOGISTICS_PARTNER";

export type OrderStatus =
  | "INTENT_SUBMITTED"
  | "QUOTING"
  | "QUOTED"
  | "QUOTE_SENT"
  | "PAID"
  | "PURCHASED"
  | "RECEIVED_HUB"
  | "CONFIRMED_HUB"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "DECLINED"
  | "UNAVAILABLE";

export type VolumeTier = "SMALL_UNITS" | "MID_QUANTITY" | "LARGE_STOCK";

export const VOLUME_TIER_LABELS: Record<VolumeTier, string> = {
  SMALL_UNITS: "Quelques unités",
  MID_QUANTITY: "Quantité moyenne",
  LARGE_STOCK: "Gros stock",
};

// The main path through the lifecycle — used to render the corridor tracker.
// DECLINED/UNAVAILABLE are terminal off-ramps, shown separately (see StatusBadge).
export const STATUS_SEQUENCE: OrderStatus[] = [
  "INTENT_SUBMITTED",
  "QUOTING",
  "QUOTED",
  "QUOTE_SENT",
  "PAID",
  "PURCHASED",
  "RECEIVED_HUB",
  "CONFIRMED_HUB",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  INTENT_SUBMITTED: "Intention reçue",
  QUOTING: "En cotation",
  QUOTED: "Coté",
  QUOTE_SENT: "Devis envoyé",
  PAID: "Payé",
  PURCHASED: "Acheté",
  RECEIVED_HUB: "Reçu au hub",
  CONFIRMED_HUB: "Confirmé (hub)",
  PICKED_UP: "Pris en charge",
  IN_TRANSIT: "En route",
  DELIVERED: "Livré",
  DECLINED: "Refusé",
  UNAVAILABLE: "Indisponible",
};

// Admin can move an order to most statuses manually (a required note is
// enforced server-side); QUOTE_SENT and PAID only happen via their dedicated
// actions. The partner can only advance its own shipping leg.
export const ADMIN_MANUAL_TARGETS: OrderStatus[] = [
  "INTENT_SUBMITTED",
  "QUOTING",
  "QUOTED",
  "PURCHASED",
  "RECEIVED_HUB",
  "CONFIRMED_HUB",
  "DECLINED",
  "UNAVAILABLE",
];

export const PARTNER_SEQUENCE: OrderStatus[] = ["CONFIRMED_HUB", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];

export const PARTNER_NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  CONFIRMED_HUB: "PICKED_UP",
  PICKED_UP: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};

export const PARTNER_NEXT_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  CONFIRMED_HUB: "Marquer pris en charge",
  PICKED_UP: "Marquer en route",
  IN_TRANSIT: "Marquer livré",
};

export interface Hub {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  currency: string;
  isActive: boolean;
  notes: string | null;
}

export interface Provider {
  id: string;
  name: string;
  slug: string;
  domains: string[];
  type: "LOCAL_MARKETPLACE" | "INTERNATIONAL";
  defaultCurrency: string;
  logoUrl: string | null;
  isActive: boolean;
  notes: string | null;
}

export interface OrderUserRef {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export interface LogisticsQuoteLineItem {
  label: string;
  amount: number;
}

export interface LogisticsQuote {
  id: string;
  orderId: string;
  submittedByUserId: string;
  amount: string;
  currency: string;
  lineItems: LogisticsQuoteLineItem[];
  note: string | null;
  status: "SUBMITTED" | "ACCEPTED" | "REVISED";
  createdAt: string;
}

// Price fields (productCost, currency, platformFee, customerQuoteTotal,
// paymentStatus, paidAt) are only ever present for SUPER_ADMIN — the API
// omits them entirely from the partner-facing serialization (§3, enforced
// server-side). They're typed optional here to reflect that.
export interface Order {
  id: string;
  reference: string;
  quoteToken?: string;
  hubId: string;
  hub: Hub;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  destinationCity: string;
  destinationCountry: string;
  providerId: string | null;
  provider: Provider | null;
  productName: string;
  productUrl: string;
  productImageUrl: string | null;
  quantity: number;
  volumeTier: VolumeTier;
  productCost?: string | null;
  currency?: string | null;
  logisticsCost: string | null;
  platformFee?: string | null;
  customerQuoteTotal?: number | null;
  paymentStatus?: "UNPAID" | "PAID";
  paidAt?: string | null;
  notes?: string | null;
  status: OrderStatus;
  createdByUserId?: string;
  createdByUser?: OrderUserRef;
  assignedPartnerId: string | null;
  assignedPartner: OrderUserRef | null;
  logisticsQuote: LogisticsQuote | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderHistoryEntry {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByUser: { id: string; name: string; role: Role };
  note: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientUserId: string;
  orderId: string | null;
  channel: "IN_APP" | "EMAIL" | "SMS";
  title: string;
  body: string;
  status: "PENDING" | "SENT" | "FAILED" | "READ";
  createdAt: string;
  sentAt: string | null;
  order?: { id: string; reference: string; status: OrderStatus } | null;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  hubId: string | null;
  hub: { id: string; name: string; city: string; country: string; currency: string } | null;
}

export interface Reservation {
  id: string;
  hubId: string;
  reservedByUser: { id: string; name: string };
  providerId: string | null;
  provider: Provider | null;
  externalId: string | null;
  url: string;
  title: string | null;
  imageUrl: string | null;
  price: string | null;
  currency: string | null;
  status: "RESERVED" | "CONVERTED";
  orderId: string | null;
  order: { id: string; reference: string; status: OrderStatus } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResolveResult {
  providerId: string | null;
  providerSlug: string | null;
  product: {
    title?: string;
    imageUrl?: string;
    price?: number;
    currency?: string;
  };
}

export interface SearchResultItem {
  externalId?: string;
  url: string;
  title?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
}

export interface SearchFacetOption {
  value: string;
  label: string;
}

export interface SearchFacets {
  categories: SearchFacetOption[];
  brands: SearchFacetOption[];
  priceRange: { min: number; max: number } | null;
}

export interface SearchPagination {
  page: number;
  totalResults: number | null;
  hasMore: boolean;
}

export interface ProductSearchResponse {
  supported: boolean;
  results: SearchResultItem[];
  facets: SearchFacets;
  pagination: SearchPagination;
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  page?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface GeoDetectResult {
  location: { country: string; city: string; lat: number; lng: number } | null;
  nearestHubId: string | null;
}

export interface PublicQuote {
  reference: string;
  productName: string;
  productImageUrl: string | null;
  quantity: number;
  route: string;
  status: OrderStatus;
  customerQuoteTotal: number | null;
  paymentStatus: "UNPAID" | "PAID";
}
