"use client";

import { QuotingDesk } from "./QuotingDesk";
import { FulfillmentPanel } from "./FulfillmentPanel";
import { ManualTransitionForm } from "./ManualTransitionForm";
import { Order } from "@/lib/types";

const QUOTING_PHASE = new Set(["QUOTING", "QUOTED", "QUOTE_SENT"]);
const FULFILLMENT_PHASE = new Set(["PAID", "PURCHASED", "RECEIVED_HUB", "CONFIRMED_HUB", "PICKED_UP", "IN_TRANSIT", "DELIVERED"]);

export function OrderAdminPanel({ order, onChanged }: { order: Order; onChanged: () => void }) {
  return (
    <div className="space-y-4">
      {QUOTING_PHASE.has(order.status) && <QuotingDesk order={order} onChanged={onChanged} />}
      {FULFILLMENT_PHASE.has(order.status) && <FulfillmentPanel order={order} onChanged={onChanged} />}
      {(order.status === "DECLINED" || order.status === "UNAVAILABLE") && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Commande close.</p>
      )}
      <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
        <ManualTransitionForm order={order} onChanged={onChanged} />
      </div>
    </div>
  );
}
