import { DeliveriesDashboard } from "./DeliveriesDashboard";
import { serverGet } from "@/lib/serverApi";
import { Order } from "@/lib/types";

export default async function DeliveriesPage() {
  const result = await serverGet<{ items: Order[] }>("/orders");
  return <DeliveriesDashboard initialOrders={result?.items ?? []} />;
}
