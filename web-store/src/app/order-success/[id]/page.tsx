import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/app/order-success/clear-cart";
import { prisma } from "@/lib/db";
import { formatRub } from "@/lib/format";
import { buildCustomerOrderSteps } from "@/lib/order-status";
import { phoneHref, storefront } from "@/lib/storefront";

export const dynamic = "force-dynamic";

// Order confirmation is reachable by raw order id — keep it out of search indexes.
export const metadata: Metadata = {
  title: "Заказ создан",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderSuccessPage({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }
  const steps = buildCustomerOrderSteps();

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <ClearCart />

      <div
        className="glass-strong"
        style={{ padding: 36, borderRadius: 28 }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 999,
            background: "rgba(34,221,136,0.18)",
            color: "#0e6b3a",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          <CheckCircle2 size={16} aria-hidden /> Заказ создан
        </span>
        <h1 style={{ marginTop: 14, fontSize: 32, fontWeight: 900, letterSpacing: "-0.01em", color: "var(--text)" }}>
          {order.orderNumber}
        </h1>
        <p style={{ marginTop: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
          Спасибо за заявку. Менеджер свяжется с вами, подтвердит наличие у поставщика, доставку под заказ 7 дней и детали получения.
        </p>

        <div style={{ marginTop: 22 }}>
          {order.items.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 0",
                borderTop: index === 0 ? "none" : "1px solid rgba(255,255,255,0.5)",
                fontSize: 14,
                color: "var(--text-2)",
              }}
            >
              <span>
                SKU {item.sku} · {item.name} × {item.quantity}
              </span>
              <strong style={{ color: "var(--text)" }}>{formatRub(Number(item.total))}</strong>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 18,
            background: "rgba(255,255,255,0.5)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 700, color: "var(--text-2)" }}>Итого</span>
          <span style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>{formatRub(Number(order.total))}</span>
        </div>

        <div className="glass" style={{ marginTop: 22, padding: 20, borderRadius: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Что дальше</h2>
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            {steps.map((step, index) => (
              <div
                key={step.title}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px minmax(0, 1fr)",
                  gap: 12,
                  fontSize: 14,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: "linear-gradient(135deg,#75a2ff,#426dff)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {index + 1}
                </span>
                <span>
                  <strong style={{ display: "block", color: "var(--text)" }}>{step.title}</strong>
                  <span style={{ marginTop: 4, display: "block", lineHeight: 1.5, color: "var(--text-mute)" }}>
                    {step.description}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link href="/catalog" className="btn btn-primary">
            Вернуться в каталог
          </Link>
          <a href={phoneHref(storefront.phones[0])} className="btn btn-soft">
            Позвонить менеджеру
          </a>
        </div>
      </div>
    </div>
  );
}
