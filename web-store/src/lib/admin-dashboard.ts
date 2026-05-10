import { OrderStatus } from "@prisma/client";

export type DashboardOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  status: OrderStatus;
  total: number;
  comment?: string | null;
  createdAt: Date;
};

export type DashboardQueueTone = "red" | "amber" | "teal" | "zinc";

export function isQuickOrder(comment: string | null | undefined): boolean {
  return (comment ?? "").toLocaleLowerCase("ru-RU").includes("быстрый заказ");
}

export function buildAdminDashboardMetrics({
  products,
  availableProducts,
  productsWithoutImages,
  productsWithoutPrices,
  orders,
}: {
  now: Date;
  products: number;
  availableProducts: number;
  productsWithoutImages: number;
  productsWithoutPrices: number;
  orders: DashboardOrder[];
}) {
  const newOrders = orders.filter((order) => order.status === OrderStatus.NEW).length;
  const processingOrders = orders.filter((order) => order.status === OrderStatus.PROCESSING).length;
  const activeStatuses = new Set<OrderStatus>([OrderStatus.NEW, OrderStatus.PROCESSING, OrderStatus.CONFIRMED, OrderStatus.SENT_TO_SUPPLIER]);
  const activeOrders = orders.filter((order) => activeStatuses.has(order.status)).length;
  const quickOrders = orders.filter((order) => isQuickOrder(order.comment)).length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return {
    productCoverage: {
      total: products,
      available: availableProducts,
      withoutImages: productsWithoutImages,
      withoutPrices: productsWithoutPrices,
    },
    sales: {
      totalOrders: orders.length,
      newOrders,
      activeOrders,
      quickOrders,
      totalRevenue,
    },
    actionQueue: [
      { label: "Новые заявки", count: newOrders, tone: "red" as DashboardQueueTone },
      { label: "В работе", count: processingOrders, tone: "amber" as DashboardQueueTone },
      { label: "Быстрые заказы", count: quickOrders, tone: "teal" as DashboardQueueTone },
      { label: "Товары без фото", count: productsWithoutImages, tone: "zinc" as DashboardQueueTone },
      { label: "Товары без цены", count: productsWithoutPrices, tone: "zinc" as DashboardQueueTone },
    ],
    latestOrders: orders.slice(0, 8),
  };
}
