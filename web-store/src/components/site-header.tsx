"use client";

import {
  ArrowLeftRight,
  ChevronDown,
  Heart,
  Menu,
  Package,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { storefront } from "@/lib/storefront";
import { useCart } from "@/lib/use-cart";

type Role = "b2c" | "b2b" | "gov";

export function SiteHeader() {
  const [role, setRole] = useState<Role>("b2c");
  const [mobOpen, setMobOpen] = useState(false);
  const cartCount = useCart().reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="topline">
        <div className="tl-l">
          <span>
            <span className="pulse" />
            г. {storefront.city}
          </span>
          <a href="#">Доставка по Крыму и новым регионам</a>
        </div>
        <div className="tl-r">
          <a href="#">Помощь</a>
          <span>Режим:</span>
          <div className="role-switch">
            <button
              type="button"
              className={role === "b2c" ? "on" : ""}
              onClick={() => setRole("b2c")}
            >
              Розница
            </button>
            <button
              type="button"
              className={role === "b2b" ? "on" : ""}
              onClick={() => setRole("b2b")}
            >
              Опт
            </button>
            <button
              type="button"
              className={role === "gov" ? "on" : ""}
              onClick={() => setRole("gov")}
            >
              Госзакупки
            </button>
          </div>
        </div>
      </div>

      <div className="header glass">
        <Link className="brand" href="/">
          <div className="brand-mark">
            <svg viewBox="0 0 40 40" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="9" y="6" width="22" height="28" rx="5" stroke="#fff" strokeWidth="2.4" />
              <path d="M9 16h22" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
              <rect x="25.6" y="9.5" width="2.4" height="4.5" rx="1.2" fill="#fff" />
              <rect x="25.6" y="19" width="2.4" height="11" rx="1.2" fill="#fff" />
              <circle cx="13" cy="28" r="1.7" fill="#FFD56B" />
            </svg>
          </div>
          <div className="brand-name">
            <span className="nm">
              Быт<b>Тех</b>Опт
            </span>
            <span className="tg" />
          </div>
        </Link>

        <Link href="/catalog" className="cat-btn">
          <Package size={18} aria-hidden />
          Каталог товаров
          <ChevronDown size={16} aria-hidden />
        </Link>

        <form action="/search" className="hdr-search-wrap">
          <div className="hdr-search">
            <Search size={18} aria-hidden />
            <input name="q" type="search" placeholder="Холодильник, Bosch, до 50 000 ₽…" />
          </div>
        </form>

        <div className="head-actions">
          <Link href="/catalog" className="icon-btn" title="Избранное" aria-label="Избранное">
            <Heart size={18} aria-hidden />
          </Link>
          <Link href="/catalog" className="icon-btn" title="Сравнение" aria-label="Сравнение">
            <ArrowLeftRight size={18} aria-hidden />
          </Link>
          <Link href="/cart" className="icon-btn" title="Корзина" aria-label="Корзина">
            <ShoppingCart size={18} aria-hidden />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>
          <Link href="/cart" className="icon-btn" title="Кабинет" aria-label="Кабинет">
            <User size={18} aria-hidden />
          </Link>
          <button
            type="button"
            className="icon-btn hdr-burger"
            title="Меню"
            aria-label="Меню"
            onClick={() => setMobOpen(true)}
          >
            <Menu size={18} aria-hidden />
          </button>
        </div>

        <div className="phone">
          {storefront.phones[0]}
          <span>Обратный звонок →</span>
        </div>
      </div>

      {mobOpen && (
        <div className="mob-drawer" onClick={() => setMobOpen(false)} role="dialog">
          <div className="mob-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mob-head">
              <span style={{ fontWeight: 800, fontSize: 18 }}>Меню</span>
              <button
                type="button"
                className="mob-close"
                onClick={() => setMobOpen(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <Link href="/catalog" className="mob-item" onClick={() => setMobOpen(false)}>
              <Package size={18} aria-hidden /> Каталог товаров
            </Link>
            <Link href="/cart" className="mob-item" onClick={() => setMobOpen(false)}>
              <ShoppingCart size={18} aria-hidden /> Корзина
              {cartCount > 0 && <span className="mob-cnt">{cartCount}</span>}
            </Link>
            <Link href="/privacy" className="mob-item" onClick={() => setMobOpen(false)}>
              Персональные данные
            </Link>
            <div className="mob-sep" />
            <a href={`tel:${storefront.phones[0].replace(/[^\d+]/g, "")}`} className="mob-phone">
              {storefront.phones[0]}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
