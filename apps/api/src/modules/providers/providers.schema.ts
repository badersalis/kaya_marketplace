import { z } from "zod";

export const createProviderSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with dashes"),
  domains: z.array(z.string().min(1)).min(1),
  type: z.enum(["LOCAL_MARKETPLACE", "INTERNATIONAL"]),
  defaultCurrency: z.string().min(1),
  logoUrl: z.string().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export const updateProviderSchema = createProviderSchema.partial();

export const resolveQuerySchema = z.object({
  url: z.string().url(),
});

export const searchQuerySchema = z.object({
  provider: z.string().min(1),
  q: z.string().min(1),
  category: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().positive().optional(),
});

export const listQuerySchema = z.object({
  includeInactive: z.enum(["true", "false"]).optional(),
});

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
