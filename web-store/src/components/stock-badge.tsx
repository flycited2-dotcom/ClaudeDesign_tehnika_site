import { stockLabel, stockTone } from "@/lib/stock";

export function StockBadge({ state, label }: { state: string; label?: string }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${stockTone(state)}`}>
      {label ?? stockLabel(state)}
    </span>
  );
}
