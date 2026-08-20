import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";

export const healthRouter = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Liveness check — verifies Postgres and Redis connectivity
 *     security: []
 *     responses:
 *       200:
 *         description: All dependencies are reachable
 *       503:
 *         description: One or more dependencies are unreachable
 */
healthRouter.get("/", async (_req, res) => {
  const status = { postgres: "down", redis: "down" };

  try {
    await prisma.$queryRaw`SELECT 1`;
    status.postgres = "up";
  } catch {
    status.postgres = "down";
  }

  try {
    const pong = await redis.ping();
    status.redis = pong === "PONG" ? "up" : "down";
  } catch {
    status.redis = "down";
  }

  const healthy = status.postgres === "up" && status.redis === "up";
  res.status(healthy ? 200 : 503).json({ status: healthy ? "ok" : "degraded", ...status });
});
