import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import { createHubSchema, updateHubSchema } from "./hubs.schema";
import * as hubsService from "./hubs.service";

export const hubsRouter = Router();

hubsRouter.use(requireAuth);

/**
 * @openapi
 * /hubs:
 *   get:
 *     tags: [Hubs]
 *     summary: List active hubs
 *     responses:
 *       200:
 *         description: List of active hubs
 */
hubsRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await hubsService.listActiveHubs());
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /hubs:
 *   post:
 *     tags: [Hubs]
 *     summary: Create a hub
 *     responses:
 *       201:
 *         description: Created hub
 */
hubsRouter.post("/", requireRole("SUPER_ADMIN"), validate({ body: createHubSchema }), async (req, res, next) => {
  try {
    res.status(201).json(await hubsService.createHub(req.body));
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /hubs/{id}:
 *   patch:
 *     tags: [Hubs]
 *     summary: Update a hub
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated hub
 */
hubsRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  validate({ body: updateHubSchema, params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      res.json(await hubsService.updateHub(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }
);
