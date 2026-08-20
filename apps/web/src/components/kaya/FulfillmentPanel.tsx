"use client";

import { useState } from "react";
import { api } from "@/lib/apiClient";
import { Order, OrderStatus } from "@/lib/types";

const STEP: Partial<Record<OrderStatus, { toStatus: OrderStatus; label: string }>> = {
  PAID: { toStatus: "PURCHASED", label: "Marquer acheté" },
  PURCHASED: { toStatus: "RECEIVED_HUB", label: "Marquer reçu au hub" },
  RECEIVED_HUB: { toStatus: "CONFIRMED_HUB", label: "Confirmer et transmettre au partenaire" },
};

export function FulfillmentPanel({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = STEP[order.status];

  if (!step) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {order.status === "PICKED_UP" || order.status === "IN_TRANSIT"
          ? "En cours de livraison par le partenaire."
          : order.status === "DELIVERED"
            ? "Livré."
            : null}
      </p>
    );
  }

  async function advance() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/orders/${order.id}/transition`, { toStatus: step!.toStatus, note });
      setNote("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (obligatoire)"
        className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-abidjan-400 focus:outline-hidden focus:ring-3 focus:ring-abidjan-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
      />
      {error && <p className="text-xs text-error-500">{error}</p>}
      <button
        onClick={advance}
        disabled={busy || !note.trim()}
        className={`w-full rounded-lg py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
          step.toStatus === "CONFIRMED_HUB" ? "bg-handoff-400 hover:bg-handoff-500" : "bg-abidjan-600 hover:bg-abidjan-700"
        }`}
      >
        {busy ? "Mise à jour..." : step.label}
      </button>
    </div>
  );
}
