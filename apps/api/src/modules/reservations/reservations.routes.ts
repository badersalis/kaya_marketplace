import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createReservationSchema, listReservationsQuerySchema } from "./reservations.schema";
import * as reservationsService from "./reservations.service";

export const reservationsRouter = Router();

reservationsRouter.use(requireAuth, requireRole("SUPER_ADMIN"));

const idParamSchema = z.object({ id: z.string().uuid() });

/**
 * @openapi
 * /reservations:
 *   get:
 *     tags: [Reservations]
 *     summary: List saved products for the admin's hub (Super Admin only)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [RESERVED, CONVERTED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of reservations
 */
reservationsRouter.get("/", validate({ query: listReservationsQuerySchema }), async (req, res, next) => {
  try {
    res.json(await reservationsService.listReservations(req.user!, req.query as any));
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /reservations:
 *   post:
 *     tags: [Reservations]
 *     summary: Save a product for later (Super Admin only) — no customer/destination needed yet
 *     responses:
 *       201:
 *         description: Created reservation
 */
reservationsRouter.post("/", validate({ body: createReservationSchema }), async (req, res, next) => {
  try {
    res.status(201).json(await reservationsService.createReservation(req.user!, req.body));
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /reservations/{id}:
 *   delete:
 *     tags: [Reservations]
 *     summary: Remove a reservation that hasn't been converted to an order yet
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Removed
 *       409:
 *         description: Already converted to an order
 */
reservationsRouter.delete("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    await reservationsService.deleteReservation(req.user!, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
