import { Phone } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatRub } from "@/lib/format";
import { orderStatusMeta, type OrderStatusTone } from "@/lib/order-status";
import { phoneHref } from "@/lib/storefront";
import { OrderStatusForm } from "./order-status-form";

export const dynamic = "force-dynamic";

const toneToBadge: Record<OrderStatusTone, string> = {
  red: "adm-badge--danger",
  amber: "adm-badge--new",
  blue: "adm-badge--active",
  green: "adm-badge--success",
  zinc: "adm-badge--muted",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();
  const currentStatus = orderStatusMeta[order.status];
  const statuses = Object.values(OrderStatus).map((status) => ({
    value: status,
    label: orderStatusMeta[status].label,
  }));

  return (
    <AdminShell title={order.orderNumber}>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="adm-card">
          <div className="adm-section-head">
            <h2>Состав заказа</h2>
          </div>
          <div className="divide-y divide-[rgba(33,52,108,0.1)]">
            {order.items.map((item) => (
              <div key={item.id} className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_80px_120px]">
                <span style={{ color: "var(--text)" }}>
                  SKU {item.sku} · {item.name}
                </span>
                <span style={{ color: "var(--text-mute)" }}>{item.quantity} шт.</span>
                <strong className="adm-num">{formatRub(Number(item.total))}</strong>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl p-4 text-right text-2xl font-black" style={{ background: "rgba(255,255,255,0.5)", color: "var(--text)" }}>
            {formatRub(Number(order.total))}
          </div>
        </div>

        <aside className="adm-card h-fit">
          <span className={`adm-badge ${toneToBadge[currentStatus.tone]}`}>{currentStatus.label}</span>
          <p className="mt-4 font-bold" style={{ color: "var(--text)" }}>
            {order.customerName}
          </p>
          <a href={phoneHref(order.phone)} className="adm-btn adm-btn--soft" style={{ marginTop: 10, width: "100%" }}>
            <Phone size={15} aria-hidden />
            {order.phone}
          </a>
          {order.email ? (
            <p className="mt-2 text-sm" style={{ color: "var(--text-mute)" }}>
              {order.email}
            </p>
          ) : null}
          {order.comment ? (
            <p className="mt-3 rounded-xl p-3 text-sm" style={{ background: "rgba(16,32,74,0.05)", color: "var(--text-2)" }}>
              {order.comment}
            </p>
          ) : null}

          <div className="mt-5 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid var(--glass-stroke)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
              План обработки
            </p>
            <div className="mt-3 grid gap-2 text-sm" style={{ color: "var(--text-2)" }}>
              {[
                "Позвонить клиенту и подтвердить состав заявки.",
                "Проверить наличие у поставщика, цену и доставку под заказ 7 дней.",
                "Согласовать оплату и перевести заявку в следующий статус.",
              ].map((step) => (
                <div key={step} className="flex gap-2">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: "var(--accent-2)" }} />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <OrderStatusForm orderId={order.id} currentStatus={order.status} statuses={statuses} />
        </aside>
      </div>
    </AdminShell>
  );
}
