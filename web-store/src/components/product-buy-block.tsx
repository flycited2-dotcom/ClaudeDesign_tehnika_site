"use client";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { QuickOrderForm } from "@/components/quick-order-form";
import { formatRub } from "@/lib/format";
import { getRolePricingConfig } from "@/lib/role-pricing";
import { useStorefrontRole } from "@/lib/use-role";

/**
 * Role-aware price + purchase controls for the product aside. For gov (when the
 * quote flow is enabled) the retail price, RRP and order buttons are hidden and
 * replaced with "Цена по запросу" — matching the catalog card and compare table,
 * so a gov visitor cannot order at retail and bypass the КП flow. b2c and b2b
 * see the price and buy controls as before (b2b also gets the opt note from
 * ProductAsideActions below).
 */
export function ProductBuyBlock({
  sku,
  price,
  rrp,
  multiplicity,
  canOrder,
  sourceUrl,
  deliveryLabel,
  confirmationNote,
}: {
  sku: number;
  price: number;
  rrp: number | null;
  multiplicity: number;
  canOrder: boolean;
  sourceUrl: string;
  deliveryLabel: string;
  confirmationNote: string;
}) {
  const role = useStorefrontRole();
  const pricing = getRolePricingConfig();
  const isGovQuote = role === "gov" && pricing.govEnabled;
  const minimumQuantity = Math.max(multiplicity || 1, 1);

  return (
    <>
      <div
        style={{
          marginTop: 20,
          fontSize: 36,
          fontWeight: 900,
          letterSpacing: "-0.02em",
          color: "var(--text)",
        }}
      >
        {isGovQuote ? "Цена по запросу" : price ? formatRub(price) : "Цена уточняется"}
      </div>
      {!isGovQuote && rrp ? (
        <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-mute)" }}>
          РРЦ: {formatRub(rrp)}
        </div>
      ) : null}
      <div
        style={{
          marginTop: 18,
          padding: 14,
          borderRadius: 16,
          background: "rgba(34,221,136,0.10)",
          color: "#0e6b3a",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <p style={{ fontWeight: 700 }}>{deliveryLabel}</p>
        <p style={{ marginTop: 4 }}>{confirmationNote}</p>
      </div>
      {!isGovQuote && (
        <>
          <div style={{ marginTop: 18 }}>
            <AddToCartButton sku={sku} multiplicity={multiplicity} disabled={!canOrder} />
          </div>
          <div style={{ marginTop: 12 }}>
            <QuickOrderForm sku={sku} quantity={minimumQuantity} sourceUrl={sourceUrl} disabled={!canOrder} />
          </div>
          {multiplicity > 1 ? (
            <p style={{ marginTop: 10, fontSize: 13, color: "#a85d00" }}>
              Заказ кратно {multiplicity} шт.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
