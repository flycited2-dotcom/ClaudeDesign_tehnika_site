"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { clearFavorites, useFavorites } from "@/lib/sku-list-storage";
import { SkuListGrid } from "@/components/sku-list-grid";

export default function FavoritesPage() {
  const favorites = useFavorites();

  return (
    <>
      <div className="bread">
        <Link href="/">Главная</Link>
        <span>›</span>
        <span>Избранное</span>
      </div>

      <div className="section-head" style={{ margin: "6px 4px 18px" }}>
        <div>
          <h2>Избранное</h2>
          <div className="meta">
            {favorites.length > 0
              ? `${favorites.length} ${favorites.length === 1 ? "товар" : favorites.length < 5 ? "товара" : "товаров"}`
              : "Список пуст"}
          </div>
        </div>
        {favorites.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => clearFavorites()}>
            <Trash2 size={14} aria-hidden /> Очистить
          </button>
        )}
      </div>

      <SkuListGrid
        skus={favorites}
        emptyTitle="В избранном пока пусто"
        emptySubtitle="Нажимайте на сердечко в карточке, чтобы сохранить интересные товары и вернуться к ним позже."
        emptyCtaLabel="В каталог"
        emptyCtaHref="/catalog"
        emptyImageSrc="/static/section-visuals/empty-favorites.png"
        emptyImageAlt="Пустое стеклянное сердце избранного"
      />
    </>
  );
}
