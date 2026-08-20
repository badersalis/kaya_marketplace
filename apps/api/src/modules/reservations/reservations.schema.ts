import { z } from "zod";

export const createReservationSchema = z.object({
  providerId: z.string().uuid().optional(),
  externalId: z.string().optional(),
  url: z.string().url(),
  title: z.string().optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
});

export const listReservationsQuerySchema = z.object({
  status: z.enum(["RESERVED", "CONVERTED"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ListReservationsQuery = z.infer<typeof listReservationsQuerySchema>;
