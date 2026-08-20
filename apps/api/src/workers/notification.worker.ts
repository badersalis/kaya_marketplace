import { Job, Worker } from "bullmq";
import { queueConnection } from "../queues/connection";
import { NotificationJobData } from "../queues/notification.queue";
import { prisma } from "../lib/prisma";
import { smsProvider } from "../providers/sms";
import { buildNotificationContent } from "../modules/orders/notificationTemplates";
import {
  getOrCreateNotification,
  markNotificationFailed,
  markNotificationSent,
} from "../modules/notifications/notifications.service";

async function processNotificationJob(job: Job<NotificationJobData>) {
  const { orderId, recipientUserId, recipientPhone, template } = job.data;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { hub: true } });
  if (!order) {
    console.warn(`[notification.worker] skipping job ${job.id}: order no longer exists`);
    return;
  }

  const recipient = recipientUserId ? await prisma.user.findUnique({ where: { id: recipientUserId } }) : null;
  const toPhone = recipient?.phone ?? recipientPhone;

  const { title, body } = buildNotificationContent(template, order);

  // Only registered users (admin/partner) get an in-app inbox entry — customers have no account to read it in.
  if (recipientUserId) {
    const inApp = await getOrCreateNotification({
      recipientUserId,
      orderId,
      channel: "IN_APP",
      title,
      body,
    });
    if (inApp.status === "PENDING") {
      await markNotificationSent(inApp.id);
    }
  }

  const sms = await getOrCreateNotification({
    recipientUserId,
    recipientPhone: recipientUserId ? undefined : recipientPhone,
    orderId,
    channel: "SMS",
    title,
    body,
  });
  if (sms.status === "SENT") return;

  try {
    if (!toPhone) throw new Error(`No phone number resolved for job ${job.id}`);
    await smsProvider.send({ to: toPhone, text: body });
    await markNotificationSent(sms.id);
  } catch (err) {
    const attempts = job.opts.attempts ?? 1;
    const isFinalAttempt = job.attemptsMade + 1 >= attempts;
    if (isFinalAttempt) await markNotificationFailed(sms.id);
    throw err;
  }
}

export function startNotificationWorker() {
  const worker = new Worker<NotificationJobData>("notification", processNotificationJob, {
    connection: queueConnection,
    concurrency: 5,
  });

  worker.on("completed", (job) => console.log(`[notification.worker] completed job ${job.id}`));
  worker.on("failed", (job, err) =>
    console.error(`[notification.worker] job ${job?.id} failed:`, err.message)
  );

  return worker;
}
