"use client";

import {
  ArrowLeftRight,
  ArrowRight,
  ChevronDown,
  Heart,
  Menu,
  Package,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatRub } from "@/lib/format";
import { storefront } from "@/lib/storefront";
import { useCart } from "@/lib/use-cart";

type Role = "b2c" | "b2b" | "gov";

type Suggestion = {
  id: string;
  slug: string;
  name: string;
  vendor: string | null;
  price: number;
  image: string | null;
};

type MenuCategory = {
  id: string;
  slug: string;
  name: string;
  productCount: number;
};

const POPULAR = ["холодильник", "стиральная машина", "Bosch", "до 50 000 ₽", "встраиваемая"];

export function SiteHeader() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("b2c");
  const [mobOpen, setMobOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[] | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cartCount = useCart().reduce((sum, item) => sum + item.quantity, 0);

  function openMenu() {
    setMenuOpen((current) => !current);
    if (!menuCategories) {
      fetch("/api/catalog/categories")
        .then((response) => (response.ok ? response.json() : { categories: [] }))
        .then((data: { categories?: MenuCategory[] }) => {
          setMenuCategories(data.categories ?? []);
        })
        .catch(() => {
          setMenuCategories([]);
        });
    }
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onClick = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (trimmed.length < 2) {
        setSuggestions([]);
        return;
      }
      fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { products: [] }))
        .then((data: { products?: Suggestion[] }) => {
          setSuggestions(data.products ?? []);
        })
        .catch(() => {
          /* aborted or network */
        });
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function pickSuggestion(suggestion: Suggestion) {
    setSearchOpen(false);
    setQuery("");
    router.push(`/product/${suggestion.slug}`);
  }

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
            <button type="button" className={role === "b2c" ? "on" : ""} onClick={() => setRole("b2c")}>
              Розница
            </button>
            <button type="button" className={role === "b2b" ? "on" : ""} onClick={() => setRole("b2b")}>
              Опт
            </button>
            <button type="button" className={role === "gov" ? "on" : ""} onClick={() => setRole("gov")}>
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

        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            type="button"
            className="cat-btn"
            onClick={openMenu}
            aria-expanded={menuOpen}
          >
            <Package size={18} aria-hidden />
            Каталог товаров
            <ChevronDown size={16} aria-hidden style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          </button>
          {menuOpen && (
            <div
              role="dialog"
              aria-label="Каталог по категориям"
              style={{
                position: "absolute",
                left: 0,
                top: "calc(100% + 14px)",
                width: "min(880px, 90vw)",
                maxHeight: "70vh",
                overflowY: "auto",
                zIndex: 60,
                padding: 24,
                borderRadius: 22,
                background: "var(--glass-bg-3)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                border: "1px solid var(--glass-stroke-2)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                  Каталог по категориям
                </h3>
                <Link
                  href="/catalog"
                  className="btn btn-soft btn-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Все товары
                </Link>
              </div>
              {menuCategories === null ? (
                <p style={{ color: "var(--text-mute)" }}>Загружаем категории…</p>
              ) : menuCategories.length === 0 ? (
                <p style={{ color: "var(--text-mute)" }}>Категории недоступны. Откройте каталог.</p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 10,
                  }}
                >
                  {menuCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/catalog/${category.slug}`}
                      className="f-row"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        margin: 0,
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.45)",
                        border: "1px solid var(--glass-stroke)",
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{category.name}</span>
                      <span className="cnt">{category.productCount.toLocaleString("ru-RU")}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hdr-search-wrap" ref={searchRef}>
          <form action="/search" onSubmit={handleSubmit}>
            <div className={"hdr-search " + (searchOpen ? "open" : "")} onClick={() => setSearchOpen(true)}>
              <Search size={18} aria-hidden />
              <input
                name="q"
                type="search"
                autoComplete="off"
                placeholder="Холодильник, Bosch, до 50 000 ₽…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchOpen(true)}
              />
              {query && (
                <button
                  type="button"
                  className="hdr-search-clear"
                  onClick={(event) => {
                    event.stopPropagation();
                    setQuery("");
                  }}
                  aria-label="Очистить"
                >
                  <X size={14} aria-hidden />
                </button>
              )}
            </div>
          </form>
          {searchOpen && (
            <div className="hdr-suggest">
              {!query.trim() ? (
                <>
                  <div className="sg-h">Популярные запросы</div>
                  <div className="sg-tags">
                    {POPULAR.map((popular) => (
                      <button
                        key={popular}
                        type="button"
                        className="sg-tag"
                        onClick={() => setQuery(popular)}
                      >
                        {popular}
                      </button>
                    ))}
                  </div>
                </>
              ) : suggestions.length > 0 ? (
                <>
                  <div className="sg-h">Найдено {suggestions.length}</div>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      className="sg-item"
                      onClick={() => pickSuggestion(suggestion)}
                    >
                      <span className="sg-item-art">
                        {suggestion.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={suggestion.image} alt="" />
                        ) : (
                          <Search size={18} aria-hidden style={{ opacity: 0.4 }} />
                        )}
                      </span>
                      <span className="sg-item-body">
                        <span className="sg-item-brand">{suggestion.vendor ?? ""}</span>
                        <span className="sg-item-name">{suggestion.name}</span>
                      </span>
                      <span className="sg-item-price">
                        {suggestion.price ? formatRub(suggestion.price) : ""}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="sg-all"
                    onClick={() => {
                      setSearchOpen(false);
                      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                    }}
                  >
                    Показать все результаты <ArrowRight size={14} aria-hidden />
                  </button>
                </>
              ) : (
                <div className="sg-empty">
                  Ничего не нашли по «{query}»<br />
                  <small>Попробуйте короче — например, «Bosch» или «холодильник»</small>
                </div>
              )}
            </div>
          )}
        </div>

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
