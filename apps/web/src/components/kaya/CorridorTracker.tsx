import { OrderStatus, STATUS_LABELS, STATUS_SEQUENCE } from "@/lib/types";

export type CorridorPhase = "abidjan" | "handoff" | "niamey";

// Hub-side ops (quoting through received-at-hub) = "abidjan" color; the
// handoff moment = amber; the partner's shipping leg = "niamey" color. Names
// kept from the original two-hub prototype, but the logic is corridor-agnostic
// — it's keyed on phase, not on any particular city.
export function sideColor(status: OrderStatus): CorridorPhase {
  if (status === "CONFIRMED_HUB") return "handoff";
  if (STATUS_SEQUENCE.indexOf(status) < STATUS_SEQUENCE.indexOf("CONFIRMED_HUB")) return "abidjan";
  return "niamey";
}

const FILLED_CLASSES: Record<CorridorPhase, string> = {
  abidjan: "bg-abidjan-500 border-abidjan-500",
  handoff: "bg-handoff-400 border-handoff-400",
  niamey: "bg-niamey-500 border-niamey-500",
};

const RING_CLASSES: Record<CorridorPhase, string> = {
  abidjan: "ring-abidjan-500",
  handoff: "ring-handoff-400",
  niamey: "ring-niamey-500",
};

export function CorridorTracker({ status, hubCity, destinationCity }: { status: OrderStatus; hubCity: string; destinationCity: string }) {
  if (status === "DECLINED" || status === "UNAVAILABLE") {
    return (
      <div className="flex items-center gap-2 text-xs text-error-600 dark:text-error-400">
        <span className="h-2 w-2 rounded-full bg-error-500" />
        {STATUS_LABELS[status]}
      </div>
    );
  }

  const currentIndex = STATUS_SEQUENCE.indexOf(status);

  return (
    <div>
      <div className="flex items-center">
        {STATUS_SEQUENCE.map((step, index) => {
          const isFilled = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const color = sideColor(step);

          return (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div
                title={STATUS_LABELS[step]}
                className={`h-3 w-3 flex-shrink-0 rounded-full border-2 transition ${
                  isFilled ? FILLED_CLASSES[color] : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                } ${isCurrent ? `ring-2 ring-offset-2 dark:ring-offset-gray-900 ${RING_CLASSES[color]}` : ""}`}
              />
              {index < STATUS_SEQUENCE.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    index < currentIndex
                      ? FILLED_CLASSES[sideColor(STATUS_SEQUENCE[index + 1])].split(" ")[0]
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
        <span>{hubCity}</span>
        <span>{destinationCity}</span>
      </div>
    </div>
  );
}
