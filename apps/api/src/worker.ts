import { env } from "./config/env";
import { startEmailWorker } from "./workers/email.worker";
import { startNotificationWorker } from "./workers/notification.worker";

console.log(`[worker] starting in ${env.NODE_ENV} mode, email provider=${env.EMAIL_PROVIDER}, sms provider=${env.SMS_PROVIDER}`);

const emailWorker = startEmailWorker();
const notificationWorker = startNotificationWorker();

async function shutdown() {
  console.log("[worker] shutting down...");
  await Promise.all([emailWorker.close(), notificationWorker.close()]);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[worker] email and notification workers are running");
