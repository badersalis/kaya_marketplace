"use client";

import { useState } from "react";
import { api } from "@/lib/apiClient";
import { Order } from "@/lib/types";

const inputClasses =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-abidjan-400 focus:outline-hidden focus:ring-3 focus:ring-abidjan-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

export function QuotingDesk({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [productCost, setProductCost] = useState(order.productCost ?? "");
  const [currency, setCurrency] = useState(order.currency ?? order.hub.currency);
  const [platformFee, setPlatformFee] = useState(order.platformFee ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<unknown>) {
    setBusy(action);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(null);
    }
  }

  const quote = order.logisticsQuote;
  const total =
    productCost && quote
      ? Number(productCost) + Number(quote.amount) + (platformFee ? Number(platformFee) : Math.round(Number(productCost) * 0.12))
      : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Cotation logistique du partenaire
        </p>
        {quote ? (
          <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/5">
            <div className="flex justify-between font-medium text-gray-800 dark:text-white/90">
              <span>Total</span>
              <span>
                {Number(quote.amount).toLocaleString("fr-FR")} {quote.currency}
              </span>
            </div>
            <ul className="mt-1.5 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
              {quote.lineItems.map((li, i) => (
                <li key={i} className="flex justify-between">
                  <span>{li.label}</span>
                  <span>{li.amount.toLocaleString("fr-FR")}</span>
                </li>
              ))}
            </ul>
            {quote.note && <p className="mt-1.5 text-xs italic text-gray-400">{quote.note}</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">En attente de la cotation du partenaire.</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Coût produit</span>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={productCost}
              onChange={(e) => setProductCost(e.target.value)}
              className={inputClasses}
            />
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`${inputClasses} w-20 flex-shrink-0`}
            />
          </div>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
            Frais plateforme (défaut 12% si vide)
          </span>
          <input
            type="number"
            min="0"
            value={platformFee}
            onChange={(e) => setPlatformFee(e.target.value)}
            placeholder="Calculé automatiquement"
            className={inputClasses}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy === "cost" || !productCost}
          onClick={() =>
            run("cost", () => api.patch(`/orders/${order.id}`, { productCost: Number(productCost), currency }))
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          {busy === "cost" ? "Enregistrement..." : "Enregistrer le coût"}
        </button>
        <button
          disabled={busy === "fee" || !platformFee}
          onClick={() => run("fee", () => api.post(`/orders/${order.id}/fee`, { platformFee: Number(platformFee) }))}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          {busy === "fee" ? "Enregistrement..." : "Enregistrer les frais"}
        </button>
      </div>

      {total != null && order.status === "QUOTED" && (
        <div className="rounded-lg bg-abidjan-50 p-3 text-sm dark:bg-abidjan-500/10">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Total client estimé</span>
            <span className="font-semibold text-abidjan-700 dark:text-abidjan-400">
              {total.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
        </div>
      )}

      {order.status === "QUOTED" && (
        <button
          disabled={busy === "send" || !order.productCost || !quote}
          onClick={() => run("send", () => api.post(`/orders/${order.id}/send-quote`))}
          className="w-full rounded-lg bg-abidjan-600 py-2 text-sm font-semibold text-white transition hover:bg-abidjan-700 disabled:opacity-60"
        >
          {busy === "send" ? "Envoi..." : "Envoyer le devis au client"}
        </button>
      )}

      {order.status === "QUOTE_SENT" && (
        <div className="space-y-2">
          <div className="rounded-lg bg-abidjan-50 p-3 text-sm dark:bg-abidjan-500/10">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Devis envoyé</span>
              <span className="font-semibold text-abidjan-700 dark:text-abidjan-400">
                {order.customerQuoteTotal?.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Statut paiement : {order.paymentStatus === "PAID" ? "Payé" : "En attente"}
            </p>
          </div>
          <button
            disabled={busy === "paid"}
            onClick={() => run("paid", () => api.post(`/orders/${order.id}/mark-paid`))}
            className="w-full rounded-lg bg-success-600 py-2 text-sm font-semibold text-white transition hover:bg-success-700 disabled:opacity-60"
          >
            {busy === "paid" ? "Confirmation..." : "Marquer payé"}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-error-500">{error}</p>}
    </div>
  );
}
