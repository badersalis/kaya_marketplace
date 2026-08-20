import nodemailer from "nodemailer";
import { EmailProvider, SendEmailInput } from "./types";
import { env } from "../../config/env";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    if (!env.SMTP_URL) {
      throw new Error("SMTP_URL must be set when EMAIL_PROVIDER=smtp");
    }
    transporter = nodemailer.createTransport(env.SMTP_URL);
  }
  return transporter;
}

export const smtpEmailProvider: EmailProvider = {
  async send({ to, subject, html }: SendEmailInput) {
    await getTransporter().sendMail({
      from: "Kaya <no-reply@kaya.app>",
      to,
      subject,
      html,
    });
  },
};
