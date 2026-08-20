"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { KAYA_API_URL } from "@/lib/apiBase";
import { productPlaceholder } from "@/lib/placeholderImage";
import { STATUS_LABELS, PublicQuote } from "@/lib/types";

async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${KAYA_API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error?.message ?? "Une erreur est survenue");
  return data as T;
}

export default function PublicQuotePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [decisionResult, setDecisionResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await publicRequest<PublicQuote>(`/q/${token}`);
      setQuote(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function decide(decision: "accept" | "decline") {
    setDeciding(true);
    setError(null);
    try {
      const result = await publicRequest<{ status: string; paymentInstructions?: string }>(`/q/${token}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      setDecisionResult(result.paymentInstructions ?? null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setDeciding(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-2xl font-bold text-abidjan-600 dark:text-abidjan-400">Kaya</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03]">
          {loading && <p className="text-center text-sm text-gray-500 dark:text-gray-400">Chargement de votre devis...</p>}

          {notFound && !loading && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Ce lien de devis est invalide ou a expiré.
            </p>
          )}

          {quote && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={quote.productImageUrl || productPlaceholder(quote.reference)}
                alt=""
                className="mx-auto h-32 w-32 rounded-xl border border-gray-200 object-cover dark:border-gray-800"
              />
              <p className="mt-4 text-center text-xs font-medium uppercase tracking-wide text-gray-400">{quote.reference}</p>
              <h1 className="mt-1 text-center text-lg font-semibold text-gray-800 dark:text-white/90">
                {quote.productName} {quote.quantity > 1 ? `× ${quote.quantity}` : ""}
              </h1>
              <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">{quote.route}</p>

              {quote.customerQuoteTotal != null && (
                <div className="mt-5 rounded-xl bg-abidjan-50 p-4 text-center dark:bg-abidjan-500/10">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-semibold text-abidjan-700 dark:text-abidjan-400">
                    {quote.customerQuoteTotal.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              )}

              <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
                Statut : <span className="font-medium">{STATUS_LABELS[quote.status]}</span>
              </p>

              {error && <p className="mt-3 text-center text-sm text-error-500">{error}</p>}

              {decisionResult && (
                <p className="mt-4 rounded-lg bg-success-50 px-3 py-2 text-center text-sm text-success-600 dark:bg-success-500/10 dark:text-success-400">
                  {decisionResult}
                </p>
              )}

              {quote.status === "QUOTE_SENT" && !decisionResult && (
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => decide("decline")}
                    disabled={deciding}
                    className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => decide("accept")}
                    disabled={deciding}
                    className="flex-1 rounded-lg bg-abidjan-600 py-2.5 text-sm font-semibold text-white hover:bg-abidjan-700 disabled:opacity-60"
                  >
                    {deciding ? "..." : "Accepter"}
                  </button>
                </div>
              )}

              {quote.status === "PAID" && (
                <p className="mt-5 text-center text-sm text-success-600 dark:text-success-400">
                  Paiement confirmé — votre commande est en préparation.
                </p>
              )}

              {quote.status === "DECLINED" && (
                <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">Vous avez refusé ce devis.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
