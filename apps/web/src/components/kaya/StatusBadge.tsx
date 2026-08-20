import { OrderStatus, STATUS_LABELS, STATUS_SEQUENCE } from "@/lib/types";

function classesFor(status: OrderStatus): string {
  if (status === "DECLINED" || status === "UNAVAILABLE") {
    return "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400";
  }
  if (status === "CONFIRMED_HUB") {
    return "bg-handoff-50 text-handoff-600 dark:bg-handoff-500/10 dark:text-handoff-400";
  }
  if (STATUS_SEQUENCE.indexOf(status) < STATUS_SEQUENCE.indexOf("CONFIRMED_HUB")) {
    return "bg-abidjan-50 text-abidjan-700 dark:bg-abidjan-500/10 dark:text-abidjan-400";
  }
  return "bg-niamey-50 text-niamey-600 dark:bg-niamey-500/10 dark:text-niamey-400";
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classesFor(status)}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
