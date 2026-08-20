import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createOrderSchema,
  listOrdersQuerySchema,
  setFeeSchema,
  transitionSchema,
  updateOrderSchema,
} from "./orders.schema";
import * as ordersService from "./orders.service";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

const idParamSchema = z.object({ id: z.string().uuid() });

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders (role-scoped — Super Admin sees their hub's orders with full pricing, Partner sees only assigned parcels, price-free)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: providerId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of orders
 */
ordersRouter.get("/", validate({ query: listOrdersQuerySchema }), async (req, res, next) => {
  try {
    res.json(await ordersService.listOrders(req.user!, req.query as any));
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create an intent (Super Admin only). Inherits the admin's hub; auto-assigns a partner and moves straight to QUOTING.
 *     responses:
 *       201:
 *         description: Created order
 *       400:
 *         description: Admin has no hub set yet
 */
ordersRouter.post(
  "/",
  requireRole("SUPER_ADMIN"),
  validate({ body: createOrderSchema }),
  async (req, res, next) => {
    try {
      res.status(201).json(await ordersService.createOrder(req.user!, req.body));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get a single order (role-scoped serialization)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The order
 *       404:
 *         description: Not found or not visible to this user
 */
ordersRouter.get("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(await ordersService.getOrder(req.user!, req.params.id));
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /orders/{id}:
 *   patch:
 *     tags: [Orders]
 *     summary: Edit product/customer/quantity/notes and enter productCost while quoting (Super Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated order
 *       409:
 *         description: Order has moved past the editable stage
 */
ordersRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  validate({ params: idParamSchema, body: updateOrderSchema }),
  async (req, res, next) => {
    try {
      res.json(await ordersService.updateOrder(req.user!, req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /orders/{id}/fee:
 *   post:
 *     tags: [Orders]
 *     summary: Set/override the platform fee for an order (Super Admin only). If never called, send-quote computes a default from PLATFORM_FEE_PERCENT.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated order
 */
ordersRouter.post(
  "/:id/fee",
  requireRole("SUPER_ADMIN"),
  validate({ params: idParamSchema, body: setFeeSchema }),
  async (req, res, next) => {
    try {
      res.json(await ordersService.setFee(req.user!, req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /orders/{id}/send-quote:
 *   post:
 *     tags: [Orders]
 *     summary: Compute customerQuoteTotal and send the quote to the customer (Super Admin only). Requires productCost and an accepted logistics quote.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated order, now QUOTE_SENT
 *       409:
 *         description: Missing productCost or logistics quote, or order not in QUOTED
 */
ordersRouter.post(
  "/:id/send-quote",
  requireRole("SUPER_ADMIN"),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      res.json(await ordersService.sendQuote(req.user!, req.params.id));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /orders/{id}/mark-paid:
 *   post:
 *     tags: [Orders]
 *     summary: Confirm the customer's payment (Super Admin only). Notifies the partner to prepare.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated order, now PAID
 */
ordersRouter.post(
  "/:id/mark-paid",
  requireRole("SUPER_ADMIN"),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      res.json(await ordersService.markPaid(req.user!, req.params.id));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /orders/{id}/transition:
 *   post:
 *     tags: [Orders]
 *     summary: Manually change an order's status. Admin can move to most statuses (note required); Partner can only advance CONFIRMED_HUB → ... → DELIVERED.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toStatus]
 *             properties:
 *               toStatus: { type: string }
 *               note: { type: string }
 *               override: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated order
 *       403:
 *         description: This role does not own this transition
 *       409:
 *         description: Illegal transition or guardrail blocked (e.g. PURCHASED while unpaid)
 */
ordersRouter.post(
  "/:id/transition",
  validate({ params: idParamSchema, body: transitionSchema }),
  async (req, res, next) => {
    try {
      res.json(await ordersService.transitionOrder(req.user!, req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /orders/{id}/history:
 *   get:
 *     tags: [Orders]
 *     summary: Full status timeline for an order
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Status history, oldest first
 */
ordersRouter.get("/:id/history", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(await ordersService.getHistory(req.user!, req.params.id));
  } catch (err) {
    next(err);
  }
});
