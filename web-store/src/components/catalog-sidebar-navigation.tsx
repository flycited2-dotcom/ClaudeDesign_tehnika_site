"use client";

import { ArrowLeft, Check, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CategoryTreeItem } from "@/lib/catalog-tree";

export function CatalogSidebarNavigation({ categories, currentCategorySlug, currentQuery, basePath }: {
  categories: CategoryTreeItem[];
  currentCategorySlug?: string;
  currentQuery?: string;
  basePath: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(currentQuery ?? "");
  const flatten = (nodes: CategoryTreeItem[]): CategoryTreeItem[] => nodes.flatMap(node => [node, ...flatten(node.children)]);
  const all = flatten(categories);
  const current = all.find(node => node.slug === currentCategorySlug);
  const parent = all.find(node => node.id === current?.parentId);
  const backHref = parent ? `/catalog/${parent.slug}` : "/catalog";
  const normalized = query.trim().toLocaleLowerCase("ru-RU");
  const matches = normalized ? all.filter(node => node.name.toLocaleLowerCase("ru-RU").includes(normalized)) : [];
  const exact = matches.find(node => node.name.toLocaleLowerCase("ru-RU") === normalized);
  const visible = normalized ? matches.slice(0, 30) : current ? current.children : categories;

  useEffect(() => {
    if (!currentCategorySlug) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        (target instanceof Element && target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='dialog']"))) return;
      if (event.key === "Backspace") {
        event.preventDefault();
        router.push(backHref);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [currentCategorySlug, backHref, router]);

  return <>
    <form action={basePath} role="search" className="f-section" style={{ paddingTop: 0, borderTop: 0 }}
      onSubmit={event => {
        if (exact) {
          event.preventDefault();
          router.push(`/catalog/${exact.slug}`);
        }
      }}>
      <h4><label htmlFor="catalog-sidebar-query">Поиск</label></h4>
      <div className="catalog-sidebar-search">
        <button type="submit" aria-label="Найти товары или категорию"><Search size={16} aria-hidden /></button>
        <input id="catalog-sidebar-query" name="q" value={query} onChange={event => setQuery(event.target.value)}
          placeholder="Товар, категория, SKU, бренд" />
      </div>
      <p className="catalog-search-hint">{current ? `Товары в разделе «${current.name}» или категория во всём каталоге` : "Товары и категории во всём каталоге"}</p>
      {normalized && <Link className="catalog-search-all" href={`/search?q=${encodeURIComponent(query.trim())}`}>Искать товары во всём каталоге →</Link>}
    </form>
    <div className="f-section">
      <h4>{normalized ? "Найденные категории" : "Категории"}</h4>
      {current && <Link href={backHref} className="catalog-category-back" title="На уровень выше (Backspace)">
        <ArrowLeft size={16} aria-hidden /> {parent?.name ?? "Все категории"}
      </Link>}
      {!normalized && current && <p className="catalog-current-category">{current.name}</p>}
      <div className="catalog-category-list">
        {!normalized && <Link href="/catalog" className={"f-row " + (!current ? "on" : "")} aria-current={!current ? "page" : undefined}>
          <span className="box">{!current && <Check size={12} aria-hidden />}</span>
          <span className="f-val">Все товары</span><span className="cnt">{categories.reduce((sum, node) => sum + node.productCount, 0).toLocaleString("ru-RU")}</span>
        </Link>}
        {visible.map(node => <Link key={node.id} href={`/catalog/${node.slug}`} className={"f-row " + (node.slug === currentCategorySlug ? "on" : "")}
          aria-current={node.slug === currentCategorySlug ? "page" : undefined}>
          <span className="box">{node.slug === currentCategorySlug && <Check size={12} aria-hidden />}</span>
          <span className="f-val">{node.name}</span><span className="cnt">{node.productCount.toLocaleString("ru-RU")}</span>
        </Link>)}
        {normalized && !matches.length && <p className="catalog-search-hint">Категорий с таким названием нет. Нажмите лупу или Enter для поиска товаров.</p>}
      </div>
    </div>
  </>;
}
