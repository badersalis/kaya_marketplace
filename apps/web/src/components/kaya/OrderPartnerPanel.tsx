"use client";

import { useState } from "react";
import { api } from "@/lib/apiClient";
import { LogisticsQuoteForm } from "./LogisticsQuoteForm";
import { Order, PARTNER_NEXT_ACTION_LABELS, PARTNER_NEXT_STATUS } from "@/lib/types";

const QUOTING_PHASE = new Set(["QUOTING", "QUOTED"]);

export function OrderPartnerPanel({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatus = PARTNER_NEXT_STATUS[order.status];

  async function advance() {
    if (!nextStatus) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(`/orders/${order.id}/transition`, { toStatus: nextStatus });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }

  if (QUOTING_PHASE.has(order.status)) {
    return <LogisticsQuoteForm order={order} onChanged={onChanged} />;
  }

  if (order.status === "QUOTE_SENT" || order.status === "PAID" || order.status === "PURCHASED" || order.status === "RECEIVED_HUB") {
    return <p className="text-sm text-gray-500 dark:text-gray-400">En attente de confirmation de prise en charge par le hub.</p>;
  }

  if (nextStatus) {
    return (
      <div className="space-y-2">
        {error && <p className="text-xs text-error-500">{error}</p>}
        <button
          onClick={advance}
          disabled={busy}
          className="w-full rounded-lg bg-niamey-500 py-2 text-sm font-semibold text-white transition hover:bg-niamey-600 disabled:opacity-60"
        >
          {busy ? "Mise à jour..." : PARTNER_NEXT_ACTION_LABELS[order.status]}
        </button>
      </div>
    );
  }

  return <p className="text-sm text-gray-500 dark:text-gray-400">Livré.</p>;
}
