import { z } from "zod";

export const orderStatusEnum = z.enum([
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
  "DECLINED",
  "UNAVAILABLE",
]);

export const volumeTierEnum = z.enum(["SMALL_UNITS", "MID_QUANTITY", "LARGE_STOCK"]);

export const createOrderSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().email().optional(),
  destinationCity: z.string().min(1),
  destinationCountry: z.string().min(1),
  providerId: z.string().uuid().optional(),
  productUrl: z.string().url(),
  productName: z.string().min(1).optional(),
  productImageUrl: z.string().url().optional(),
  quantity: z.number().int().positive().optional(),
  volumeTier: volumeTierEnum.optional(),
  notes: z.string().optional(),
  reservationId: z.string().uuid().optional(),
});

export const updateOrderSchema = z.object({
  productName: z.string().min(1).optional(),
  productImageUrl: z.string().url().optional(),
  quantity: z.number().int().positive().optional(),
  volumeTier: volumeTierEnum.optional(),
  productCost: z.number().positive().optional(),
  currency: z.string().min(1).optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  destinationCity: z.string().min(1).optional(),
  destinationCountry: z.string().min(1).optional(),
  notes: z.string().optional(),
});

export const setFeeSchema = z.object({
  platformFee: z.number().nonnegative(),
});

export const transitionSchema = z.object({
  toStatus: orderStatusEnum,
  note: z.string().optional(),
  override: z.boolean().optional(),
});

export const listOrdersQuerySchema = z.object({
  status: orderStatusEnum.optional(),
  providerId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const logisticsQuoteSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1),
  lineItems: z
    .array(z.object({ label: z.string().min(1), amount: z.number() }))
    .min(1),
  note: z.string().optional(),
});

export const publicDecisionSchema = z.object({
  decision: z.enum(["accept", "decline"]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type SetFeeInput = z.infer<typeof setFeeSchema>;
export type TransitionInput = z.infer<typeof transitionSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type LogisticsQuoteInput = z.infer<typeof logisticsQuoteSchema>;
export type PublicDecisionInput = z.infer<typeof publicDecisionSchema>;
