"use client";

import Link from "next/link";
import { useSession } from "@/context/SessionContext";
import { OrderCard } from "@/components/kaya/OrderCard";
import { sideColor } from "@/components/kaya/CorridorTracker";
import { GridIcon, BoxCubeIcon, PlugInIcon, ListIcon, BoxIconLine } from "@/icons";
import { Order, OrderStatus, STATUS_LABELS } from "@/lib/types";

const STAT_ACCENT: Record<"abidjan" | "handoff" | "niamey", string> = {
  abidjan: "before:bg-abidjan-500",
  handoff: "before:bg-handoff-400",
  niamey: "before:bg-niamey-500",
};

function StatTile({ label, count, phase }: { label: string; count: number; phase: "abidjan" | "handoff" | "niamey" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 pl-5 shadow-theme-xs before:absolute before:left-0 before:top-0 before:h-full before:w-1 dark:border-gray-800 dark:bg-white/[0.03] ${STAT_ACCENT[phase]}`}
    >
      <p className="text-2xl font-semibold tabular-nums text-gray-800 dark:text-white/90">{count}</p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function QuickAction({ href, icon, label, description }: { href: string; icon: React.ReactNode; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs transition hover:-translate-y-0.5 hover:border-abidjan-300 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-abidjan-700"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-abidjan-50 text-abidjan-600 transition group-hover:bg-abidjan-600 group-hover:text-white dark:bg-abidjan-500/10 dark:text-abidjan-400">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </Link>
  );
}

function count(orders: Order[], statuses: OrderStatus[]) {
  return orders.filter((o) => statuses.includes(o.status)).length;
}

export function DashboardHome({ initialOrders }: { initialOrders: Order[] }) {
  const user = useSession();
  const orders = initialOrders;
  const firstName = user.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  if (user.role === "SUPER_ADMIN") {
    const needsAttention = orders
      .filter((o) => o.status === "QUOTED" || o.status === "RECEIVED_HUB")
      .slice(0, 5);
    const recent = orders.slice(0, 5);

    return (
      <div>
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-abidjan-600 via-abidjan-500 to-niamey-500 p-6 text-white shadow-theme-lg sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
            {user.hub ? `${user.hub.city}, ${user.hub.country}` : "Hub non configuré"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-white/80">
            Voici un aperçu de votre activité. Créez une intention, suivez vos cotations et gérez vos boutiques.
          </p>
        </div>

        {!user.hubId && (
          <div className="mb-6 rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center dark:border-gray-700 dark:bg-white/[0.03]">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Configurez votre hub pour commencer</p>
            <Link
              href="/hub-setup"
              className="mt-2 inline-block rounded-lg bg-abidjan-600 px-4 py-2 text-sm font-medium text-white hover:bg-abidjan-700"
            >
              Configurer mon hub
            </Link>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label={STATUS_LABELS.QUOTING} count={count(orders, ["QUOTING"])} phase={sideColor("QUOTING")} />
          <StatTile label="Devis à envoyer" count={count(orders, ["QUOTED"])} phase={sideColor("QUOTED")} />
          <StatTile label="Attente paiement" count={count(orders, ["QUOTE_SENT"])} phase={sideColor("QUOTE_SENT")} />
          <StatTile label="À confirmer" count={count(orders, ["RECEIVED_HUB"])} phase={sideColor("RECEIVED_HUB")} />
          <StatTile
            label="En livraison"
            count={count(orders, ["PICKED_UP", "IN_TRANSIT"])}
            phase={sideColor("PICKED_UP")}
          />
          <StatTile label="Livrées" count={count(orders, ["DELIVERED"])} phase={sideColor("DELIVERED")} />
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/orders" icon={<ListIcon />} label="Nouvelle intention" description="Créer une commande client" />
          <QuickAction href="/products" icon={<GridIcon />} label="Rechercher des produits" description="Chercher et réserver" />
          <QuickAction href="/stores" icon={<BoxCubeIcon />} label="Boutiques" description="Gérer les boutiques" />
          <QuickAction href="/hub-setup" icon={<PlugInIcon />} label="Mon hub" description="Voir ou changer de hub" />
        </div>

        {needsAttention.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Nécessite votre attention</h2>
              <Link href="/orders" className="text-xs font-medium text-abidjan-600 hover:underline dark:text-abidjan-400">
                Voir tout
              </Link>
            </div>
            <div className="space-y-3">
              {needsAttention.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Commandes récentes</h2>
            <Link href="/orders" className="text-xs font-medium text-abidjan-600 hover:underline dark:text-abidjan-400">
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Aucune commande pour le moment.</p>}
            {recent.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // LOGISTICS_PARTNER
  const recent = orders.slice(0, 5);
  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-niamey-600 via-niamey-500 to-abidjan-500 p-6 text-white shadow-theme-lg sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Partenaire logistique</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-white/80">
          Voici vos colis assignés : cotations à soumettre et livraisons en cours.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={STATUS_LABELS.QUOTING} count={count(orders, ["QUOTING"])} phase={sideColor("QUOTING")} />
        <StatTile label="Prêtes à récupérer" count={count(orders, ["CONFIRMED_HUB"])} phase={sideColor("CONFIRMED_HUB")} />
        <StatTile
          label="En route"
          count={count(orders, ["PICKED_UP", "IN_TRANSIT"])}
          phase={sideColor("PICKED_UP")}
        />
        <StatTile label="Livrées" count={count(orders, ["DELIVERED"])} phase={sideColor("DELIVERED")} />
      </div>

      <div className="mb-6">
        <QuickAction href="/deliveries" icon={<BoxIconLine />} label="Mes livraisons" description="Voir toutes les livraisons assignées" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Colis récents</h2>
          <Link href="/deliveries" className="text-xs font-medium text-niamey-600 hover:underline dark:text-niamey-400">
            Voir tout
          </Link>
        </div>
        <div className="space-y-3">
          {recent.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Aucun colis assigné pour le moment.</p>}
          {recent.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
}
