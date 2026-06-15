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
  // Calm, systematic colour: one urgency role (red, for new leads waiting),
  // accent for other actionable counts, muted for reference catalog numbers.
  const queueValueTone = {
    red: "alert",
    amber: "accent",
    teal: "accent",
    zinc: "muted",
  } as const;

  const salesMetrics = [
    ["Заявок всего", dashboard.sales.totalOrders.toLocaleString("ru-RU"), ClipboardList],
    ["Активные заявки", dashboard.sales.activeOrders.toLocaleString("ru-RU"), PhoneCall],
    ["Оборот заявок", formatRub(dashboard.sales.totalRevenue), BadgeCheck],
    ["В наличии", dashboard.productCoverage.available.toLocaleString("ru-RU"), PackageCheck],
  ] as const;

  return (
    <AdminShell title="Обзор">
      <section>
        <div className="adm-section-head">
          <h2>Оперативная работа</h2>
          <p className="adm-section-meta">Заявки и качество каталога</p>
        </div>
        <div className="grid grid-cols-2 gap-[14px] sm:grid-cols-3 xl:grid-cols-5">
          {dashboard.actionQueue.map((item) => (
            <div key={item.label} className="adm-metric">
              <p className="adm-metric-l">{item.label}</p>
              <p className={`adm-metric-v ${queueValueTone[item.tone]}`}>{item.count.toLocaleString("ru-RU")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="adm-section-head">
          <h2>Сводка</h2>
        </div>
        <div className="adm-metrics">
          {salesMetrics.map(([label, value, Icon]) => (
            <div key={label} className="adm-metric">
              <div className="adm-metric-head">
                <p className="adm-metric-l">{label}</p>
                <Icon size={18} aria-hidden />
              </div>
              <p className="adm-metric-v">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="adm-card">
          <div className="adm-section-head">
            <h3>Последние заявки</h3>
            <Link href="/admin/orders" className="adm-topbar-link">
              Все заказы
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="divide-y divide-[rgba(33,52,108,0.1)]">
            {dashboard.latestOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="grid gap-2 rounded-xl px-2 py-3 text-sm transition hover:bg-[rgba(79,125,255,0.06)] sm:grid-cols-[1fr_120px_120px]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold" style={{ color: "var(--accent-2)" }}>
                      {order.orderNumber}
                    </span>
                    {order.comment?.toLocaleLowerCase("ru-RU").includes("быстрый заказ") ? (
                      <span className="adm-badge adm-badge--active">
                        <Zap size={12} aria-hidden />
                        быстрый
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate" style={{ color: "var(--text-mute)" }}>
                    {order.customerName} · {order.phone}
                  </p>
                </div>
                <span className="font-semibold" style={{ color: "var(--text-2)" }}>
                  {order.status}
                </span>
                <span className="font-bold" style={{ color: "var(--text)" }}>
                  {formatRub(order.total)}
                </span>
              </Link>
            ))}
            {!dashboard.latestOrders.length ? (
              <p className="py-4 text-sm" style={{ color: "var(--text-mute)" }}>
                Заявок пока нет.
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="adm-card">
            <div className="adm-section-head">
              <h3>Качество каталога</h3>
            </div>
            <div className="grid gap-2 text-sm">
              {[
                [ImageOff, "Без фото", dashboard.productCoverage.withoutImages],
                [AlertCircle, "Без цены", dashboard.productCoverage.withoutPrices],
                [CameraOff, "Всего товаров", dashboard.productCoverage.total],
              ].map(([Icon, label, value]) => {
                const TypedIcon = Icon as typeof ImageOff;
                return (
                  <div
                    key={label as string}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.55)", border: "1px solid var(--glass-stroke)" }}
                  >
                    <span className="inline-flex items-center gap-2" style={{ color: "var(--text-2)" }}>
                      <TypedIcon size={16} aria-hidden style={{ color: "var(--text-mute)" }} />
                      {label as string}
                    </span>
                    <strong style={{ color: "var(--text)" }}>{(value as number).toLocaleString("ru-RU")}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-section-head">
              <h3>Популярные поиски</h3>
            </div>
            <div className="divide-y divide-[rgba(33,52,108,0.1)]">
              {popularSearches.map((item) => (
                <Link
                  key={item.term}
                  href={`/search?q=${encodeURIComponent(item.term)}`}
                  className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-sm transition hover:bg-[rgba(79,125,255,0.06)]"
                >
                  <span className="inline-flex min-w-0 items-center gap-2" style={{ color: "var(--text-2)" }}>
                    <Search size={16} aria-hidden style={{ color: "var(--text-mute)" }} className="shrink-0" />
                    <span className="truncate">{item.term}</span>
                  </span>
                  <strong className="shrink-0" style={{ color: "var(--text)" }}>
                    {item.count.toLocaleString("ru-RU")}
                  </strong>
                </Link>
              ))}
              {!popularSearches.length ? (
                <p className="py-4 text-sm" style={{ color: "var(--text-mute)" }}>
                  Поисковых запросов пока нет.
                </p>
              ) : null}
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-section-head">
              <h3>Последние синхронизации</h3>
            </div>
            <div className="grid gap-2 text-sm">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                  <span className="font-semibold" style={{ color: "var(--text)" }}>
                    {log.type}
                  </span>
                  <span style={{ color: "var(--text-mute)" }}>{formatDateTime(log.startedAt)}</span>
                  <span className={`adm-badge ${log.status === "success" ? "adm-badge--success" : log.status === "running" ? "adm-badge--running" : "adm-badge--danger"}`}>
                    {log.status}
                  </span>
                </div>
              ))}
              {!logs.length ? (
                <p className="py-4 text-sm" style={{ color: "var(--text-mute)" }}>
                  Логов пока нет.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
