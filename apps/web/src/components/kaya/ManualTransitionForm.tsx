"use client";

import { useState } from "react";
import { api } from "@/lib/apiClient";
import { ADMIN_MANUAL_TARGETS, Order, OrderStatus, STATUS_LABELS } from "@/lib/types";

const inputClasses =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-abidjan-400 focus:outline-hidden focus:ring-3 focus:ring-abidjan-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Free-form manual status change, available to the admin at any phase — every change requires a note and is audit-logged. */
export function ManualTransitionForm({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [toStatus, setToStatus] = useState<OrderStatus>(ADMIN_MANUAL_TARGETS[0]);
  const [note, setNote] = useState("");
  const [override, setOverride] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/orders/${order.id}/transition`, { toStatus, note, override: override || undefined });
      setNote("");
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transition impossible");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-gray-500 hover:underline dark:text-gray-400"
      >
        Modifier le statut manuellement
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Changement de statut manuel
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <select value={toStatus} onChange={(e) => setToStatus(e.target.value as OrderStatus)} className={inputClasses}>
          {ADMIN_MANUAL_TARGETS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (obligatoire)" className={inputClasses} />
      </div>
      {toStatus === "PURCHASED" && (
        <label className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
          Forcer même si non payé
        </label>
      )}
      {error && <p className="mt-2 text-xs text-error-500">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Annuler
        </button>
        <button
          onClick={submit}
          disabled={busy || !note.trim()}
          className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900 disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/20"
        >
          {busy ? "Application..." : "Appliquer"}
        </button>
      </div>
    </div>
  );
}
