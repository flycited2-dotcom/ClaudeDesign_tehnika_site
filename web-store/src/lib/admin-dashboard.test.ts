import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildAdminDashboardMetrics } from "@/lib/admin-dashboard";

describe("buildAdminDashboardMetrics", () => {
  it("summarizes sales and operational queues for managers", () => {
    const now = new Date("2026-05-03T10:00:00Z");

    expect(
      buildAdminDashboardMetrics({
        now,
        products: 100,
        availableProducts: 60,
        productsWithoutImages: 12,
        productsWithoutPrices: 8,
        orders: [
          {
            id: "1",
            orderNumber: "ORD-1",
            customerName: "Иван",
            phone: "+7",
            status: OrderStatus.NEW,
            total: 19800,
            comment: "Быстрый заказ с карточки товара.",
            createdAt: new Date("2026-05-03T09:00:00Z"),
          },
          {
            id: "2",
            orderNumber: "ORD-2",
            customerName: "Анна",
            phone: "+7",
            status: OrderStatus.PROCESSING,
            total: 5000,
            comment: null,
            createdAt: new Date("2026-05-02T08:00:00Z"),
          },
          {
            id: "3",
            orderNumber: "ORD-3",
            customerName: "Олег",
            phone: "+7",
            status: OrderStatus.COMPLETED,
            total: 7000,
            comment: null,
            createdAt: new Date("2026-05-01T08:00:00Z"),
          },
        ],
      }),
    ).toMatchObject({
      productCoverage: {
        total: 100,
        available: 60,
        withoutImages: 12,
        withoutPrices: 8,
      },
      sales: {
        totalOrders: 3,
        newOrders: 1,
        activeOrders: 2,
        quickOrders: 1,
        totalRevenue: 31800,
      },
      actionQueue: [
        { label: "Новые заявки", count: 1, tone: "red" },
        { label: "В работе", count: 1, tone: "amber" },
        { label: "Быстрые заказы", count: 1, tone: "teal" },
        { label: "Товары без фото", count: 12, tone: "zinc" },
        { label: "Товары без цены", count: 8, tone: "zinc" },
      ],
    });
  });
});
