"use client";

import { ArrowLeftRight, Check, Heart, Share2 } from "lucide-react";
import { useState } from "react";
import { formatRub } from "@/lib/format";
import { QuoteRequestButton } from "@/components/quote-request-button";
import { computeB2BPrice, getRolePricingConfig } from "@/lib/role-pricing";
import {
  toggleCompare as toggleCompareStorage,
  toggleFavorite as toggleFavoriteStorage,
  useCompare,
  useFavorites,
} from "@/lib/sku-list-storage";
import { useStorefrontRole } from "@/lib/use-role";

function ShareButton({ productName, productHref }: { productName: string; productHref: string }) {
  const [justCopied, setJustCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}${productHref}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: productName, url });
      } catch {
        // User dismissed the native share sheet — nothing to do.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      // Clipboard API unavailable/denied — no fallback left to try.
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="btn btn-soft"
      style={{ flexShrink: 0, width: 44, padding: 0, justifyContent: "center" }}
      title={justCopied ? "Ссылка скопирована" : "Поделиться"}
      aria-label={justCopied ? "Ссылка скопирована" : "Поделиться товаром"}
    >
      {justCopied ? <Check size={16} aria-hidden /> : <Share2 size={16} aria-hidden />}
    </button>
  );
}

export function ProductAsideActions({
  sku,
  retailPrice,
  productName,
  productHref,
}: {
  sku: number;
  retailPrice: number;
  productName: string;
  productHref: string;
}) {
  const role = useStorefrontRole();
  const favorites = useFavorites();
  const compare = useCompare();
  const pricing = getRolePricingConfig();
  const isFavorite = favorites.includes(sku);
  const isInCompare = compare.includes(sku);

  return (
    <>
      {role === "b2b" && retailPrice > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 16,
            background: "rgba(79,125,255,0.10)",
            border: "1px solid rgba(79,125,255,0.28)",
            color: "var(--accent-2)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, opacity: 0.85 }}>
            Опт от {pricing.b2bMinQuantity} шт
          </div>
          <div style={{ marginTop: 4, fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>
            {formatRub(computeB2BPrice(retailPrice, pricing.b2bDiscountPercent))}
          </div>
          <div style={{ marginTop: 6, fontSize: 12 }}>Подтверждение цены менеджером после заявки.</div>
        </div>
      )}

      {role === "gov" && pricing.govEnabled && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 16,
            background: "rgba(128,104,255,0.14)",
            border: "1px solid rgba(128,104,255,0.34)",
            color: "#4f3ad6",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, opacity: 0.85 }}>
            44-ФЗ / 223-ФЗ
          </div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
            Цена и условия по запросу. Подготовим КП с реквизитами и сертификатами.
          </div>
        </div>
      )}

      <div className="aside-fav-row" style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          type="button"
          onClick={() => toggleFavoriteStorage(sku)}
          aria-pressed={isFavorite}
          className="btn btn-soft"
          style={{
            flex: 1,
            minWidth: 0,
            justifyContent: "center",
            color: isFavorite ? "#ff5757" : undefined,
          }}
          title={isFavorite ? "Убрать из избранного" : "В избранное"}
        >
          <Heart size={16} aria-hidden fill={isFavorite ? "currentColor" : "none"} />
          {isFavorite ? "В избранном" : "В избранное"}
        </button>
        <button
          type="button"
          onClick={() => toggleCompareStorage(sku)}
          aria-pressed={isInCompare}
          className="btn btn-soft"
          style={{
            flex: 1,
            minWidth: 0,
            justifyContent: "center",
            color: isInCompare ? "var(--accent-2)" : undefined,
          }}
          title={isInCompare ? "Убрать из сравнения" : "К сравнению"}
        >
          <ArrowLeftRight size={16} aria-hidden />
          {isInCompare ? "В сравнении" : "К сравнению"}
        </button>
        <ShareButton productName={productName} productHref={productHref} />
      </div>

      {(role === "b2b" || role === "gov") && (
        <div style={{ marginTop: 14 }}>
          <QuoteRequestButton
            scope={role}
            context={`${productName} — ${productHref}`}
            buttonLabel={role === "gov" ? "Запросить КП" : "Запросить опт-цену"}
            buttonClassName="btn btn-primary"
            buttonStyle={{ width: "100%" }}
          />
        </div>
      )}
    </>
  );
}
