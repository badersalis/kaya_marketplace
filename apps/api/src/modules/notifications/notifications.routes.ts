import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as notificationsService from "./notifications.service";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List the current user's notifications, newest first
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of notifications
 */
notificationsRouter.get("/", validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const { page, limit } = req.query as unknown as { page?: number; limit?: number };
    const notifications = await notificationsService.listForUser(req.user!.id, page, limit);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Count of unread in-app notifications for the current user
 *     responses:
 *       200:
 *         description: Unread count
 */
notificationsRouter.get("/unread-count", async (req, res, next) => {
  try {
    const result = await notificationsService.unreadCount(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated notification
 */
notificationsRouter.patch(
  "/:id/read",
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const notification = await notificationsService.markRead(req.user!.id, req.params.id);
      res.json(notification);
    } catch (err) {
      next(err);
    }
  }
);
