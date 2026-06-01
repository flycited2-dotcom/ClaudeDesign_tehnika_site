export type Product = {
  id: string;
  sku: string;
  brand: string;
  model: string;
  group: string;
  price: number;
  stock: string;
  stockLabel: string;
  descShort: string;
  benefits: string[];
  photo: string;
};

export type CatalogSnapshot = {
  version: string;
  updated_at: string;
  products: Product[];
};
