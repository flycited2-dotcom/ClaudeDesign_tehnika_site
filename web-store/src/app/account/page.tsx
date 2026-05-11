import type { Metadata } from "next";
import { ArrowRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { storefront } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Личный кабинет",
  description: "Заказы, избранное и сравнение в магазине БытТехОпт.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <AccountShell activeRole="b2c" activeItem="dash">
      <div className="acc-card">
        <h3>Здравствуйте!</h3>
        <p style={{ color: "var(--text-mute)", lineHeight: 1.5, fontSize: 14 }}>
          В этой версии кабинет работает в гостевом режиме. Корзина, избранное и
          сравнение сохраняются на этом устройстве. Для истории заказов и бонусов
          подключим авторизацию по телефону — менеджер уже работает с вашими заявками.
        </p>
        <div className="acc-stats" style={{ marginTop: 18 }}>
          <div className="acc-stat">
            <div className="l">Корзина</div>
            <div className="v" id="cart-count">…</div>
            <div className="d">локально на устройстве</div>
          </div>
          <div className="acc-stat">
            <div className="l">Избранное</div>
            <div className="v" id="fav-count">…</div>
            <div className="d">сохраняется в браузере</div>
          </div>
          <div className="acc-stat">
            <div className="l">К сравнению</div>
            <div className="v" id="cmp-count">…</div>
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
            ❤ Избранное
          </Link>
          <Link href="/compare" className="btn btn-soft" style={{ justifyContent: "flex-start" }}>
            ⇆ Сравнить выбранные
          </Link>
          <Link href="/checkout" className="btn btn-soft" style={{ justifyContent: "flex-start" }}>
            📞 Оформить заявку
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
