import { KAYA_API_URL } from "./apiBase";
import { getServerToken } from "./session";

export async function serverGet<T>(path: string): Promise<T | null> {
  const token = await getServerToken();
  if (!token) return null;

  const res = await fetch(`${KAYA_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return (await res.json()) as T;
}
