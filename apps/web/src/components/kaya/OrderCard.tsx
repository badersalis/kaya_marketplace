"use client";

import { useState } from "react";
import { CorridorTracker } from "./CorridorTracker";
import { ProviderBadge } from "./ProviderBadge";
import { StatusBadge } from "./StatusBadge";
import { productPlaceholder } from "@/lib/placeholderImage";
import { Order } from "@/lib/types";

export function OrderCard({ order, children }: { order: Order; children?: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.productImageUrl || productPlaceholder(order.id)}
            alt=""
            className="h-14 w-14 flex-shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-800"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{order.reference}</span>
              <ProviderBadge provider={order.provider} />
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {order.productName} {order.quantity > 1 ? `× ${order.quantity}` : ""}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {order.customerName} · {order.customerPhone}
            </p>
          </div>
        </div>
        {order.customerQuoteTotal != null && (
          <div className="whitespace-nowrap text-right text-sm font-semibold text-gray-800 dark:text-white/90">
            {order.customerQuoteTotal.toLocaleString("fr-FR")} FCFA
          </div>
        )}
      </div>

      <div className="mt-4">
        <CorridorTracker status={order.status} hubCity={order.hub.city} destinationCity={order.destinationCity} />
      </div>

      {children && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 text-xs font-medium text-abidjan-600 hover:underline dark:text-abidjan-400"
          >
            {expanded ? "Masquer les détails" : "Voir les détails"}
          </button>
          {expanded && <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">{children}</div>}
        </>
      )}
    </div>
  );
}
