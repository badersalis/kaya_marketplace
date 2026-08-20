import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  LINK_PREVIEW_ENABLED: z
    .string()
    .default("true")
    .transform((v) => v === "true"),
  LINK_PREVIEW_TIMEOUT_MS: z.coerce.number().default(4000),
  // Category/brand-scoped catalog pages are noticeably heavier than a plain
  // search or a single product page, so search gets its own, longer budget.
  SEARCH_TIMEOUT_MS: z.coerce.number().default(20000),

  EMAIL_PROVIDER: z.enum(["console", "smtp"]).default("console"),
  SMTP_URL: z.string().optional().default(""),
  SMS_PROVIDER: z.string().default("console"),
  SMS_API_KEY: z.string().optional().default(""),

  GEO_PROVIDER: z.enum(["static", "ipapi"]).default("static"),
  GEO_API_KEY: z.string().optional().default(""),
  HUB_MATCH_RADIUS_KM: z.coerce.number().default(150),

  PLATFORM_FEE_PERCENT: z.coerce.number().default(12),

  SEED_HUB_NAME: z.string().default("Abidjan Hub"),
  SEED_HUB_CITY: z.string().default("Abidjan"),
  SEED_HUB_COUNTRY: z.string().default("Côte d'Ivoire"),
  SEED_HUB_COUNTRY_CODE: z.string().default("CI"),
  SEED_HUB_LAT: z.coerce.number().default(5.3599517),
  SEED_HUB_LNG: z.coerce.number().default(-4.0082563),
  SEED_HUB_TIMEZONE: z.string().default("Africa/Abidjan"),
  SEED_HUB_CURRENCY: z.string().default("XOF"),

  SEED_SUPERADMIN_EMAIL: z.string().default("admin@kaya.app"),
  SEED_SUPERADMIN_PASSWORD: z.string().default("ChangeMe123!"),
  SEED_PARTNER_EMAIL: z.string().default("partner@kaya.app"),
  SEED_PARTNER_PASSWORD: z.string().default("ChangeMe123!"),
  SEED_DEMO: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  CORS_ORIGIN: z.string().default("http://localhost:3000,http://localhost:3001"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
