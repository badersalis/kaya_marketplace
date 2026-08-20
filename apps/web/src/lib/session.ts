import { cookies } from "next/headers";
import { Role } from "./types";

export const SESSION_COOKIE = "kaya_token";

export interface TokenPayload {
  sub: string;
  role: Role;
  exp?: number;
}

// atob/TextDecoder (not Buffer) so this also works in the Edge runtime, where
// middleware.ts calls this without Node.js globals available.
function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

// The cookie is httpOnly so the browser's JS can never read it; this decode
// is server-only and used purely for routing/UX. The Express API is the only
// place the JWT signature is actually verified for authorization.
export function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(base64UrlDecode(payload)) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getServerToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getServerSession(): Promise<TokenPayload | null> {
  const token = await getServerToken();
  if (!token) return null;
  return decodeToken(token);
}
