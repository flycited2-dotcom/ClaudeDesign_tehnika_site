// Settings are read from build-time inlined NEXT_PUBLIC_* env vars so the
// values are available both on the server and inside client components
// without prop-drilling.

const DEFAULT_B2B_DISCOUNT = 25;
const DEFAULT_B2B_MIN_QTY = 5;
const DEFAULT_GOV_ENABLED = true;

export type RolePricing = {
  b2bDiscountPercent: number;
  govEnabled: boolean;
  b2bMinQuantity: number;
};

function parsePercent(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 90) return fallback;
  return value;
}

export function getRolePricingConfig(): RolePricing {
  return {
    b2bDiscountPercent: parsePercent(
      process.env.NEXT_PUBLIC_B2B_DISCOUNT_PERCENT,
      DEFAULT_B2B_DISCOUNT,
    ),
    govEnabled:
      (process.env.NEXT_PUBLIC_GOV_QUOTE_ENABLED ?? String(DEFAULT_GOV_ENABLED)) !== "false",
    b2bMinQuantity: Math.max(
      1,
      Number(process.env.NEXT_PUBLIC_B2B_MIN_QTY ?? DEFAULT_B2B_MIN_QTY) | 0,
    ),
  };
}

export function computeB2BPrice(retailPrice: number, discountPercent: number): number {
  if (retailPrice <= 0) return 0;
  const discounted = retailPrice * (1 - discountPercent / 100);
  return Math.round(discounted / 10) * 10;
}
