import { Order, Provider, Hub, User, LogisticsQuote } from "@prisma/client";

export type OrderWithRelations = Order & {
  hub: Hub;
  provider: Provider | null;
  assignedPartner: Pick<User, "id" | "name" | "email" | "phone"> | null;
  createdByUser: Pick<User, "id" | "name" | "email">;
  logisticsQuote: LogisticsQuote | null;
};

/** Full view — Super Admin only. Includes cost, fee, total, and margin. */
export function serializeOrderForAdmin(order: OrderWithRelations) {
  return order;
}

/**
 * Partner view — hard rule (§3): never includes productCost, platformFee,
 * customerQuoteTotal, or anything margin-derived. logisticsCost is safe to
 * show back since it's just a copy of the partner's own accepted quote.
 */
export function serializeOrderForPartner(order: OrderWithRelations) {
  return {
    id: order.id,
    reference: order.reference,
    hub: order.hub,
    destinationCity: order.destinationCity,
    destinationCountry: order.destinationCountry,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    provider: order.provider,
    productName: order.productName,
    productUrl: order.productUrl,
    productImageUrl: order.productImageUrl,
    quantity: order.quantity,
    volumeTier: order.volumeTier,
    logisticsCost: order.logisticsCost,
    status: order.status,
    assignedPartnerId: order.assignedPartnerId,
    assignedPartner: order.assignedPartner,
    logisticsQuote: order.logisticsQuote,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function serializeOrderForRole(order: OrderWithRelations, role: "SUPER_ADMIN" | "LOGISTICS_PARTNER") {
  return role === "SUPER_ADMIN" ? serializeOrderForAdmin(order) : serializeOrderForPartner(order);
}

/** Public tokenized view — the customer never sees cost/fee/margin, only the final total. */
export function serializeOrderForCustomer(order: OrderWithRelations) {
  return {
    reference: order.reference,
    productName: order.productName,
    productImageUrl: order.productImageUrl,
    quantity: order.quantity,
    route: `${order.hub.city} → ${order.destinationCity}`,
    status: order.status,
    customerQuoteTotal: order.customerQuoteTotal,
    paymentStatus: order.paymentStatus,
  };
}
