"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { IntentForm } from "@/components/kaya/IntentForm";
import { OrderCard } from "@/components/kaya/OrderCard";
import { OrderAdminPanel } from "@/components/kaya/OrderAdminPanel";
import { sideColor } from "@/components/kaya/CorridorTracker";
import { useSession } from "@/context/SessionContext";
import { Order, STATUS_LABELS, STATUS_SEQUENCE } from "@/lib/types";

const STAT_ACCENT: Record<"abidjan" | "handoff" | "niamey", string> = {
  abidjan: "before:bg-abidjan-500",
  handoff: "before:bg-handoff-400",
  niamey: "before:bg-niamey-500",
};

export function OrdersDashboard({ initialOrders }: { initialOrders: Order[] }) {
  const user = useSession();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const result = await api.get<{ items: Order[] }>("/orders");
      setOrders(result.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreated() {
    setShowForm(false);
    await refresh();
  }

  const counts = STATUS_SEQUENCE.reduce<Record<string, number>>((acc, status) => {
    acc[status] = orders.filter((o) => o.status === status).length;
    return acc;
  }, {});

  if (!user.hubId) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-white/[0.03]">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Configurez votre hub pour commencer</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-gray-500 dark:text-gray-400">
          Chaque commande est rattachée au hub de l&apos;opérateur qui la crée. Configurez le vôtre avant de créer une
          intention.
        </p>
        <Link
          href="/hub-setup"
          className="mt-3 inline-block rounded-lg bg-abidjan-600 px-4 py-2 text-sm font-medium text-white hover:bg-abidjan-700"
        >
          Configurer mon hub
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800 dark:text-white/90">Commandes</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Gérant · {user.hub?.city} — de la demande client à la confirmation au hub.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-abidjan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-abidjan-700"
        >
          {showForm ? "Fermer" : "+ Nouvelle intention"}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {STATUS_SEQUENCE.map((status) => (
          <div
            key={status}
            className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 pl-4 shadow-theme-xs before:absolute before:left-0 before:top-0 before:h-full before:w-1 dark:border-gray-800 dark:bg-white/[0.03] ${STAT_ACCENT[sideColor(status)]}`}
          >
            <p className="text-2xl font-semibold tabular-nums text-gray-800 dark:text-white/90">{counts[status] ?? 0}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{STATUS_LABELS[status]}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="mb-6">
          <IntentForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="space-y-3">
        {loading && orders.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des commandes...</p>
        )}
        {!loading && orders.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune commande pour le moment.</p>
        )}
        {orders.map((order) => (
          <OrderCard key={order.id} order={order}>
            <OrderAdminPanel order={order} onChanged={refresh} />
          </OrderCard>
        ))}
      </div>
    </div>
  );
}
