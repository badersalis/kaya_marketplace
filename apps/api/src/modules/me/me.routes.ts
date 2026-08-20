import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { toPublicUser } from "../auth/auth.service";
import { setMyHubSchema } from "./me.schema";

export const meRouter = Router();

meRouter.use(requireAuth);

/**
 * @openapi
 * /me/hub:
 *   patch:
 *     tags: [Me]
 *     summary: Bind the current user to a hub, or create a new hub and bind to it. Authoritative — detection only pre-fills.
 *     responses:
 *       200:
 *         description: Updated user profile
 */
meRouter.patch("/hub", validate({ body: setMyHubSchema }), async (req, res, next) => {
  try {
    const { hubId, newHub } = req.body as { hubId?: string; newHub?: Parameters<typeof prisma.hub.create>[0]["data"] };

    let targetHubId = hubId;
    if (newHub) {
      const created = await prisma.hub.create({ data: newHub });
      targetHubId = created.id;
    } else if (hubId) {
      const hub = await prisma.hub.findUnique({ where: { id: hubId } });
      if (!hub) throw AppError.notFound("Hub not found");
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { hubId: targetHubId },
    });

    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
});
