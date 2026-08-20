"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { OrderCard } from "@/components/kaya/OrderCard";
import { OrderPartnerPanel } from "@/components/kaya/OrderPartnerPanel";
import { Notification, Order, Paginated, STATUS_LABELS } from "@/lib/types";

const PARTNER_STAGES = ["QUOTING", "CONFIRMED_HUB", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] as const;

export function DeliveriesDashboard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [result, notifs] = await Promise.all([
        api.get<{ items: Order[] }>("/orders"),
        api.get<Paginated<Notification>>("/notifications?limit=5"),
      ]);
      setOrders(result.items);
      setNotifications(notifs.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = PARTNER_STAGES.reduce<Record<string, number>>((acc, status) => {
    acc[status] = orders.filter((o) => o.status === status).length;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-800 dark:text-white/90">Livraisons</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Demandes de cotation et colis confirmés, prêts à prendre la route.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {PARTNER_STAGES.map((status) => (
          <div key={status} className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-2xl font-semibold tabular-nums text-gray-800 dark:text-white/90">{counts[status] ?? 0}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{STATUS_LABELS[status]}</p>
          </div>
        ))}
      </div>

      {notifications.filter((n) => n.channel === "IN_APP").length > 0 && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Dernières notifications</h2>
          <ul className="space-y-2">
            {notifications
              .filter((n) => n.channel === "IN_APP")
              .map((n) => (
                <li key={n.id} className="text-sm">
                  <span className="font-medium text-gray-800 dark:text-white/90">{n.title}</span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">{n.body}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {loading && orders.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des livraisons...</p>
        )}
        {!loading && orders.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucun colis assigné pour le moment.</p>
        )}
        {orders.map((order) => (
          <OrderCard key={order.id} order={order}>
            <OrderPartnerPanel order={order} onChanged={refresh} />
          </OrderCard>
        ))}
      </div>
    </div>
  );
}
