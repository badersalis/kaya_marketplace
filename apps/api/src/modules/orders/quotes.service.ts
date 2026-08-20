import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { AuthUser } from "../../middleware/auth";
import { LogisticsQuoteInput } from "./orders.schema";
import { ORDER_INCLUDE, enqueueEmailAndNotification, maybeAdvanceToQuoted } from "./orders.service";
import { OrderWithRelations, serializeOrderForPartner } from "./orders.serialize";

async function getOwnedOrder(partnerId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order || order.assignedPartnerId !== partnerId) throw AppError.notFound("Order not found");
  return order;
}

/** Price-free view of the order the partner has been asked to quote. */
export async function getQuoteRequest(user: AuthUser, orderId: string) {
  if (user.role !== "LOGISTICS_PARTNER") throw AppError.forbidden();
  const order = await getOwnedOrder(user.id, orderId);
  return serializeOrderForPartner(order as OrderWithRelations);
}

/** Creates or updates the order's single logistics quote. */
export async function submitLogisticsQuote(user: AuthUser, orderId: string, input: LogisticsQuoteInput) {
  if (user.role !== "LOGISTICS_PARTNER") throw AppError.forbidden();
  const order = await getOwnedOrder(user.id, orderId);

  if (order.status !== "QUOTING" && order.status !== "QUOTED") {
    throw AppError.conflict(`Cannot submit a logistics quote once the order is "${order.status}"`, {
      currentStatus: order.status,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.logisticsQuote.upsert({
      where: { orderId },
      update: {
        amount: input.amount,
        currency: input.currency,
        lineItems: input.lineItems,
        note: input.note,
        status: order.logisticsQuote ? "REVISED" : "SUBMITTED",
      },
      create: {
        orderId,
        submittedByUserId: user.id,
        amount: input.amount,
        currency: input.currency,
        lineItems: input.lineItems,
        note: input.note,
        status: "SUBMITTED",
      },
    });
    await maybeAdvanceToQuoted(tx, orderId, user.id);
  });

  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN", hubId: order.hubId } });
  if (admin) {
    await enqueueEmailAndNotification(
      "logistics_quote_submitted",
      { orderId, recipientUserId: admin.id },
      "logistics_quote_submitted"
    );
  }

  const fresh = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  return serializeOrderForPartner(fresh! as OrderWithRelations);
}
