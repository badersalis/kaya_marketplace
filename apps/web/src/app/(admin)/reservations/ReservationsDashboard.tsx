"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { IntentForm } from "@/components/kaya/IntentForm";
import { productPlaceholder } from "@/lib/placeholderImage";
import { Paginated, Reservation } from "@/lib/types";

const PAGE_LIMIT = 100;

export function ReservationsDashboard({
  initialReservations,
  initialTotal,
}: {
  initialReservations: Reservation[];
  initialTotal: number;
}) {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [total, setTotal] = useState(initialTotal);
  const [converting, setConverting] = useState<Reservation | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const result = await api.get<Paginated<Reservation>>(`/reservations?limit=${PAGE_LIMIT}`);
    setReservations(result.items);
    setTotal(result.total);
  }

  async function remove(id: string) {
    setRemovingId(id);
    setError(null);
    try {
      await api.delete(`/reservations/${id}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de retirer cette réservation");
    } finally {
      setRemovingId(null);
    }
  }

  function handleConverted() {
    setConverting(null);
    refresh();
  }

  const reserved = reservations.filter((r) => r.status === "RESERVED");
  const converted = reservations.filter((r) => r.status === "CONVERTED");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-800 dark:text-white/90">Produits réservés</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Produits mis de côté depuis la recherche. Transformez-les en commande dès qu&apos;un client est prêt.
        </p>
        {total > reservations.length && (
          <p className="mt-1 text-xs text-gray-400">
            Affichage des {reservations.length} plus récents sur {total} au total.
          </p>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </p>
      )}

      {converting && (
        <div className="mb-6">
          <IntentForm
            onCreated={handleConverted}
            onCancel={() => setConverting(null)}
            initialProduct={{
              url: converting.url,
              name: converting.title ?? undefined,
              imageUrl: converting.imageUrl ?? undefined,
              provider: converting.provider,
              reservationId: converting.id,
            }}
          />
        </div>
      )}

      <div className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          En attente ({reserved.length})
        </p>
        {reserved.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun produit réservé.{" "}
            <Link href="/products" className="font-medium text-abidjan-600 underline dark:text-abidjan-400">
              Rechercher des produits
            </Link>
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reserved.map((r) => (
              <div
                key={r.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-gray-50 dark:bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.imageUrl || productPlaceholder(r.id)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {r.provider?.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.provider.logoUrl}
                      alt=""
                      className="absolute left-2 top-2 h-6 w-6 rounded-md bg-white/90 object-contain p-1 shadow-sm"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <p className="line-clamp-2 flex-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {r.title ?? "Produit sans titre"}
                  </p>
                  {r.price != null && (
                    <p className="mt-2 text-base font-semibold text-abidjan-700 dark:text-abidjan-400">
                      {Number(r.price).toLocaleString("fr-FR")} <span className="text-xs font-normal text-gray-400">{r.currency}</span>
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setConverting(r)}
                      className="flex-1 rounded-lg bg-abidjan-600 py-2 text-xs font-semibold text-white transition hover:bg-abidjan-700"
                    >
                      Créer une commande
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      disabled={removingId === r.id}
                      className="rounded-lg border border-gray-300 px-2.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-white/5"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {converted.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Transformées en commande ({converted.length})
          </p>
          <div className="space-y-2">
            {converted.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <span className="text-gray-600 dark:text-gray-300">{r.title ?? "Produit sans titre"}</span>
                {r.order && (
                  <Link href="/orders" className="font-medium text-abidjan-600 hover:underline dark:text-abidjan-400">
                    {r.order.reference}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
