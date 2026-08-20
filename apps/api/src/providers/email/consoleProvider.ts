import { EmailProvider, SendEmailInput } from "./types";

export const consoleEmailProvider: EmailProvider = {
  async send({ to, subject, html }: SendEmailInput) {
    console.log(`\n[email:console] To: ${to}\nSubject: ${subject}\n${html}\n`);
  },
};
