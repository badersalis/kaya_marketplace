import { StoresDashboard } from "./StoresDashboard";
import { serverGet } from "@/lib/serverApi";
import { Provider } from "@/lib/types";

export default async function StoresPage() {
  const stores = await serverGet<Provider[]>("/providers?includeInactive=true");
  return <StoresDashboard initialStores={stores ?? []} />;
}
