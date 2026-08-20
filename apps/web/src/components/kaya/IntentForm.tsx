"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/apiClient";
import { Provider, ResolveResult, VolumeTier, VOLUME_TIER_LABELS } from "@/lib/types";

const inputClasses =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-abidjan-400 focus:outline-hidden focus:ring-3 focus:ring-abidjan-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

export interface IntentFormInitialProduct {
  url: string;
  name?: string;
  imageUrl?: string;
  provider?: Provider | null;
  reservationId?: string;
}

export function IntentForm({
  onCreated,
  onCancel,
  initialProduct,
}: {
  onCreated: () => void;
  onCancel: () => void;
  initialProduct?: IntentFormInitialProduct;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [destinationCity, setDestinationCity] = useState("Niamey");
  const [destinationCountry, setDestinationCountry] = useState("Niger");
  const [productUrl, setProductUrl] = useState(initialProduct?.url ?? "");
  const [productName, setProductName] = useState(initialProduct?.name ?? "");
  const [productImageUrl, setProductImageUrl] = useState(initialProduct?.imageUrl ?? "");
  const [quantity, setQuantity] = useState("1");
  const [volumeTier, setVolumeTier] = useState<VolumeTier>("SMALL_UNITS");
  const [notes, setNotes] = useState("");

  const [provider, setProvider] = useState<Provider | null>(initialProduct?.provider ?? null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResolve() {
    if (!productUrl) return;
    setResolving(true);
    setResolveError(null);
    try {
      const result = await api.get<ResolveResult>(`/providers/resolve?url=${encodeURIComponent(productUrl)}`);
      if (result.providerSlug) {
        const providers = await api.get<Provider[]>("/providers");
        setProvider(providers.find((p) => p.slug === result.providerSlug) ?? null);
      } else {
        setProvider(null);
      }
      if (result.product.title && !productName) setProductName(result.product.title);
      if (result.product.imageUrl && !productImageUrl) setProductImageUrl(result.product.imageUrl);
    } catch {
      setResolveError("Aperçu indisponible, vous pouvez renseigner les champs manuellement.");
    } finally {
      setResolving(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/orders", {
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        destinationCity,
        destinationCountry,
        providerId: provider?.id,
        productUrl,
        productName: productName || undefined,
        productImageUrl: productImageUrl || undefined,
        quantity: quantity ? Number(quantity) : undefined,
        volumeTier,
        notes: notes || undefined,
        reservationId: initialProduct?.reservationId,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer l'intention");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Nouvelle intention</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Collez le lien du produit, renseignez la destination et les informations client. La cotation (coût produit,
        logistique, frais) se fait à l&apos;étape suivante.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Nom du client">
          <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClasses} />
        </Field>
        <Field label="Téléphone du client">
          <input
            required
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="+227..."
            className={inputClasses}
          />
        </Field>
        <Field label="Email du client (optionnel)">
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className={inputClasses}
          />
        </Field>
        <Field label="Quantité">
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClasses}
          />
        </Field>
        <Field label="Ville de destination">
          <input required value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} className={inputClasses} />
        </Field>
        <Field label="Pays de destination">
          <input
            required
            value={destinationCountry}
            onChange={(e) => setDestinationCountry(e.target.value)}
            className={inputClasses}
          />
        </Field>
        <Field label="Volume estimé" className="sm:col-span-2">
          <select value={volumeTier} onChange={(e) => setVolumeTier(e.target.value as VolumeTier)} className={inputClasses}>
            {(Object.keys(VOLUME_TIER_LABELS) as VolumeTier[]).map((tier) => (
              <option key={tier} value={tier}>
                {VOLUME_TIER_LABELS[tier]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Lien du produit">
          <div className="flex gap-2">
            <input
              required
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              onBlur={handleResolve}
              placeholder="https://www.jumia.ci/..."
              className={`flex-1 ${inputClasses}`}
            />
            <button
              type="button"
              onClick={handleResolve}
              disabled={resolving || !productUrl}
              className="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              {resolving ? "Analyse..." : "Détecter"}
            </button>
          </div>
          {provider && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-abidjan-700 dark:text-abidjan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-abidjan-500" /> Boutique détectée : {provider.name}
            </p>
          )}
          {resolveError && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{resolveError}</p>}
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[auto,1fr]">
        {productImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={productImageUrl}
            alt=""
            className="h-20 w-20 rounded-lg border border-gray-200 object-cover dark:border-gray-800"
          />
        )}
        <Field label="Nom du produit">
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="À confirmer manuellement si non détecté"
            className={inputClasses}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Notes internes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-abidjan-400 focus:outline-hidden focus:ring-3 focus:ring-abidjan-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </Field>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-abidjan-600 px-4 py-2 text-sm font-medium text-white hover:bg-abidjan-700 disabled:opacity-60"
        >
          {submitting ? "Création..." : "Créer l'intention"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  );
}
