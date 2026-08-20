import { SmsProvider, SendSmsInput } from "./types";

export const consoleSmsProvider: SmsProvider = {
  async send({ to, text }: SendSmsInput) {
    console.log(`\n[sms:console] To: ${to}\n${text}\n`);
  },
};
