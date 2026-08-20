import { NotificationChannel } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";

export async function getOrCreateNotification(params: {
  recipientUserId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  orderId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
}) {
  const existing = await prisma.notification.findFirst({
    where: {
      recipientUserId: params.recipientUserId ?? null,
      recipientEmail: params.recipientEmail ?? null,
      recipientPhone: params.recipientPhone ?? null,
      orderId: params.orderId,
      channel: params.channel,
      title: params.title,
    },
  });
  if (existing) return existing;

  return prisma.notification.create({
    data: {
      recipientUserId: params.recipientUserId,
      recipientEmail: params.recipientEmail,
      recipientPhone: params.recipientPhone,
      orderId: params.orderId,
      channel: params.channel,
      title: params.title,
      body: params.body,
      status: "PENDING",
    },
  });
}

export async function markNotificationSent(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { status: "SENT", sentAt: new Date() },
  });
}

export async function markNotificationFailed(id: string) {
  return prisma.notification.update({ where: { id }, data: { status: "FAILED" } });
}

export async function listForUser(userId: string, page = 1, limit = 20) {
  const where = { recipientUserId: userId };

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { order: { select: { id: true, reference: true, status: true } } },
    }),
    prisma.notification.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function unreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: { recipientUserId: userId, channel: "IN_APP", status: { not: "READ" } },
  });
  return { count };
}

export async function markRead(userId: string, id: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.recipientUserId !== userId) {
    throw AppError.notFound("Notification not found");
  }
  return prisma.notification.update({ where: { id }, data: { status: "READ" } });
}
