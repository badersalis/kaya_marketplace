import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createProviderSchema,
  updateProviderSchema,
  resolveQuerySchema,
  searchQuerySchema,
  listQuerySchema,
} from "./providers.schema";
import * as providersService from "./providers.service";

export const providersRouter = Router();

providersRouter.use(requireAuth);

/**
 * @openapi
 * /providers:
 *   get:
 *     tags: [Providers]
 *     summary: List providers (store registry). SUPER_ADMIN may pass includeInactive=true to also see disabled stores.
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         required: false
 *         schema: { type: string, enum: [true, false] }
 *     responses:
 *       200:
 *         description: List of providers
 */
providersRouter.get("/", validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const { includeInactive } = req.query as unknown as { includeInactive?: string };
    const providers =
      includeInactive === "true" && req.user?.role === "SUPER_ADMIN"
        ? await providersService.listAllProviders()
        : await providersService.listActiveProviders();
    res.json(providers);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /providers/search:
 *   get:
 *     tags: [Providers]
 *     summary: Keyword search a store's catalog (only supported for stores whose adapter implements search)
 *     parameters:
 *       - in: query
 *         name: provider
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         required: false
 *         schema: { type: string }
 *         description: Category facet value from a previous search's facets.categories
 *       - in: query
 *         name: brand
 *         required: false
 *         schema: { type: string }
 *         description: Brand facet value from a previous search's facets.brands
 *       - in: query
 *         name: priceMin
 *         required: false
 *         schema: { type: number }
 *       - in: query
 *         name: priceMax
 *         required: false
 *         schema: { type: number }
 *       - in: query
 *         name: page
 *         required: false
 *         schema: { type: integer }
 *         description: 1-based page number, from pagination.page/hasMore in a previous response
 *     responses:
 *       200:
 *         description: supported flag, best-effort results (may be empty), refinable facets, and pagination info
 */
providersRouter.get(
  "/search",
  requireRole("SUPER_ADMIN"),
  validate({ query: searchQuerySchema }),
  async (req, res, next) => {
    try {
      const { provider, q, category, brand, priceMin, priceMax, page } = req.query as unknown as {
        provider: string;
        q: string;
        category?: string;
        brand?: string;
        priceMin?: number;
        priceMax?: number;
        page?: number;
      };
      const result = await providersService.searchProvider(provider, q, { category, brand, priceMin, priceMax, page });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /providers/resolve:
 *   get:
 *     tags: [Providers]
 *     summary: Resolve a pasted product URL to a provider and best-effort product metadata
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Resolved provider (nullable) and product metadata (best-effort, may be empty)
 */
providersRouter.get(
  "/resolve",
  requireRole("SUPER_ADMIN"),
  validate({ query: resolveQuerySchema }),
  async (req, res, next) => {
    try {
      const { url } = req.query as unknown as { url: string };
      const result = await providersService.resolveUrl(url);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /providers:
 *   post:
 *     tags: [Providers]
 *     summary: Register a new supported store
 *     responses:
 *       201:
 *         description: Created provider
 */
providersRouter.post(
  "/",
  requireRole("SUPER_ADMIN"),
  validate({ body: createProviderSchema }),
  async (req, res, next) => {
    try {
      const provider = await providersService.createProvider(req.body);
      res.status(201).json(provider);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /providers/{id}:
 *   patch:
 *     tags: [Providers]
 *     summary: Update a provider
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated provider
 */
providersRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  validate({ body: updateProviderSchema, params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const provider = await providersService.updateProvider(req.params.id, req.body);
      res.json(provider);
    } catch (err) {
      next(err);
    }
  }
);
