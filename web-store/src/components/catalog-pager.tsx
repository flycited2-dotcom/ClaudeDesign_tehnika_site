import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type Item =
  | { kind: "page"; page: number }
  | { kind: "current"; page: number }
  | { kind: "ellipsis"; key: string };

function buildPagerItems(current: number, total: number): Item[] {
  const items: Item[] = [];
  const push = (item: Item) => items.push(item);
  const add = (page: number) => push(page === current ? { kind: "current", page } : { kind: "page", page });

  if (total <= 7) {
    for (let page = 1; page <= total; page += 1) add(page);
    return items;
  }

  const window = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(window).filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  let previous = 0;
  for (const page of sorted) {
    if (page - previous > 1) push({ kind: "ellipsis", key: `e-${previous}-${page}` });
    add(page);
    previous = page;
  }
  return items;
}

export function CatalogPager({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const items = buildPagerItems(page, totalPages);

  return (
    <nav className="pager" aria-label="Пагинация каталога">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className="pager-link" aria-label="Предыдущая страница">
          <ChevronLeft size={14} aria-hidden /> Назад
        </Link>
      ) : (
        <span className="pager-link pager-link-disabled" aria-disabled>
          <ChevronLeft size={14} aria-hidden /> Назад
        </span>
      )}
      {items.map((item) => {
        if (item.kind === "ellipsis") {
          return (
            <span key={item.key} className="pager-ellipsis">
              …
            </span>
          );
        }
        if (item.kind === "current") {
          return (
            <span key={item.page} className="pager-link on" aria-current="page">
              {item.page}
            </span>
          );
        }
        return (
          <Link key={item.page} href={buildHref(item.page)} className="pager-link">
            {item.page}
          </Link>
        );
      })}
      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className="pager-link" aria-label="Следующая страница">
          Вперёд <ChevronRight size={14} aria-hidden />
        </Link>
      ) : (
        <span className="pager-link pager-link-disabled" aria-disabled>
          Вперёд <ChevronRight size={14} aria-hidden />
        </span>
      )}
    </nav>
  );
}
