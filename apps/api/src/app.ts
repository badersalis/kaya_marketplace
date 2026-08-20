import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { providersRouter } from "./modules/providers/providers.routes";
import { hubsRouter } from "./modules/hubs/hubs.routes";
import { geoRouter } from "./modules/geo/geo.routes";
import { meRouter } from "./modules/me/me.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { quotesRouter } from "./modules/orders/quotes.routes";
import { publicQuoteRouter } from "./modules/orders/publicQuote.routes";
import { reservationsRouter } from "./modules/reservations/reservations.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { healthRouter } from "./modules/health/health.routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(express.json());

  app.use("/health", healthRouter);
  app.get("/docs.json", (_req, res) => res.json(swaggerSpec));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use("/auth", authRouter);
  app.use("/providers", providersRouter);
  app.use("/hubs", hubsRouter);
  app.use("/geo", geoRouter);
  app.use("/me", meRouter);
  app.use("/orders", ordersRouter);
  app.use("/orders", quotesRouter);
  app.use("/q", publicQuoteRouter);
  app.use("/reservations", reservationsRouter);
  app.use("/notifications", notificationsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
