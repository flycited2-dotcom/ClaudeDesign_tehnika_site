"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { clearCompare, COMPARE_MAX, useCompare } from "@/lib/sku-list-storage";
import { SkuListGrid } from "@/components/sku-list-grid";

export default function ComparePage() {
  const compare = useCompare();

  return (
    <>
      <div className="bread">
        <Link href="/">Главная</Link>
        <span>›</span>
        <span>Сравнение</span>
      </div>

      <div className="section-head" style={{ margin: "6px 4px 18px" }}>
        <div>
          <h2>Сравнение</h2>
          <div className="meta">
            {compare.length > 0
              ? `${compare.length} из ${COMPARE_MAX} товаров`
              : "Добавьте товары к сравнению"}
          </div>
        </div>
        {compare.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => clearCompare()}>
            <Trash2 size={14} aria-hidden /> Очистить
          </button>
        )}
      </div>

      <SkuListGrid
        skus={compare}
        emptyTitle="Сравнивать пока нечего"
        emptySubtitle={`Нажимайте на иконку сравнения в карточке товара. До ${COMPARE_MAX} товаров одновременно.`}
        emptyCtaLabel="В каталог"
        emptyCtaHref="/catalog"
      />
    </>
  );
}
