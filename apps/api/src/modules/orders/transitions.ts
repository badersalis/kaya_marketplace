import { OrderStatus } from "@prisma/client";

// The partner's leg is a strict, forward-only sequence — no skipping, no going back.
export const PARTNER_SEQUENCE: OrderStatus[] = ["CONFIRMED_HUB", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];

export const HANDOFF_STATUS: OrderStatus = "CONFIRMED_HUB";

// Everything the admin can move an order to by hand via POST /orders/:id/transition.
// QUOTE_SENT and PAID are deliberately excluded — they only happen through the
// dedicated /send-quote and /mark-paid endpoints, which have required side
// effects (computing the total, notifying the customer) that a bare status
// flip would skip.
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

export function isPartnerForwardStep(from: OrderStatus, to: OrderStatus): boolean {
  const fromIndex = PARTNER_SEQUENCE.indexOf(from);
  const toIndex = PARTNER_SEQUENCE.indexOf(to);
  return fromIndex !== -1 && toIndex === fromIndex + 1;
}

export const FRENCH_STATUS_LABELS: Record<OrderStatus, string> = {
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
