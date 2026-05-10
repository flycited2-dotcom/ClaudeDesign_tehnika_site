export type PriceMode = "formula" | "rrp" | "not_below_rrp" | "manual";

export type CalculateRetailPriceInput = {
  supplierPrice: number;
  markupPercent?: number;
  minMarkupRub?: number;
  manualPrice?: number | null;
  rrp?: number | null;
  mode?: PriceMode;
};

export function roundRetailPrice(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  const step = amount < 1000 ? 10 : amount < 10000 ? 50 : 100;
  return Math.ceil(amount / step) * step;
}

export function calculateRetailPrice({
  supplierPrice,
  markupPercent = 25,
  minMarkupRub = 300,
  manualPrice,
  rrp,
  mode = "formula",
}: CalculateRetailPriceInput): number {
  if (manualPrice && manualPrice > 0) {
    return manualPrice;
  }

  if (mode === "rrp" && rrp && rrp > 0) {
    return roundRetailPrice(rrp);
  }

  const formulaPrice = Math.max(
    supplierPrice + minMarkupRub,
    supplierPrice * (1 + markupPercent / 100),
  );

  if (mode === "not_below_rrp" && rrp && rrp > formulaPrice) {
    return roundRetailPrice(rrp);
  }

  return roundRetailPrice(formulaPrice);
}
