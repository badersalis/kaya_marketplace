"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { GeoDetectResult, Hub } from "@/lib/types";

const inputClasses =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-abidjan-400 focus:outline-hidden focus:ring-3 focus:ring-abidjan-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export function HubSetup({ currentHub }: { currentHub: { id: string; name: string; city: string } | null }) {
  const router = useRouter();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [detect, setDetect] = useState<GeoDetectResult | null>(null);
  const [selectedHubId, setSelectedHubId] = useState<string>(currentHub?.id ?? "");
  const [creatingNew, setCreatingNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newHub, setNewHub] = useState({
    name: "",
    city: "",
    country: "",
    countryCode: "",
    latitude: 0,
    longitude: 0,
    timezone: "Africa/Abidjan",
    currency: "XOF",
  });

  useEffect(() => {
    (async () => {
      try {
        const [hubList, geo] = await Promise.all([
          api.get<Hub[]>("/hubs"),
          api.get<GeoDetectResult>("/geo/detect"),
        ]);
        setHubs(hubList);
        setDetect(geo);
        if (!selectedHubId && geo.nearestHubId) setSelectedHubId(geo.nearestHubId);
        if (geo.location) {
          setNewHub((h) => ({ ...h, city: geo.location!.city, country: geo.location!.country }));
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmExisting() {
    setSaving(true);
    setError(null);
    try {
      await api.patch("/me/hub", { hubId: selectedHubId });
      router.push("/orders");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer le hub");
    } finally {
      setSaving(false);
    }
  }

  async function createAndConfirm() {
    setSaving(true);
    setError(null);
    try {
      await api.patch("/me/hub", { newHub });
      router.push("/orders");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le hub");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Détection de votre position...</p>;
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-800 dark:text-white/90">
        {currentHub ? "Mon hub" : "Configurez votre hub"}
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Le hub est le point de réception de l&apos;opérateur — l&apos;origine de chaque commande. Toutes vos commandes
        seront rattachées à ce hub.
      </p>

      {detect?.location && (
        <p className="mt-4 rounded-lg bg-abidjan-50 px-3 py-2 text-xs text-abidjan-700 dark:bg-abidjan-500/10 dark:text-abidjan-400">
          Position détectée : {detect.location.city}, {detect.location.country}
        </p>
      )}

      {!creatingNew ? (
        <div className="mt-5 space-y-3">
          {hubs.map((hub) => (
            <label
              key={hub.id}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                selectedHubId === hub.id
                  ? "border-abidjan-500 bg-abidjan-50 dark:border-abidjan-400 dark:bg-abidjan-500/10"
                  : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/5"
              }`}
            >
              <input
                type="radio"
                name="hub"
                checked={selectedHubId === hub.id}
                onChange={() => setSelectedHubId(hub.id)}
              />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {hub.name}
                  {detect?.nearestHubId === hub.id && (
                    <span className="ml-2 rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-medium text-success-600 dark:bg-success-500/10 dark:text-success-400">
                      Le plus proche
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {hub.city}, {hub.country} · {hub.currency}
                </p>
              </div>
            </label>
          ))}

          {error && <p className="text-sm text-error-500">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCreatingNew(true)}
              className="text-sm font-medium text-abidjan-600 hover:underline dark:text-abidjan-400"
            >
              + Créer un nouveau hub
            </button>
            <button
              onClick={confirmExisting}
              disabled={saving || !selectedHubId}
              className="rounded-lg bg-abidjan-600 px-4 py-2 text-sm font-medium text-white hover:bg-abidjan-700 disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Confirmer ce hub"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom">
              <input value={newHub.name} onChange={(e) => setNewHub((h) => ({ ...h, name: e.target.value }))} className={inputClasses} />
            </Field>
            <Field label="Devise">
              <input
                value={newHub.currency}
                onChange={(e) => setNewHub((h) => ({ ...h, currency: e.target.value }))}
                className={inputClasses}
              />
            </Field>
            <Field label="Ville">
              <input value={newHub.city} onChange={(e) => setNewHub((h) => ({ ...h, city: e.target.value }))} className={inputClasses} />
            </Field>
            <Field label="Pays">
              <input
                value={newHub.country}
                onChange={(e) => setNewHub((h) => ({ ...h, country: e.target.value }))}
                className={inputClasses}
              />
            </Field>
            <Field label="Code pays (2 lettres)">
              <input
                maxLength={2}
                value={newHub.countryCode}
                onChange={(e) => setNewHub((h) => ({ ...h, countryCode: e.target.value.toUpperCase() }))}
                className={inputClasses}
              />
            </Field>
            <Field label="Fuseau horaire">
              <input
                value={newHub.timezone}
                onChange={(e) => setNewHub((h) => ({ ...h, timezone: e.target.value }))}
                className={inputClasses}
              />
            </Field>
            <Field label="Latitude">
              <input
                type="number"
                value={newHub.latitude}
                onChange={(e) => setNewHub((h) => ({ ...h, latitude: Number(e.target.value) }))}
                className={inputClasses}
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                value={newHub.longitude}
                onChange={(e) => setNewHub((h) => ({ ...h, longitude: Number(e.target.value) }))}
                className={inputClasses}
              />
            </Field>
          </div>

          {error && <p className="text-sm text-error-500">{error}</p>}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setCreatingNew(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              onClick={createAndConfirm}
              disabled={saving || !newHub.name || !newHub.city || !newHub.country || !newHub.countryCode}
              className="rounded-lg bg-abidjan-600 px-4 py-2 text-sm font-medium text-white hover:bg-abidjan-700 disabled:opacity-60"
            >
              {saving ? "Création..." : "Créer et confirmer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  );
}
