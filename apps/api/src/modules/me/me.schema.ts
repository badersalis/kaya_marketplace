import { z } from "zod";
import { createHubSchema } from "../hubs/hubs.schema";

export const setMyHubSchema = z
  .object({
    hubId: z.string().uuid().optional(),
    newHub: createHubSchema.optional(),
  })
  .refine((v) => !!v.hubId !== !!v.newHub, {
    message: "Provide exactly one of hubId or newHub",
  });

export type SetMyHubInput = z.infer<typeof setMyHubSchema>;
