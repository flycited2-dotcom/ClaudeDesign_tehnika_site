export type CartInputItem = {
  sku: number;
  quantity: number;
};

export type QuoteProduct = {
  sku: number;
  name: string;
  price: number;
  supplierPrice?: number | null;
  multiplicity: number;
  isAvailable: boolean;
  productId?: string;
};

export type OrderQuoteItem = {
  sku: number;
  name: string;
  quantity: number;
  unitPrice: number;
  supplierPrice?: number | null;
  total: number;
  productId?: string;
  multiplicity: number;
};

export type OrderQuote = {
  items: OrderQuoteItem[];
  total: number;
};

export function validatePersonalDataConsent(value: FormDataEntryValue | null | undefined): void {
  if (value !== "on") {
    throw new Error("Подтвердите согласие на обработку персональных данных.");
  }
}

export function buildOrderQuote({
  cartItems,
  products,
}: {
  cartItems: CartInputItem[];
  products: QuoteProduct[];
}): OrderQuote {
  const productsBySku = new Map(products.map((product) => [product.sku, product]));
  const items: OrderQuoteItem[] = [];

  for (const cartItem of cartItems) {
    if (!Number.isInteger(cartItem.quantity) || cartItem.quantity <= 0) {
      throw new Error("Количество товара должно быть положительным числом.");
    }

    const product = productsBySku.get(cartItem.sku);
    if (!product) {
      throw new Error(`Товар SKU ${cartItem.sku} не найден.`);
    }

    if (!product.isAvailable) {
      throw new Error(`${product.name} сейчас нет в наличии.`);
    }

    const multiplicity = Math.max(product.multiplicity || 1, 1);
    if (cartItem.quantity % multiplicity !== 0) {
      throw new Error(`${product.name} продается кратно ${multiplicity} шт.`);
    }

    const total = product.price * cartItem.quantity;
    items.push({
      sku: product.sku,
      name: product.name,
      quantity: cartItem.quantity,
      unitPrice: product.price,
      supplierPrice: product.supplierPrice,
      total,
      productId: product.productId,
      multiplicity,
    });
  }

  return {
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
  };
}
