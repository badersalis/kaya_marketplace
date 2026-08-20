import { NextRequest, NextResponse } from "next/server";
import { KAYA_API_URL } from "@/lib/apiBase";
import { SESSION_COOKIE, decodeToken } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const apiRes = await fetch(`${KAYA_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();

  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const { token, user } = data as { token: string; user: unknown };
  const payload = decodeToken(token);
  const maxAge = payload?.exp ? payload.exp - Math.floor(Date.now() / 1000) : 60 * 60 * 24 * 7;

  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return res;
}
