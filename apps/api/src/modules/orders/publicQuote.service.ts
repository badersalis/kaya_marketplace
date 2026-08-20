import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { PublicDecisionInput } from "./orders.schema";
import { ORDER_INCLUDE, enqueueEmailAndNotification } from "./orders.service";
import { OrderWithRelations, serializeOrderForCustomer } from "./orders.serialize";

async function getByToken(token: string) {
  const order = await prisma.order.findUnique({ where: { quoteToken: token }, include: ORDER_INCLUDE });
  if (!order) throw AppError.notFound("Quote not found");
  return order;
}

export async function getPublicQuote(token: string) {
  const order = await getByToken(token);
  return serializeOrderForCustomer(order as OrderWithRelations);
}

export async function submitDecision(token: string, input: PublicDecisionInput) {
  const order = await getByToken(token);

  if (order.status !== "QUOTE_SENT") {
    throw AppError.conflict(`This quote can no longer be answered (status: "${order.status}")`, {
      currentStatus: order.status,
    });
  }

  if (input.decision === "decline") {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: "DECLINED" } });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: "QUOTE_SENT",
          toStatus: "DECLINED",
          changedByUserId: order.createdByUserId,
          note: "Customer declined via tokenized link",
        },
      });
    });
    return { status: "DECLINED" as const };
  }

  // Accept doesn't change the status — payment is confirmed by the admin via
  // /orders/:id/mark-paid in v1. It just flags the admin to follow up.
  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN", hubId: order.hubId } });
  if (admin) {
    await enqueueEmailAndNotification("quote_accepted", { orderId: order.id, recipientUserId: admin.id }, "quote_accepted");
  }
  return { status: "ACCEPTED" as const, paymentInstructions: "Un opérateur vous contactera pour finaliser le paiement." };
}
