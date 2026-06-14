"use client";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { QuoteRequestButton } from "@/components/quote-request-button";
import { formatRub } from "@/lib/format";
import { getRolePricingConfig } from "@/lib/role-pricing";
import { useStorefrontRole } from "@/lib/use-role";

/**
 * Sticky mobile buy bar, role-aware to match ProductBuyBlock. For gov the price
 * becomes "Цена по запросу" and the buy button is replaced with "Запросить КП"
 * so the gov flow stays consistent on mobile too.
 */
export function ProductMobBuyBar({
  sku,
  shortTitle,
  price,
  multiplicity,
  canOrder,
  productName,
  productHref,
}: {
  sku: number;
  shortTitle: string;
  price: number;
  multiplicity: number;
  canOrder: boolean;
  productName: string;
  productHref: string;
}) {
  const role = useStorefrontRole();
  const pricing = getRolePricingConfig();
  const isGovQuote = role === "gov" && pricing.govEnabled;
  // b2b and gov are quote-only — request a price (КП) instead of a direct order.
  const isQuoteOnly = role === "b2b" || isGovQuote;

  return (
    <div className="mob-buy-bar">
      <div className="row">
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="name">{shortTitle}</p>
          <p className="price">
            {isGovQuote ? "Цена по запросу" : price ? formatRub(price) : "Цена уточняется"}
          </p>
        </div>
        {isQuoteOnly ? (
          <QuoteRequestButton
            scope={role === "gov" ? "gov" : "b2b"}
            context={`${productName} — ${productHref}`}
            buttonLabel={role === "gov" ? "Запросить КП" : "Запросить опт-цену"}
            buttonClassName="btn btn-primary btn-sm"
          />
        ) : (
          <AddToCartButton sku={sku} multiplicity={multiplicity} disabled={!canOrder} compact />
        )}
      </div>
    </div>
  );
}
