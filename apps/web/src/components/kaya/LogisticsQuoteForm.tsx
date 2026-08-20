"use client";

import { useState } from "react";
import { api } from "@/lib/apiClient";
import { LogisticsQuoteLineItem, Order } from "@/lib/types";

const inputClasses =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-niamey-400 focus:outline-hidden focus:ring-3 focus:ring-niamey-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export function LogisticsQuoteForm({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const existing = order.logisticsQuote;
  const [lineItems, setLineItems] = useState<LogisticsQuoteLineItem[]>(
    existing?.lineItems ?? [
      { label: "Transport", amount: 0 },
      { label: "Manutention", amount: 0 },
    ]
  );
  const [currency, setCurrency] = useState(existing?.currency ?? order.hub.currency);
  const [note, setNote] = useState(existing?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = lineItems.reduce((sum, li) => sum + (Number(li.amount) || 0), 0);

  function updateItem(index: number, patch: Partial<LogisticsQuoteLineItem>) {
    setLineItems((items) => items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setLineItems((items) => [...items, { label: "", amount: 0 }]);
  }

  function removeItem(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/orders/${order.id}/logistics-quote`, {
        amount: total,
        currency,
        lineItems: lineItems.filter((li) => li.label.trim()),
        note: note || undefined,
      });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer la cotation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {existing ? "Cotation logistique (modifier)" : "Cotation logistique"}
      </p>
      <div className="space-y-2">
        {lineItems.map((li, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={li.label}
              onChange={(e) => updateItem(i, { label: e.target.value })}
              placeholder="Libellé (ex. Transport)"
              className={`flex-1 ${inputClasses}`}
            />
            <input
              type="number"
              min="0"
              value={li.amount || ""}
              onChange={(e) => updateItem(i, { amount: Number(e.target.value) })}
              placeholder="Montant"
              className={`w-28 ${inputClasses}`}
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="rounded-lg border border-gray-300 px-2 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addItem} className="text-xs font-medium text-niamey-600 hover:underline dark:text-niamey-400">
        + Ajouter une ligne
      </button>

      <div className="flex items-center gap-2">
        <input value={currency} onChange={(e) => setCurrency(e.target.value)} className={`w-20 flex-shrink-0 ${inputClasses}`} />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optionnel)" className={inputClasses} />
      </div>

      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/5">
        <span className="text-gray-600 dark:text-gray-300">Total</span>
        <span className="font-semibold text-gray-800 dark:text-white/90">
          {total.toLocaleString("fr-FR")} {currency}
        </span>
      </div>

      {error && <p className="text-xs text-error-500">{error}</p>}

      <button
        onClick={submit}
        disabled={busy || total <= 0}
        className="w-full rounded-lg bg-niamey-500 py-2 text-sm font-semibold text-white transition hover:bg-niamey-600 disabled:opacity-60"
      >
        {busy ? "Envoi..." : existing ? "Mettre à jour la cotation" : "Envoyer la cotation"}
      </button>
    </div>
  );
}
