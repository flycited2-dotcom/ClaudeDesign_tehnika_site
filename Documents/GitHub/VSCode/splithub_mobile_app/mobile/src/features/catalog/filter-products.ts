import type { Product } from './types';

export function filterProducts(products: Product[], search: string, group: string) {
  const needle = search.trim().toLocaleLowerCase('ru');
  return products.filter(
    (product) =>
      (!group || product.group === group) &&
      (!needle ||
        `${product.brand} ${product.model}`.toLocaleLowerCase('ru').includes(needle)),
  );
}
