import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { geoProvider } from "../../providers/geo";
import * as hubsService from "../hubs/hubs.service";

export const geoRouter = Router();

geoRouter.use(requireAuth);

/**
 * @openapi
 * /geo/detect:
 *   get:
 *     tags: [Geo]
 *     summary: Best-effort location from the caller's IP, plus the nearest active hub if one is within range
 *     responses:
 *       200:
 *         description: Detected location (nullable) and nearest hub match (nullable)
 */
geoRouter.get("/detect", async (req, res, next) => {
  try {
    const ip = req.ip ?? req.socket.remoteAddress ?? "";
    const location = await geoProvider.resolveFromIp(ip);

    let nearestHubId: string | null = null;
    if (location) {
      const nearest = await hubsService.findNearestHub({ lat: location.lat, lng: location.lng });
      nearestHubId = nearest?.hub.id ?? null;
    }

    res.json({ location, nearestHubId });
  } catch (err) {
    next(err);
  }
});
