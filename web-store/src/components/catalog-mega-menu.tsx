"use client";

import { ArrowLeft, ArrowRight, ChevronDown, LayoutGrid, Package, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CatalogMenuItem } from "@/lib/catalog-menu";

const ROOT_PARENT_KEY = "root";
const RU_NUMBER = new Intl.NumberFormat("ru-RU");

type MenuPathNode = Pick<CatalogMenuItem, "id" | "slug" | "name">;

export function CatalogMegaMenu() {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(96);
  const [path, setPath] = useState<MenuPathNode[]>([]);
  const [cache, setCache] = useState<Record<string, CatalogMenuItem[] | "loading">>({});
  const rootRef = useRef<HTMLDivElement>(null);

  function fetchLevel(parentKey: string) {
    setCache((current) => (current[parentKey] ? current : { ...current, [parentKey]: "loading" }));
    const query = parentKey === ROOT_PARENT_KEY ? "" : `?parent=${encodeURIComponent(parentKey)}`;
    fetch(`/api/catalog/menu${query}`)
      .then((response) => (response.ok ? response.json() : { categories: [] }))
      .then((data: { categories?: CatalogMenuItem[] }) => {
        setCache((current) => ({ ...current, [parentKey]: data.categories ?? [] }));
      })
      .catch(() => {
        setCache((current) => ({ ...current, [parentKey]: [] }));
      });
  }

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    // The panel is fixed below the (sticky) header; measure where that ends.
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) setTop(Math.round(rect.bottom + 14));
    setPath([]);
    if (!cache[ROOT_PARENT_KEY]) fetchLevel(ROOT_PARENT_KEY);
    setOpen(true);
  }

  function enter(category: CatalogMenuItem) {
    setPath((current) => [...current, { id: category.id, slug: category.slug, name: category.name }]);
    if (!cache[category.id]) fetchLevel(category.id);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const current = path[path.length - 1];
  const level = cache[current ? current.id : ROOT_PARENT_KEY];

  return (
    <div ref={rootRef} className="hdr-mega-trigger">
      <button type="button" className="cat-btn" onClick={toggle} aria-expanded={open}>
        <Package size={18} aria-hidden />
        Каталог товаров
        <ChevronDown
          size={16}
          aria-hidden
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}
        />
      </button>

      {open && (
        <>
          <div className="mega-backdrop" onClick={() => setOpen(false)} aria-hidden />
          <div className="mega-panel" role="dialog" aria-label="Каталог по категориям" style={{ top }}>
            <div className="mega-head">
              <div className="mega-title">
                {path.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-soft btn-sm"
                    aria-label="Назад"
                    onClick={() => setPath((nodes) => nodes.slice(0, -1))}
                  >
                    <ArrowLeft size={14} aria-hidden />
                  </button>
                )}
                <div className="mega-crumbs">
                  <button type="button" onClick={() => setPath([])} className={path.length === 0 ? "on" : ""}>
                    Каталог
                  </button>
                  {path.map((node, index) => (
                    <span key={node.id}>
                      <span className="sep">›</span>
                      <button
                        type="button"
                        className={index === path.length - 1 ? "on" : ""}
                        onClick={() => setPath((nodes) => nodes.slice(0, index + 1))}
                      >
                        {node.name}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="mega-actions">
                {current && (
                  <Link href={`/catalog/${current.slug}`} className="btn btn-soft btn-sm" onClick={() => setOpen(false)}>
                    Все товары раздела
                  </Link>
                )}
                <Link href="/catalog" className="btn btn-soft btn-sm" onClick={() => setOpen(false)}>
                  Весь каталог
                </Link>
                <button type="button" className="icon-btn mega-close" aria-label="Закрыть" onClick={() => setOpen(false)}>
                  <X size={16} aria-hidden />
                </button>
              </div>
            </div>

            {level === undefined || level === "loading" ? (
              <div className="mega-grid" aria-busy>
                {Array.from({ length: 14 }, (_, index) => (
                  <div key={index} className="mega-card mega-skeleton" />
                ))}
              </div>
            ) : level.length === 0 ? (
              <p className="mega-empty">
                {current ? "Подкатегорий нет. Откройте все товары раздела." : "Категории недоступны. Откройте каталог."}
              </p>
            ) : (
              <div className="mega-grid">
                {level.map((category) => {
                  const inner = (
                    <>
                      <div className={`mega-art${category.image?.startsWith("/api/") ? " photo" : ""}`}>
                        {category.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={category.image} alt="" loading="lazy" />
                        ) : (
                          <LayoutGrid size={34} aria-hidden />
                        )}
                      </div>
                      <div className="mega-body">
                        <div className="mega-name">{category.name}</div>
                        <div className="mega-desc">{category.description}</div>
                        <div className="mega-foot">
                          <span className="cnt">{RU_NUMBER.format(category.productCount)}</span>
                          <ArrowRight size={14} aria-hidden />
                        </div>
                      </div>
                    </>
                  );

                  return category.hasChildren ? (
                    <button key={category.id} type="button" className="mega-card" onClick={() => enter(category)}>
                      {inner}
                    </button>
                  ) : (
                    <Link
                      key={category.id}
                      href={`/catalog/${category.slug}`}
                      className="mega-card"
                      onClick={() => setOpen(false)}
                    >
                      {inner}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
