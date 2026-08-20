import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { publicDecisionSchema } from "./orders.schema";
import * as publicQuoteService from "./publicQuote.service";

export const publicQuoteRouter = Router();

const tokenParamSchema = z.object({ quoteToken: z.string().min(1) });

/**
 * @openapi
 * /q/{quoteToken}:
 *   get:
 *     tags: [Public Quote]
 *     summary: The customer's quote/tracking page data (no auth). Never includes cost, fee, or margin.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: quoteToken
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product, quantity, total, and status
 *       404:
 *         description: Unknown token
 */
publicQuoteRouter.get("/:quoteToken", validate({ params: tokenParamSchema }), async (req, res, next) => {
  try {
    res.json(await publicQuoteService.getPublicQuote(req.params.quoteToken));
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /q/{quoteToken}/decision:
 *   post:
 *     tags: [Public Quote]
 *     summary: Customer accepts or declines the quote (no auth)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: quoteToken
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [accept, decline] }
 *     responses:
 *       200:
 *         description: Resulting status
 *       409:
 *         description: Quote is no longer answerable
 */
publicQuoteRouter.post(
  "/:quoteToken/decision",
  validate({ params: tokenParamSchema, body: publicDecisionSchema }),
  async (req, res, next) => {
    try {
      res.json(await publicQuoteService.submitDecision(req.params.quoteToken, req.body));
    } catch (err) {
      next(err);
    }
  }
);
