export interface SendSmsInput {
  to: string;
  text: string;
}

export interface SmsProvider {
  send(input: SendSmsInput): Promise<void>;
}
