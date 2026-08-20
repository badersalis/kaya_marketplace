# Kaya

Cross-border order & delivery orchestration platform — buy from Jumia (and other supported stores, via a pluggable adapter registry) on behalf of customers in african landlocked countries who can't order there directly, and hand parcels off to a logistics partner for the last mile.

## Stack

- **API**: TypeScript + Express, Prisma/PostgreSQL, BullMQ/Redis, Swagger
- **Web**: Next.js (App Router), Tailwind CSS
- **Auth**: JWT, httpOnly session cookie, seeded `SUPER_ADMIN` and `LOGISTICS_PARTNER` accounts (no customer logins)

## Project layout

```
apps/
  api/     Express API, Prisma schema/migrations/seed, BullMQ workers
  web/     Next.js dashboard (Super Admin + Logistics Partner views)
docker-compose.yml   Postgres + Redis for local dev
```

## Local setup

1. **Start Postgres & Redis**

   ```bash
   docker compose up -d
   ```

2. **Configure environment**

   Copy `.env.example` to `apps/api/.env` (values are already sane defaults for local dev) and `NEXT_PUBLIC_API_URL=http://localhost:4000` to `apps/web/.env.local`.

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Run database migrations and seed**

   ```bash
   npm run migrate --workspace apps/api   # prisma migrate dev
   npm run seed --workspace apps/api      # Super Admin + Logistics Partner + Jumia provider
   ```

   Seeded accounts (from `apps/api/.env`):
   - Super Admin — `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD`
   - Logistics Partner — `SEED_PARTNER_EMAIL` / `SEED_PARTNER_PASSWORD`

   Set `SEED_DEMO=true` to also seed a handful of demo orders across different statuses.

5. **Run everything**

   ```bash
   npm run dev:api      # Express API on :4000, Swagger at /docs
   npm run dev:worker   # BullMQ email + notification workers
   npm run dev:web      # Next.js dashboard on :3000
   ```

## Notable design points

- **Providers are pluggable** (`apps/api/src/modules/providers`): a `ProviderRegistry` resolves a pasted product URL to a store-specific `ProviderAdapter` (Jumia and Temu adapters ship in the code) or falls back to a generic OpenGraph scraper for any other store. Adding a new store is a `Provider` DB row plus, optionally, one adapter file — no changes to orders, transitions, or notifications. The initial seed only activates Jumia; uncomment the Temu block in `prisma/seed.ts` to bring it back.
- **Order lifecycle** is a strict 7-status linear flow (`apps/api/src/modules/orders/transitions.ts`), enforced server-side by role ownership and one-step-forward-only transitions. The `RECEIVED_ABIDJAN → CONFIRMED_ABIDJAN` transition is the handoff: it assigns the order to the seeded Logistics Partner and enqueues BullMQ jobs.
- **Notifications** run through two BullMQ queues (`email`, `notification`) consumed by dedicated workers (`apps/api/src/workers`). Both default to a `ConsoleProvider` (logs to stdout) so the whole flow works with zero external credentials in dev; set `EMAIL_PROVIDER=smtp` + `SMTP_URL` for real email.
- **Web app**: `apps/web` proxies all API calls through Next.js Route Handlers (`app/api/kaya/[...path]`) so the JWT lives only in an httpOnly cookie, never in browser JS. `middleware.ts` gates routes by role.

## API docs

Swagger UI: `http://localhost:4000/docs` · Raw spec: `http://localhost:4000/docs.json` · Health check: `http://localhost:4000/health`
