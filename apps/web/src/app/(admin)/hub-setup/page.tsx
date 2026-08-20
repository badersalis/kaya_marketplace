import { HubSetup } from "./HubSetup";
import { serverGet } from "@/lib/serverApi";
import { SessionUser } from "@/lib/types";

export default async function HubSetupPage() {
  const user = await serverGet<SessionUser>("/auth/me");
  return <HubSetup currentHub={user?.hub ?? null} />;
}
