"use client";

import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ChevronDown,
  ChevronRight,
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
import { CallbackButton } from "@/components/callback-button";
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
  hasChildren: boolean;
};

const ROOT_PARENT_KEY = "root";

const POPULAR = ["холодильник", "стиральная машина", "Bosch", "до 50 000 ₽", "встраиваемая"];

export function SiteHeader() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("b2c");
  const [mobOpen, setMobOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState<MenuCategory[]>([]);
  const [menuCache, setMenuCache] = useState<Record<string, MenuCategory[] | "loading">>({});
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cartCount = useCart().reduce((sum, item) => sum + item.quantity, 0);

  function fetchLevel(parentKey: string) {
    setMenuCache((cache) => {
      if (cache[parentKey]) return cache;
      return { ...cache, [parentKey]: "loading" };
    });
    const query = parentKey === ROOT_PARENT_KEY ? "" : `?parent=${encodeURIComponent(parentKey)}`;
    fetch(`/api/catalog/categories${query}`)
      .then((response) => (response.ok ? response.json() : { categories: [] }))
      .then((data: { categories?: MenuCategory[] }) => {
        setMenuCache((cache) => ({ ...cache, [parentKey]: data.categories ?? [] }));
      })
      .catch(() => {
        setMenuCache((cache) => ({ ...cache, [parentKey]: [] }));
      });
  }

  function openMenu() {
    const willOpen = !menuOpen;
    setMenuOpen(willOpen);
    if (willOpen) {
      setMenuPath([]);
      if (!menuCache[ROOT_PARENT_KEY]) fetchLevel(ROOT_PARENT_KEY);
    }
  }

  function pushMenuPath(category: MenuCategory) {
    setMenuPath((current) => [...current, category]);
    if (!menuCache[category.id]) fetchLevel(category.id);
  }

  function popMenuPath() {
    setMenuPath((current) => current.slice(0, -1));
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

  function submitSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitSearch();
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
          {menuOpen && (() => {
            const currentParentKey = menuPath.length === 0 ? ROOT_PARENT_KEY : menuPath[menuPath.length - 1].id;
            const currentLevel = menuCache[currentParentKey];
            const currentNode = menuPath[menuPath.length - 1];
            return (
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
                  padding: 20,
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
                    gap: 10,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    {menuPath.length > 0 && (
                      <button
                        type="button"
                        onClick={popMenuPath}
                        className="btn btn-soft btn-sm"
                        aria-label="Назад"
                        style={{ padding: "0 10px" }}
                      >
                        <ArrowLeft size={14} aria-hidden />
                      </button>
                    )}
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={currentNode?.name ?? "Каталог по категориям"}
                    >
                      {currentNode?.name ?? "Каталог по категориям"}
                    </h3>
                  </div>
                  <div style={{ display: "inline-flex", gap: 8 }}>
                    {currentNode && (
                      <Link
                        href={`/catalog/${currentNode.slug}`}
                        className="btn btn-soft btn-sm"
                        onClick={() => setMenuOpen(false)}
                      >
                        Все в разделе
                      </Link>
                    )}
                    <Link
                      href="/catalog"
                      className="btn btn-soft btn-sm"
                      onClick={() => setMenuOpen(false)}
                    >
                      Весь каталог
                    </Link>
                  </div>
                </div>

                {menuPath.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: 12,
                      fontSize: 12,
                      color: "var(--text-mute)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setMenuPath([])}
                      style={{ background: 0, border: 0, padding: 0, cursor: "pointer", color: "var(--accent-2)", fontWeight: 700 }}
                    >
                      Каталог
                    </button>
                    {menuPath.map((node, index) => (
                      <span key={node.id} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "var(--text-soft)" }}>›</span>
                        <button
                          type="button"
                          onClick={() => setMenuPath((current) => current.slice(0, index + 1))}
                          style={{
                            background: 0,
                            border: 0,
                            padding: 0,
                            cursor: "pointer",
                            color: index === menuPath.length - 1 ? "var(--text)" : "var(--accent-2)",
                            fontWeight: 700,
                          }}
                        >
                          {node.name}
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {currentLevel === undefined || currentLevel === "loading" ? (
                  <p style={{ color: "var(--text-mute)" }}>Загружаем категории…</p>
                ) : currentLevel.length === 0 ? (
                  <p style={{ color: "var(--text-mute)" }}>
                    {currentNode
                      ? "Подкатегорий нет. Откройте все товары раздела."
                      : "Категории недоступны. Откройте каталог."}
                  </p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                      gap: 8,
                    }}
                  >
                    {currentLevel.map((category) =>
                      category.hasChildren ? (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => pushMenuPath(category)}
                          className="f-row"
                          style={{
                            margin: 0,
                            padding: "10px 12px",
                            borderRadius: 12,
                            background: "rgba(255,255,255,0.45)",
                            border: "1px solid var(--glass-stroke)",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{category.name}</span>
                          {category.productCount > 0 && (
                            <span className="cnt">{category.productCount.toLocaleString("ru-RU")}</span>
                          )}
                          <ChevronRight size={14} aria-hidden style={{ color: "var(--text-soft)" }} />
                        </button>
                      ) : (
                        <Link
                          key={category.id}
                          href={`/catalog/${category.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="f-row"
                          style={{
                            margin: 0,
                            padding: "10px 12px",
                            borderRadius: 12,
                            background: "rgba(255,255,255,0.45)",
                            border: "1px solid var(--glass-stroke)",
                          }}
                        >
                          <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{category.name}</span>
                          {category.productCount > 0 && (
                            <span className="cnt">{category.productCount.toLocaleString("ru-RU")}</span>
                          )}
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="hdr-search-wrap" ref={searchRef}>
          <form action="/search" method="get" onSubmit={handleSubmit} role="search">
            <div className={"hdr-search " + (searchOpen ? "open" : "")}>
              <button
                type="submit"
                aria-label="Найти"
                style={{ background: 0, border: 0, padding: 0, color: "inherit", cursor: "pointer", display: "inline-flex" }}
              >
                <Search size={18} aria-hidden />
              </button>
              <input
                name="q"
                type="text"
                autoComplete="off"
                placeholder="Холодильник, Bosch, до 50 000 ₽…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitSearch();
                  }
                }}
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
          <a
            href={`tel:${storefront.phones[0].replace(/[^\d+]/g, "")}`}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {storefront.phones[0]}
          </a>
          <CallbackButton variant="header" />
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
