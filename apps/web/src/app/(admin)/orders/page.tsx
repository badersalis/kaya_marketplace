import { OrdersDashboard } from "./OrdersDashboard";
import { serverGet } from "@/lib/serverApi";
import { Order } from "@/lib/types";

export default async function OrdersPage() {
  const result = await serverGet<{ items: Order[] }>("/orders");
  return <OrdersDashboard initialOrders={result?.items ?? []} />;
}
