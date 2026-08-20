import { ReservationsDashboard } from "./ReservationsDashboard";
import { serverGet } from "@/lib/serverApi";
import { Paginated, Reservation } from "@/lib/types";

export default async function ReservationsPage() {
  const result = await serverGet<Paginated<Reservation>>("/reservations?limit=100");
  return <ReservationsDashboard initialReservations={result?.items ?? []} initialTotal={result?.total ?? 0} />;
}
