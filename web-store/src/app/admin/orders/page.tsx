import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { AdminShell } from "@/components/admin-shell";
import { CatalogPager } from "@/components/catalog-pager";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatDateTime, formatRub } from "@/lib/format";
import { orderStatusMeta, type OrderStatusTone } from "@/lib/order-status";
import { phoneHref } from "@/lib/storefront";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

const toneToBadge: Record<OrderStatusTone, string> = {
  red: "adm-badge--danger",
  amber: "adm-badge--new",
  blue: "adm-badge--active",
  green: "adm-badge--success",
  zinc: "adm-badge--muted",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [total, newCount, orders] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: OrderStatus.NEW } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminShell title="Заказы">
      <div className="adm-section-right" style={{ marginBottom: 14 }}>
        <span className="adm-badge adm-badge--muted">Всего: {total.toLocaleString("ru-RU")}</span>
        {newCount > 0 ? <span className="adm-badge adm-badge--danger">Новых: {newCount.toLocaleString("ru-RU")}</span> : null}
      </div>

      <div className="adm-card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="adm-table" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th>Номер</th>
              <th>Клиент</th>
              <th>Статус</th>
              <th className="adm-num">Сумма</th>
              <th>Дата</th>
              <th aria-hidden />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const meta = orderStatusMeta[order.status];
              return (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold" style={{ color: "var(--accent-2)" }}>
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td>
                    <div className="font-medium" style={{ color: "var(--text)" }}>
                      {order.customerName}
                    </div>
                    <a href={phoneHref(order.phone)} className="text-xs font-semibold" style={{ color: "var(--accent-2)" }}>
                      {order.phone}
                    </a>
                  </td>
                  <td>
                    <span className={`adm-badge ${toneToBadge[meta.tone]}`}>{meta.label}</span>
                  </td>
                  <td className="adm-num font-semibold">{formatRub(Number(order.total))}</td>
                  <td style={{ color: "var(--text-mute)" }}>{formatDateTime(order.createdAt)}</td>
                  <td className="adm-col-actions">
                    <Link href={`/admin/orders/${order.id}`} aria-label="Открыть заказ" style={{ color: "var(--text-mute)" }}>
                      <ChevronRight size={18} aria-hidden style={{ display: "inline" }} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!orders.length ? (
              <tr>
                <td colSpan={6} style={{ color: "var(--text-mute)", textAlign: "center", padding: "28px 14px" }}>
                  Заказов пока нет.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <CatalogPager page={page} totalPages={totalPages} buildHref={(p) => `/admin/orders?page=${p}`} />
    </AdminShell>
  );
}
