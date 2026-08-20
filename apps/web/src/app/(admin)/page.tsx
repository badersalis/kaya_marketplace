import { DashboardHome } from "./DashboardHome";
import { serverGet } from "@/lib/serverApi";
import { Order } from "@/lib/types";

export default async function RootPage() {
  const result = await serverGet<{ items: Order[] }>("/orders?limit=50");
  return <DashboardHome initialOrders={result?.items ?? []} />;
}
