import { env } from "../../config/env";
import { SmsProvider } from "./types";
import { consoleSmsProvider } from "./consoleProvider";

// No local Niger/CI SMS gateway is wired up yet — SMS_PROVIDER accepts any
// non-"console" value as a placeholder for a future gateway adapter, but
// falls back to the console logger so the app runs with zero credentials.
export const smsProvider: SmsProvider =
  env.SMS_PROVIDER === "console" ? consoleSmsProvider : consoleSmsProvider;

export * from "./types";
