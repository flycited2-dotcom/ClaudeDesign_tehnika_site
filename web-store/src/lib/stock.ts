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

