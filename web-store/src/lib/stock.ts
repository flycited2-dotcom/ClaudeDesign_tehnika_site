export type StockState = "out" | "low" | "available" | "plenty";

export function mapSupplierStock(value: string | null | undefined): StockState {
  if (!value || value === "0") {
    return "out";
  }

  if (value === "*") {
    return "low";
  }

  if (value === "**") {
    return "available";
  }

  if (value === "***") {
    return "plenty";
  }

  return "out";
}

export function stockLabel(state: StockState | string): string {
  const labels: Record<StockState, string> = {
    out: "Нет в наличии",
    low: "Мало",
    available: "В наличии",
    plenty: "Много",
  };

  return labels[state as StockState] ?? labels.out;
}

export function stockTone(state: StockState | string): string {
  const tones: Record<StockState, string> = {
    out: "bg-zinc-100 text-zinc-500 ring-zinc-200",
    low: "bg-amber-50 text-amber-800 ring-amber-200",
    available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    plenty: "bg-teal-50 text-teal-700 ring-teal-200",
  };

  return tones[state as StockState] ?? tones.out;
}
