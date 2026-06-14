import { Prisma } from "@prisma/client";
import { buildOrderQuote, type CartInputItem } from "@/lib/checkout/validation";
import { getProductsForQuote } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { sendOrderNotificationSafely } from "@/lib/order-notifications";
import { getActiveRole } from "@/lib/role";
import { canPlaceDirectOrder } from "@/lib/role-pricing";

export type CheckoutInput = {
  customerName: string;
  phone: string;
  email?: string | null;
  comment?: string | null;
  cartItems: CartInputItem[];
  notificationKind?: "order" | "quick";
  sourceUrl?: string | null;
};

function orderNumber(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${suffix}`;
}

export async function quoteCart(cartItems: CartInputItem[]) {
  const products = await getProductsForQuote(cartItems.map((item) => item.sku));
  return buildOrderQuote({ cartItems, products });
}

export async function createLocalOrder(input: CheckoutInput) {
  const role = await getActiveRole();
  if (!canPlaceDirectOrder(role)) {
    throw new Error(
      "Оптовые и государственные заказы оформляются через запрос цены (КП): оставьте заявку на странице товара — менеджер подготовит предложение.",
    );
  }

  const quote = await quoteCart(input.cartItems);
  const orderNo = orderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber: orderNo,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      comment: input.comment,
      total: new Prisma.Decimal(quote.total),
      items: {
        create: quote.items.map((item) => ({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          supplierPrice: item.supplierPrice ? new Prisma.Decimal(item.supplierPrice) : undefined,
          total: new Prisma.Decimal(item.total),
        })),
      },
    },
    include: {
      items: true,
    },
  });

  await sendOrderNotificationSafely({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    comment: order.comment,
    kind: input.notificationKind,
    sourceUrl: input.sourceUrl,
    quote,
  });

  return order;
}
