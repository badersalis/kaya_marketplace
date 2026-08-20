import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { logisticsQuoteSchema } from "./orders.schema";
import * as quotesService from "./quotes.service";

export const quotesRouter = Router();

quotesRouter.use(requireAuth);

const idParamSchema = z.object({ id: z.string().uuid() });

/**
 * @openapi
 * /orders/{id}/quote-request:
 *   get:
 *     tags: [Logistics Quotes]
 *     summary: The price-free view of an order a partner has been asked to quote (Partner only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Price-free order details for quoting
 */
quotesRouter.get(
  "/:id/quote-request",
  requireRole("LOGISTICS_PARTNER"),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      res.json(await quotesService.getQuoteRequest(req.user!, req.params.id));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /orders/{id}/logistics-quote:
 *   post:
 *     tags: [Logistics Quotes]
 *     summary: Submit (or revise) the itemized logistics quote for an order (Partner only). Never exposes product cost or platform fee.
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
 *             required: [amount, currency, lineItems]
 *             properties:
 *               amount: { type: number }
 *               currency: { type: string }
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label: { type: string }
 *                     amount: { type: number }
 *               note: { type: string }
 *     responses:
 *       200:
 *         description: Updated order (price-free view)
 */
quotesRouter.post(
  "/:id/logistics-quote",
  requireRole("LOGISTICS_PARTNER"),
  validate({ params: idParamSchema, body: logisticsQuoteSchema }),
  async (req, res, next) => {
    try {
      res.json(await quotesService.submitLogisticsQuote(req.user!, req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }
);
