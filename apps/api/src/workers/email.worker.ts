import { Job, Worker } from "bullmq";
import { queueConnection } from "../queues/connection";
import { EmailJobData } from "../queues/email.queue";
import { prisma } from "../lib/prisma";
import { emailProvider } from "../providers/email";
import { buildNotificationContent } from "../modules/orders/notificationTemplates";
import {
  getOrCreateNotification,
  markNotificationFailed,
  markNotificationSent,
} from "../modules/notifications/notifications.service";

async function processEmailJob(job: Job<EmailJobData>) {
  const { orderId, recipientUserId, recipientEmail, template } = job.data;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { hub: true } });
  if (!order) {
    console.warn(`[email.worker] skipping job ${job.id}: order no longer exists`);
    return;
  }

  const recipient = recipientUserId ? await prisma.user.findUnique({ where: { id: recipientUserId } }) : null;
  const toAddress = recipient?.email ?? recipientEmail;
  if (!toAddress) {
    console.warn(`[email.worker] skipping job ${job.id}: no email address resolved`);
    return;
  }

  const { title, body } = buildNotificationContent(template, order);

  const email = await getOrCreateNotification({
    recipientUserId,
    recipientEmail: recipientUserId ? undefined : recipientEmail,
    orderId,
    channel: "EMAIL",
    title,
    body,
  });
  if (email.status === "SENT") return;

  try {
    await emailProvider.send({
      to: toAddress,
      subject: title,
      html: `<p>${body}</p>`,
    });
    await markNotificationSent(email.id);
  } catch (err) {
    const attempts = job.opts.attempts ?? 1;
    const isFinalAttempt = job.attemptsMade + 1 >= attempts;
    if (isFinalAttempt) await markNotificationFailed(email.id);
    throw err;
  }
}

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>("email", processEmailJob, {
    connection: queueConnection,
    concurrency: 5,
  });

  worker.on("completed", (job) => console.log(`[email.worker] completed job ${job.id}`));
  worker.on("failed", (job, err) => console.error(`[email.worker] job ${job?.id} failed:`, err.message));

  return worker;
}
