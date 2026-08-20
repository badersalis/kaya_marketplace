import { NextRequest, NextResponse } from "next/server";
import { KAYA_API_URL } from "@/lib/apiBase";
import { getServerToken } from "@/lib/session";

async function forward(req: NextRequest, pathParts: string[]) {
  const token = await getServerToken();
  if (!token) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const targetUrl = `${KAYA_API_URL}/${pathParts.join("/")}${req.nextUrl.search}`;

  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const bodyText = await req.text();
    if (bodyText) init.body = bodyText;
  }

  const apiRes = await fetch(targetUrl, init);
  const text = await apiRes.text();
  const contentType = apiRes.headers.get("content-type") ?? "application/json";

  // A 204 (or any no-content status) must have a null body — the Response
  // constructor throws even on an empty string.
  const hasBody = text.length > 0 && apiRes.status !== 204 && apiRes.status !== 205 && apiRes.status !== 304;

  return new NextResponse(hasBody ? text : null, {
    status: apiRes.status,
    headers: hasBody ? { "content-type": contentType } : undefined,
  });
}

type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return forward(req, path);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return forward(req, path);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return forward(req, path);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return forward(req, path);
}
