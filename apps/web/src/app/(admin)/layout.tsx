import { redirect } from "next/navigation";
import AdminShell from "@/layout/AdminShell";
import { SessionProvider } from "@/context/SessionContext";
import { serverGet } from "@/lib/serverApi";
import { SessionUser } from "@/lib/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await serverGet<SessionUser>("/auth/me");
  if (!user) redirect("/login");

  return (
    <SessionProvider user={user}>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
