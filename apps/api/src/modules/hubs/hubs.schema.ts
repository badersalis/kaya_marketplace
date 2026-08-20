import { z } from "zod";

export const createHubSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().min(2).max(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
  currency: z.string().min(1),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export const updateHubSchema = createHubSchema.partial();

export type CreateHubInput = z.infer<typeof createHubSchema>;
export type UpdateHubInput = z.infer<typeof updateHubSchema>;
