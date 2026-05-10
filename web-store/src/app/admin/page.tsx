import Link from "next/link";
import { AlertCircle, ArrowRight, BadgeCheck, CameraOff, ClipboardList, ImageOff, PackageCheck, PhoneCall, Search, Zap } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { buildAdminDashboardMetrics } from "@/lib/admin-dashboard";
import { prisma } from "@/lib/db";
import { formatDateTime, formatRub } from "@/lib/format";
import { getPopularSearchTerms } from "@/lib/search-analytics";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [products, availableProducts, productsWithoutImages, productsWithoutPrices, orders, logs, popularSearches] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isAvailable: true } }),
    prisma.product.count({ where: { isActive: true, isVisible: true, hasImage: false } }),
    prisma.product.count({ where: { isActive: true, isVisible: true, retailPrice: null } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        phone: true,
        status: true,
        total: true,
        comment: true,
        createdAt: true,
      },
    }),
    prisma.syncLog.findMany({ orderBy: { startedAt: "desc" }, take: 5 }),
    getPopularSearchTerms(8),
  ]);
  const dashboard = buildAdminDashboardMetrics({
    now: new Date(),
    products,
    availableProducts,
    productsWithoutImages,
    productsWithoutPrices,
    orders: orders.map((order) => ({
      ...order,
      total: Number(order.total),
    })),
  });
  const queueToneClasses = {
    red: "border-red-100 bg-red-50 text-red-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    teal: "border-teal-100 bg-teal-50 text-teal-800",
    zinc: "border-zinc-200 bg-white text-zinc-700",
  };

  return (
    <AdminShell title="Обзор">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {dashboard.actionQueue.map((item) => (
          <div key={item.label} className={`rounded-lg border p-4 shadow-sm ${queueToneClasses[item.tone]}`}>
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="mt-2 text-3xl font-black">{item.count.toLocaleString("ru-RU")}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Заявок всего", dashboard.sales.totalOrders.toLocaleString("ru-RU"), ClipboardList],
          ["Активные заявки", dashboard.sales.activeOrders.toLocaleString("ru-RU"), PhoneCall],
          ["Оборот заявок", formatRub(dashboard.sales.totalRevenue), BadgeCheck],
          ["В наличии", dashboard.productCoverage.available.toLocaleString("ru-RU"), PackageCheck],
        ].map(([label, value, Icon]) => (
          <div key={label as string} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-500">{label as string}</p>
              <Icon className="size-5 text-teal-700" aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-black text-zinc-950">{value as string}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-zinc-950">Последние заявки</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:text-teal-950">
              Все заказы
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-zinc-100">
            {dashboard.latestOrders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="grid gap-2 py-3 text-sm hover:bg-stone-50 sm:grid-cols-[1fr_120px_120px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-teal-800">{order.orderNumber}</span>
                    {order.comment?.toLocaleLowerCase("ru-RU").includes("быстрый заказ") ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                        <Zap className="size-3" aria-hidden />
                        быстрый
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-zinc-600">
                    {order.customerName} · {order.phone}
                  </p>
                </div>
                <span className="font-semibold text-zinc-700">{order.status}</span>
                <span className="font-bold text-zinc-950">{formatRub(order.total)}</span>
              </Link>
            ))}
            {!dashboard.latestOrders.length ? <p className="py-4 text-sm text-zinc-500">Заявок пока нет.</p> : null}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-950">Качество каталога</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-stone-50 p-3">
                <span className="inline-flex items-center gap-2 text-zinc-600">
                  <ImageOff className="size-4 text-zinc-400" aria-hidden />
                  Без фото
                </span>
                <strong>{dashboard.productCoverage.withoutImages.toLocaleString("ru-RU")}</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-stone-50 p-3">
                <span className="inline-flex items-center gap-2 text-zinc-600">
                  <AlertCircle className="size-4 text-zinc-400" aria-hidden />
                  Без цены
                </span>
                <strong>{dashboard.productCoverage.withoutPrices.toLocaleString("ru-RU")}</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-stone-50 p-3">
                <span className="inline-flex items-center gap-2 text-zinc-600">
                  <CameraOff className="size-4 text-zinc-400" aria-hidden />
                  Всего товаров
                </span>
                <strong>{dashboard.productCoverage.total.toLocaleString("ru-RU")}</strong>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-950">Популярные поиски</h2>
            <div className="mt-4 divide-y divide-zinc-100">
              {popularSearches.map((item) => (
                <Link key={item.term} href={`/search?q=${encodeURIComponent(item.term)}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-stone-50">
                  <span className="inline-flex min-w-0 items-center gap-2 text-zinc-700">
                    <Search className="size-4 shrink-0 text-zinc-400" aria-hidden />
                    <span className="truncate">{item.term}</span>
                  </span>
                  <strong className="shrink-0 text-zinc-950">{item.count.toLocaleString("ru-RU")}</strong>
                </Link>
              ))}
              {!popularSearches.length ? <p className="py-4 text-sm text-zinc-500">Поисковых запросов пока нет.</p> : null}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-950">Последние синхронизации</h2>
            <div className="mt-4 divide-y divide-zinc-100">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-semibold">{log.type}</span>
                  <span className="text-zinc-500">{formatDateTime(log.startedAt)}</span>
                  <span className={log.status === "success" ? "text-emerald-700" : log.status === "running" ? "text-amber-700" : "text-red-700"}>
                    {log.status}
                  </span>
                </div>
              ))}
              {!logs.length ? <p className="py-4 text-sm text-zinc-500">Логов пока нет.</p> : null}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
