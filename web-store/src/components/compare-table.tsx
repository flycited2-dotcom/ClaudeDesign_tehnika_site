"use client";

import { ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { addCartItem } from "@/lib/cart-storage";
import { IllustratedEmptyState } from "@/components/illustrated-empty-state";
import { decimalToNumber } from "@/lib/catalog";
import { buildCompareRows, type CompareProduct } from "@/lib/compare-table-data";
import { formatRub } from "@/lib/format";
import { productShortTitle } from "@/lib/product-display";
import { productImageSrc } from "@/lib/product-images";
import { computeB2BPrice, getRolePricingConfig } from "@/lib/role-pricing";
import { toggleCompare, useCompare } from "@/lib/sku-list-storage";
import { useStorefrontRole } from "@/lib/use-role";

export function CompareTable({ skus }: { skus: number[] }) {
  const [products, setProducts] = useState<CompareProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyDiffs, setOnlyDiffs] = useState(false);
  // Keep a stable hook reference so order changes don't reshuffle the table.
  const liveCompare = useCompare();
  const role = useStorefrontRole();
  const pricing = getRolePricingConfig();

  const skuKey = skus.join(",");

  useEffect(() => {
    const controller = new AbortController();
    // setState directly in an effect trips react-hooks/set-state-in-effect.
    // Deferring via setTimeout(0) is the project-wide workaround (see SkuListGrid).
    if (skuKey.length === 0) {
      const timer = window.setTimeout(() => {
        setProducts([]);
        setError(null);
      }, 0);
      return () => {
        window.clearTimeout(timer);
        controller.abort();
      };
    }
    const resetTimer = window.setTimeout(() => setProducts(null), 0);
    fetch(`/api/catalog/products-by-sku?sku=${encodeURIComponent(skuKey)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((data: { products?: CompareProduct[] }) => {
        // Preserve user's compare order (API returns in DB order).
        const byId = new Map((data.products ?? []).map((p) => [p.sku, p]));
        const ordered = skus.map((sku) => byId.get(sku)).filter((p): p is CompareProduct => Boolean(p));
        setProducts(ordered);
        setError(null);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError("Не удалось загрузить товары. Попробуйте позже.");
      });

    return () => {
      window.clearTimeout(resetTimer);
      controller.abort();
    };
  }, [skuKey, skus]);

  // Drop products that the user removed from compare since the fetch.
  const liveProducts = useMemo(
    () => (products ?? []).filter((p) => liveCompare.includes(p.sku)),
    [products, liveCompare],
  );

  const allRows = useMemo(() => buildCompareRows(liveProducts), [liveProducts]);
  const rows = onlyDiffs ? allRows.filter((r) => r.hasDiff) : allRows;
  const diffCount = allRows.filter((r) => r.hasDiff).length;

  if (skus.length === 0) {
    return (
      <IllustratedEmptyState
        imageSrc="/static/section-visuals/empty-compare.png"
        imageAlt="Две пустые витрины для сравнения товаров"
        title="Сравнивать пока нечего"
        subtitle="Добавьте от 2 до 4 товаров через значок сравнения — здесь появится таблица с подсветкой отличий."
        ctaLabel="В каталог"
        ctaHref="/catalog"
      />
    );
  }

  if (error) {
    return (
      <div className="glass" style={{ padding: 24, borderRadius: 18, color: "var(--text-2)" }}>
        {error}
      </div>
    );
  }

  if (products === null) {
    return (
      <div className="glass" style={{ padding: 24, borderRadius: 18, color: "var(--text-mute)" }}>
        Загружаем товары…
      </div>
    );
  }

  if (liveProducts.length === 0) {
    return (
      <div className="glass" style={{ padding: 24, borderRadius: 18, color: "var(--text-2)" }}>
        Товары из списка больше недоступны.
      </div>
    );
  }

  function priceFor(p: CompareProduct): string {
    if (role === "gov" && pricing.govEnabled) return "Цена по запросу";
    const price = decimalToNumber(p.retailPrice);
    if (price <= 0) return "Цена уточняется";
    if (role === "b2b") {
      return `${formatRub(computeB2BPrice(price, pricing.b2bDiscountPercent))} (опт от ${pricing.b2bMinQuantity} шт)`;
    }
    return formatRub(price);
  }

  function handleAddToCart(p: CompareProduct) {
    const price = decimalToNumber(p.retailPrice);
    if (!p.isAvailable || price <= 0) return;
    const qty = Math.max(p.multiplicity || 1, 1);
    addCartItem(p.sku, qty);
  }

  return (
    <div className="compare-wrap">
      <div className="compare-toolbar">
        <label className="compare-toggle">
          <input
            type="checkbox"
            checked={onlyDiffs}
            onChange={(e) => setOnlyDiffs(e.target.checked)}
          />
          <span>Только отличия</span>
          {diffCount > 0 && <span className="compare-toggle-count">{diffCount}</span>}
        </label>
      </div>

      <div className="compare-scroll glass">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col" className="compare-th-label" aria-label="Характеристика" />
              {liveProducts.map((p) => {
                const fullName = p.name ?? p.supplierName;
                const name = productShortTitle(fullName, p.vendor, p.part, 80);
                const image = productImageSrc(p.images?.[0]);
                const canOrder = p.isAvailable && decimalToNumber(p.retailPrice) > 0;
                return (
                  <th key={p.sku} scope="col" className="compare-th-product">
                    <div className="compare-prod">
                      <button
                        type="button"
                        className="compare-prod-remove"
                        onClick={() => toggleCompare(p.sku)}
                        aria-label="Убрать из сравнения"
                        title="Убрать из сравнения"
                      >
                        <X size={14} aria-hidden />
                      </button>
                      <Link href={`/product/${p.slug}`} className="compare-prod-photo">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt={name} loading="lazy" />
                        ) : (
                          <span className="compare-prod-photo-empty">Фото уточняется</span>
                        )}
                      </Link>
                      {p.vendor && <div className="compare-prod-vendor">{p.vendor}</div>}
                      <Link href={`/product/${p.slug}`} className="compare-prod-name">
                        {name}
                      </Link>
                      <div className="compare-prod-price">{priceFor(p)}</div>
                      <button
                        type="button"
                        className="btn btn-primary compare-prod-buy"
                        onClick={() => handleAddToCart(p)}
                        disabled={!canOrder}
                      >
                        <ShoppingCart size={14} aria-hidden /> В корзину
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={liveProducts.length + 1} className="compare-empty-row">
                  {onlyDiffs
                    ? "У выбранных товаров нет отличий по доступным характеристикам."
                    : "Нет характеристик для отображения."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.label} className={row.hasDiff ? "diff" : ""}>
                  <th scope="row" className="compare-row-label">
                    {row.label}
                  </th>
                  {row.values.map((value, idx) => (
                    <td key={idx} className="compare-cell">
                      {value}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
