import type { Metadata } from "next";
import type { OrderStatus } from "@prisma/client";
import { ArrowLeftRight, ArrowRight, ClipboardList, Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account-shell";
import { AccountStatValue } from "@/components/account-stat-value";
import { getCurrentUser, roleToStorefront } from "@/lib/auth";
import { formatRub } from "@/lib/format";
import { getOrdersForUser } from "@/lib/orders";
import { storefront } from "@/lib/storefront";

const ORDER_STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  NEW: { label: "Новый", cls: "status-new" },
  PROCESSING: { label: "В обработке", cls: "status-prog" },
  CONFIRMED: { label: "Подтверждён", cls: "status-prog" },
  SENT_TO_SUPPLIER: { label: "У поставщика", cls: "status-prog" },
  SUPPLIER_ERROR: { label: "Требует уточнения", cls: "status-canc" },
  COMPLETED: { label: "Выполнен", cls: "status-done" },
  CANCELLED: { label: "Отменён", cls: "status-canc" },
};

export const metadata: Metadata = {
  title: "Личный кабинет",
  description: "Заказы, избранное и сравнение в магазине БытТехОпт.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/account");
  }
  const role = roleToStorefront(user.role);
  if (role === "b2b") redirect("/b2b");
  if (role === "gov") redirect("/gov");

  const greeting = user.name?.trim() ? `Здравствуйте, ${user.name.split(/\s+/)[0]}!` : "Здравствуйте!";

  const orders = await getOrdersForUser(user.id);

  return (
    <AccountShell
      activeRole="b2c"
      activeItem="dash"
      user={{ name: user.name, orgName: user.orgName, email: user.email }}
    >
      <div className="acc-card">
        <h3>{greeting}</h3>
        <p style={{ color: "var(--text-mute)", lineHeight: 1.5, fontSize: 14 }}>
          В этой версии кабинет работает в облегчённом режиме. Корзина, избранное и
          сравнение сохраняются на этом устройстве. История заказов и бонусов появится
          в следующих обновлениях — менеджер уже работает с вашими заявками.
        </p>
        <div className="acc-stats" style={{ marginTop: 18 }}>
          <div className="acc-stat">
            <div className="l">Корзина</div>
            <div className="v"><AccountStatValue kind="cart" /></div>
            <div className="d">локально на устройстве</div>
          </div>
          <div className="acc-stat">
            <div className="l">Избранное</div>
            <div className="v"><AccountStatValue kind="favorites" /></div>
            <div className="d">сохраняется в браузере</div>
          </div>
          <div className="acc-stat">
            <div className="l">К сравнению</div>
            <div className="v"><AccountStatValue kind="compare" /></div>
            <div className="d">до 4 товаров</div>
          </div>
          <div className="acc-stat">
            <div className="l">Регион</div>
            <div className="v" style={{ fontSize: 18 }}>{storefront.city}</div>
            <div className="d">{storefront.region}</div>
          </div>
        </div>
      </div>

      <div className="acc-card">
        <h3>История заказов</h3>
        {orders.length === 0 ? (
          <p style={{ color: "var(--text-mute)", fontSize: 14, lineHeight: 1.5 }}>
            Здесь будут ваши заказы. Оформите первый — менеджер подтвердит наличие и сроки.{" "}
            <Link href="/catalog" style={{ fontWeight: 700, color: "var(--accent-2)" }}>
              Перейти в каталог
            </Link>
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {orders.map((order) => {
              const s = ORDER_STATUS[order.status];
              const qty = order.items.reduce((n, item) => n + item.quantity, 0);
              return (
                <Link
                  key={order.id}
                  href={`/order-success/${order.id}`}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 10,
                    padding: 14,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid var(--glass-stroke)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>{order.orderNumber}</div>
                    <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                      {new Date(order.createdAt).toLocaleDateString("ru-RU")} · {qty} шт
                    </div>
                  </div>
                  <span className={`status-pill ${s.cls}`}>{s.label}</span>
                  <strong style={{ fontSize: 15, color: "var(--text)", whiteSpace: "nowrap" }}>
                    {formatRub(Number(order.total))}
                  </strong>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="acc-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>Быстрые действия</h3>
          <Link
            href="/catalog"
            style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-2)", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            Каталог <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          <Link href="/cart" className="btn btn-soft" style={{ justifyContent: "flex-start" }}>
            <ShoppingCart size={16} aria-hidden /> Перейти в корзину
          </Link>
          <Link href="/favorites" className="btn btn-soft" style={{ justifyContent: "flex-start" }}>
            <Heart size={16} aria-hidden /> Избранное
          </Link>
          <Link href="/compare" className="btn btn-soft" style={{ justifyContent: "flex-start" }}>
            <ArrowLeftRight size={16} aria-hidden /> Сравнить выбранные
          </Link>
          <Link href="/checkout" className="btn btn-soft" style={{ justifyContent: "flex-start" }}>
            <ClipboardList size={16} aria-hidden /> Оформить заявку
          </Link>
        </div>
      </div>

      <div className="acc-card">
        <h3>Информация о магазине</h3>
        <div style={{ display: "grid", gap: 10, fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
          <div>
            <strong>Бренд:</strong> {storefront.brand}
          </div>
          <div>
            <strong>Регион доставки:</strong> {storefront.region}
          </div>
          <div>
            <strong>Часы работы:</strong> {storefront.hours}
          </div>
          <div>
            <strong>Телефоны:</strong>{" "}
            {storefront.phones.map((phone, index) => (
              <span key={phone}>
                {index > 0 ? ", " : null}
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  style={{ color: "var(--accent-2)", fontWeight: 700 }}
                >
                  {phone}
                </a>
              </span>
            ))}
          </div>
          <div>
            <strong>Email:</strong>{" "}
            <a href={`mailto:${storefront.email}`} style={{ color: "var(--accent-2)", fontWeight: 700 }}>
              {storefront.email}
            </a>
          </div>
        </div>
      </div>
    </AccountShell>
  );
}
