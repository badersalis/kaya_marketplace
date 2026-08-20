import { Provider } from "@/lib/types";

export function ProviderBadge({ provider }: { provider: Provider | null }) {
  if (!provider) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
        Boutique inconnue
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-abidjan-50 py-0.5 pl-1.5 pr-2.5 text-xs font-medium text-abidjan-700 dark:bg-abidjan-500/10 dark:text-abidjan-400">
      {provider.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={provider.logoUrl} alt="" className="h-3.5 w-3.5 rounded-full bg-white object-contain" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-abidjan-500" />
      )}
      {provider.name}
    </span>
  );
}
