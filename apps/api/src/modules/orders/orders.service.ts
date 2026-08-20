import crypto from "crypto";
import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { AuthUser } from "../../middleware/auth";
import { env } from "../../config/env";
import {
  CreateOrderInput,
  ListOrdersQuery,
  SetFeeInput,
  TransitionInput,
  UpdateOrderInput,
} from "./orders.schema";
import { generateUniqueReference } from "./reference";
import { ADMIN_MANUAL_TARGETS, HANDOFF_STATUS, isPartnerForwardStep } from "./transitions";
import { emailQueue } from "../../queues/email.queue";
import { notificationQueue } from "../../queues/notification.queue";
import * as registry from "../providers/registry";
import { OrderWithRelations, serializeOrderForRole } from "./orders.serialize";
import { NotificationTemplate } from "./notificationTemplates";

const EDITABLE_STATUSES: OrderStatus[] = ["INTENT_SUBMITTED", "QUOTING", "QUOTED"];

export const ORDER_INCLUDE = {
  hub: true,
  provider: true,
  assignedPartner: { select: { id: true, name: true, email: true, phone: true } },
  createdByUser: { select: { id: true, name: true, email: true } },
  logisticsQuote: true,
} satisfies Prisma.OrderInclude;

function assertVisible(user: AuthUser, order: { hubId: string; assignedPartnerId: string | null }, adminHubId: string | null) {
  if (user.role === "SUPER_ADMIN") {
    if (order.hubId !== adminHubId) throw AppError.notFound("Order not found");
    return;
  }
  if (order.assignedPartnerId !== user.id) {
    throw AppError.notFound("Order not found");
  }
}

export async function getAdminHubId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { hubId: true } });
  return user?.hubId ?? null;
}

export function enqueueEmailAndNotification(
  jobName: string,
  data: { orderId: string; recipientUserId?: string; recipientEmail?: string; recipientPhone?: string },
  template: NotificationTemplate
) {
  return Promise.all([
    notificationQueue.add(
      jobName,
      { orderId: data.orderId, recipientUserId: data.recipientUserId, recipientPhone: data.recipientPhone, template },
      { jobId: `notification:${jobName}:${data.orderId}` }
    ),
    emailQueue.add(
      jobName,
      { orderId: data.orderId, recipientUserId: data.recipientUserId, recipientEmail: data.recipientEmail, template },
      { jobId: `email:${jobName}:${data.orderId}` }
    ),
  ]);
}

export async function createOrder(user: AuthUser, input: CreateOrderInput) {
  const admin = await prisma.user.findUnique({ where: { id: user.id } });
  if (!admin?.hubId) {
    throw AppError.badRequest("Set your hub before creating an order (see /me/hub).");
  }

  let providerId = input.providerId ?? null;
  if (!providerId) {
    try {
      const resolved = await registry.resolve(input.productUrl);
      providerId = resolved.providerId;
    } catch {
      providerId = null;
    }
  }

  const partner = await prisma.user.findFirst({ where: { role: "LOGISTICS_PARTNER" } });
  if (!partner) {
    throw new AppError(500, "NO_PARTNER", "No logistics partner account exists to assign this order to");
  }

  if (input.reservationId) {
    const reservation = await prisma.reservation.findUnique({ where: { id: input.reservationId } });
    if (!reservation || reservation.hubId !== admin.hubId || reservation.status !== "RESERVED") {
      throw AppError.conflict("Reservation is not available to convert into an order");
    }
  }

  const reference = await generateUniqueReference();
  const quoteToken = crypto.randomBytes(24).toString("base64url");

  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        reference,
        quoteToken,
        hubId: admin.hubId!,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        destinationCity: input.destinationCity,
        destinationCountry: input.destinationCountry,
        providerId,
        productName: input.productName ?? "Article à confirmer",
        productUrl: input.productUrl,
        productImageUrl: input.productImageUrl,
        quantity: input.quantity ?? 1,
        volumeTier: input.volumeTier ?? "SMALL_UNITS",
        notes: input.notes,
        status: "INTENT_SUBMITTED",
        createdByUserId: user.id,
        assignedPartnerId: partner.id,
      },
      include: ORDER_INCLUDE,
    });

    await tx.orderStatusHistory.create({
      data: { orderId: order.id, fromStatus: null, toStatus: "INTENT_SUBMITTED", changedByUserId: user.id },
    });

    // The intent flows straight into quoting — there's no separate admin
    // action described for this move, so it happens as part of creation.
    const quoting = await tx.order.update({
      where: { id: order.id },
      data: { status: "QUOTING" },
      include: ORDER_INCLUDE,
    });

    await tx.orderStatusHistory.create({
      data: { orderId: order.id, fromStatus: "INTENT_SUBMITTED", toStatus: "QUOTING", changedByUserId: user.id },
    });

    if (input.reservationId) {
      await tx.reservation.update({
        where: { id: input.reservationId },
        data: { status: "CONVERTED", orderId: order.id },
      });
    }

    return quoting;
  });

  await Promise.all([
    created.customerEmail || created.customerPhone
      ? enqueueEmailAndNotification(
          "intent_received",
          { orderId: created.id, recipientEmail: created.customerEmail ?? undefined, recipientPhone: created.customerPhone },
          "intent_received"
        )
      : Promise.resolve(),
    enqueueEmailAndNotification("quote_request", { orderId: created.id, recipientUserId: partner.id }, "quote_request"),
  ]);

  return serializeOrderForRole(created as OrderWithRelations, "SUPER_ADMIN");
}

export async function listOrders(user: AuthUser, query: ListOrdersQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const where: Prisma.OrderWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.providerId) where.providerId = query.providerId;

  if (user.role === "SUPER_ADMIN") {
    const hubId = await getAdminHubId(user.id);
    where.hubId = hubId ?? "__none__"; // no hub set → no orders visible yet
  } else {
    where.assignedPartnerId = user.id;
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: ORDER_INCLUDE,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: items.map((o) => serializeOrderForRole(o as OrderWithRelations, user.role)),
    total,
    page,
    limit,
  };
}

export async function getOrder(user: AuthUser, id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  if (!order) throw AppError.notFound("Order not found");
  const adminHubId = user.role === "SUPER_ADMIN" ? await getAdminHubId(user.id) : null;
  assertVisible(user, order, adminHubId);
  return serializeOrderForRole(order as OrderWithRelations, user.role);
}

export async function maybeAdvanceToQuoted(tx: Prisma.TransactionClient, orderId: string, changedByUserId: string) {
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { logisticsQuote: true } });
  if (!order || order.status !== "QUOTING") return;
  if (order.productCost == null || !order.logisticsQuote) return;

  await tx.order.update({ where: { id: orderId }, data: { status: "QUOTED" } });
  await tx.orderStatusHistory.create({
    data: { orderId, fromStatus: "QUOTING", toStatus: "QUOTED", changedByUserId },
  });
}

export async function updateOrder(user: AuthUser, id: string, input: UpdateOrderInput) {
  if (user.role !== "SUPER_ADMIN") throw AppError.forbidden();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw AppError.notFound("Order not found");
  const adminHubId = await getAdminHubId(user.id);
  if (order.hubId !== adminHubId) throw AppError.notFound("Order not found");

  if (!EDITABLE_STATUSES.includes(order.status)) {
    throw AppError.conflict(`Order can no longer be edited once it reaches "${order.status}"`, {
      currentStatus: order.status,
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({ where: { id }, data: input, include: ORDER_INCLUDE });
    await maybeAdvanceToQuoted(tx, id, user.id);
    return result;
  });

  const fresh = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  return serializeOrderForRole(fresh! as OrderWithRelations, "SUPER_ADMIN");
}

export async function setFee(user: AuthUser, id: string, input: SetFeeInput) {
  if (user.role !== "SUPER_ADMIN") throw AppError.forbidden();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw AppError.notFound("Order not found");
  const adminHubId = await getAdminHubId(user.id);
  if (order.hubId !== adminHubId) throw AppError.notFound("Order not found");

  const updated = await prisma.order.update({
    where: { id },
    data: { platformFee: input.platformFee },
    include: ORDER_INCLUDE,
  });
  return serializeOrderForRole(updated as OrderWithRelations, "SUPER_ADMIN");
}

/**
 * Computes and sends the customer quote. No live FX conversion in v1 — the
 * admin enters productCost in the hub's currency, the partner's logistics
 * quote is assumed to already be in the hub's currency (local partners quote
 * locally), so the total is a straight sum in that currency (FCFA for the
 * seeded Abidjan hub).
 */
export async function sendQuote(user: AuthUser, id: string) {
  if (user.role !== "SUPER_ADMIN") throw AppError.forbidden();

  const order = await prisma.order.findUnique({ where: { id }, include: { logisticsQuote: true } });
  if (!order) throw AppError.notFound("Order not found");
  const adminHubId = await getAdminHubId(user.id);
  if (order.hubId !== adminHubId) throw AppError.notFound("Order not found");

  if (order.status !== "QUOTED") {
    throw AppError.conflict(`Quote can only be sent from "QUOTED", order is "${order.status}"`, {
      currentStatus: order.status,
    });
  }
  if (order.productCost == null) throw AppError.conflict("Set the product cost before sending the quote");
  if (!order.logisticsQuote) throw AppError.conflict("No logistics quote on file yet");

  const productCost = order.productCost.toNumber();
  const logisticsCost = order.logisticsQuote.amount.toNumber();
  const platformFee = order.platformFee != null ? order.platformFee.toNumber() : Math.round((productCost * env.PLATFORM_FEE_PERCENT) / 100);
  const customerQuoteTotal = Math.round(productCost + logisticsCost + platformFee);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id },
      data: {
        logisticsCost,
        platformFee,
        customerQuoteTotal,
        status: "QUOTE_SENT",
      },
      include: ORDER_INCLUDE,
    });
    await tx.orderStatusHistory.create({
      data: { orderId: id, fromStatus: "QUOTED", toStatus: "QUOTE_SENT", changedByUserId: user.id },
    });
    return result;
  });

  await enqueueEmailAndNotification(
    "quote_sent",
    { orderId: id, recipientEmail: updated.customerEmail ?? undefined, recipientPhone: updated.customerPhone },
    "quote_sent"
  );

  return serializeOrderForRole(updated as OrderWithRelations, "SUPER_ADMIN");
}

export async function markPaid(user: AuthUser, id: string) {
  if (user.role !== "SUPER_ADMIN") throw AppError.forbidden();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw AppError.notFound("Order not found");
  const adminHubId = await getAdminHubId(user.id);
  if (order.hubId !== adminHubId) throw AppError.notFound("Order not found");

  if (order.status !== "QUOTE_SENT") {
    throw AppError.conflict(`Payment can only be confirmed from "QUOTE_SENT", order is "${order.status}"`, {
      currentStatus: order.status,
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id },
      data: { status: "PAID", paymentStatus: "PAID", paidAt: new Date() },
      include: ORDER_INCLUDE,
    });
    await tx.orderStatusHistory.create({
      data: { orderId: id, fromStatus: "QUOTE_SENT", toStatus: "PAID", changedByUserId: user.id },
    });
    return result;
  });

  if (updated.assignedPartnerId) {
    await enqueueEmailAndNotification("paid_confirmed", { orderId: id, recipientUserId: updated.assignedPartnerId }, "paid_confirmed");
  }

  return serializeOrderForRole(updated as OrderWithRelations, "SUPER_ADMIN");
}

export async function transitionOrder(user: AuthUser, id: string, input: TransitionInput) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw AppError.notFound("Order not found");

  if (input.toStatus === "QUOTE_SENT" || input.toStatus === "PAID") {
    throw AppError.badRequest(`Use the dedicated endpoint to reach "${input.toStatus}"`);
  }

  if (user.role === "SUPER_ADMIN") {
    const adminHubId = await getAdminHubId(user.id);
    if (order.hubId !== adminHubId) throw AppError.notFound("Order not found");
    if (!ADMIN_MANUAL_TARGETS.includes(input.toStatus)) {
      throw AppError.forbidden(`Only the logistics partner can move an order to "${input.toStatus}"`);
    }
    if (!input.note) {
      throw AppError.badRequest("A note is required for manual status changes");
    }
    if (input.toStatus === "PURCHASED" && order.paymentStatus !== "PAID" && !input.override) {
      throw AppError.conflict(
        'Cannot mark "PURCHASED" while unpaid — pass override:true with a note to proceed anyway',
        { paymentStatus: order.paymentStatus }
      );
    }
  } else {
    if (order.assignedPartnerId !== user.id) throw AppError.notFound("Order not found");
    if (!isPartnerForwardStep(order.status, input.toStatus)) {
      throw AppError.conflict(`Cannot move order from "${order.status}" to "${input.toStatus}"`, {
        currentStatus: order.status,
      });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id },
      data: { status: input.toStatus },
      include: ORDER_INCLUDE,
    });
    await tx.orderStatusHistory.create({
      data: { orderId: id, fromStatus: order.status, toStatus: input.toStatus, changedByUserId: user.id, note: input.note },
    });
    return result;
  });

  if (input.toStatus === HANDOFF_STATUS && updated.assignedPartnerId) {
    await enqueueEmailAndNotification(
      "handoff_confirmed",
      { orderId: updated.id, recipientUserId: updated.assignedPartnerId },
      "handoff_confirmed"
    );
  }

  if (input.toStatus === "DELIVERED") {
    await enqueueEmailAndNotification(
      "order_delivered",
      { orderId: updated.id, recipientEmail: updated.customerEmail ?? undefined, recipientPhone: updated.customerPhone },
      "order_delivered"
    );
  }

  if (input.toStatus === "DECLINED" || input.toStatus === "UNAVAILABLE") {
    const template: NotificationTemplate = input.toStatus === "DECLINED" ? "declined" : "unavailable";
    await enqueueEmailAndNotification(
      template,
      { orderId: updated.id, recipientEmail: updated.customerEmail ?? undefined, recipientPhone: updated.customerPhone },
      template
    );
  }

  return serializeOrderForRole(updated as OrderWithRelations, user.role);
}

export async function getHistory(user: AuthUser, id: string) {
  await getOrder(user, id); // enforces visibility
  return prisma.orderStatusHistory.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "asc" },
    include: { changedByUser: { select: { id: true, name: true, role: true } } },
  });
}
