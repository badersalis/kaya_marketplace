import { Queue } from "bullmq";
import { queueConnection } from "./connection";
import { NotificationTemplate } from "../modules/orders/notificationTemplates";

export interface EmailJobData {
  orderId: string;
  // Registered recipient (admin/partner). Omit for customer-direct sends.
  recipientUserId?: string;
  // Customer-direct send target (no User account — see §3).
  recipientEmail?: string;
  template: NotificationTemplate;
}

export const emailQueue = new Queue<EmailJobData>("email", {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 500,
    removeOnFail: 500,
  },
});
