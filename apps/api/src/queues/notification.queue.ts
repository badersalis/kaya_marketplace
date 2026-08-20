import { Queue } from "bullmq";
import { queueConnection } from "./connection";
import { NotificationTemplate } from "../modules/orders/notificationTemplates";

export interface NotificationJobData {
  orderId: string;
  // Registered recipient (admin/partner) — also gets an IN_APP row. Omit for customer-direct sends.
  recipientUserId?: string;
  // Customer-direct send target (no User account, no IN_APP inbox — see §3).
  recipientPhone?: string;
  template: NotificationTemplate;
}

export const notificationQueue = new Queue<NotificationJobData>("notification", {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 500,
    removeOnFail: 500,
  },
});
