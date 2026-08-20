"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/apiClient";
import { Provider } from "@/lib/types";

const inputClasses =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-abidjan-400 focus:outline-hidden focus:ring-3 focus:ring-abidjan-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

export function StoreForm({
  store,
  onSaved,
  onCancel,
}: {
  store?: Provider;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(store?.name ?? "");
  const [slug, setSlug] = useState(store?.slug ?? "");
  const [domains, setDomains] = useState(store?.domains.join(", ") ?? "");
  const [type, setType] = useState<Provider["type"]>(store?.type ?? "LOCAL_MARKETPLACE");
  const [defaultCurrency, setDefaultCurrency] = useState(store?.defaultCurrency ?? "");
  const [logoUrl, setLogoUrl] = useState(store?.logoUrl ?? "");
  const [isActive, setIsActive] = useState(store?.isActive ?? true);
  const [notes, setNotes] = useState(store?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name,
        slug,
        domains: domains
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        type,
        defaultCurrency,
        logoUrl: logoUrl || null,
        isActive,
        notes: notes || null,
      };
      if (store) {
        await api.patch(`/providers/${store.id}`, payload);
      } else {
        await api.post("/providers", payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer la boutique");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {store ? `Modifier ${store.name}` : "Nouvelle boutique"}
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Nom">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} />
        </Field>
        <Field label="Slug">
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="jumia"
            pattern="[a-z0-9-]+"
            disabled={!!store}
            className={`${inputClasses} disabled:opacity-60`}
          />
        </Field>
        <Field label="Domaines (séparés par des virgules)" className="sm:col-span-2">
          <input
            required
            value={domains}
            onChange={(e) => setDomains(e.target.value)}
            placeholder="jumia.ci, jumia.com"
            className={inputClasses}
          />
        </Field>
        <Field label="Type">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Provider["type"])}
            className={inputClasses}
          >
            <option value="LOCAL_MARKETPLACE">Marché local</option>
            <option value="INTERNATIONAL">International</option>
          </select>
        </Field>
        <Field label="Devise par défaut">
          <input
            required
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            placeholder="XOF"
            className={inputClasses}
          />
        </Field>
        <Field label="Logo (URL ou chemin local, ex : /images/brand/jumia.svg)" className="sm:col-span-2">
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="/images/brand/jumia.svg ou https://..."
            className={inputClasses}
          />
        </Field>
        <Field label="Notes internes" className="sm:col-span-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-abidjan-400 focus:outline-hidden focus:ring-3 focus:ring-abidjan-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Boutique active
        </label>
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
          {submitting ? "Enregistrement..." : store ? "Enregistrer" : "Créer la boutique"}
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
