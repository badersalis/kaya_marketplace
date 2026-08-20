import { env } from "../../config/env";
import { EmailProvider } from "./types";
import { consoleEmailProvider } from "./consoleProvider";
import { smtpEmailProvider } from "./smtpProvider";

export const emailProvider: EmailProvider =
  env.EMAIL_PROVIDER === "smtp" ? smtpEmailProvider : consoleEmailProvider;

export * from "./types";
