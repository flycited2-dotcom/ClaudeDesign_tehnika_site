import type { Product, ProductImage } from "@prisma/client";
import { ProductCard } from "@/components/product-card";

export function CatalogGrid({ products }: { products: Array<Product & { images?: ProductImage[] }> }) {
  if (!products.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
        <p className="text-lg font-semibold text-zinc-950">Товары не найдены</p>
        <p className="mt-2 text-sm text-zinc-500">Попробуйте изменить поиск, выбрать другой бренд или открыть весь каталог.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
