"use client";

import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiltersPanelFields, type FiltersPanelProps } from "@/components/catalog-filters-panel";

type Props = FiltersPanelProps & {
  /** Active filter count to display on the trigger button badge. */
  activeCount: number;
};

export function MobileFilterSheet(props: Props) {
  const { activeCount, ...filterProps } = props;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Prevent background scroll while sheet is open.
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mob-filter-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden />
        <span>Фильтры</span>
        {activeCount > 0 && <span className="mob-filter-trigger-badge">{activeCount}</span>}
      </button>

      {open && (
        <div
          className="filter-sheet-backdrop"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="filter-sheet"
            role="dialog"
            aria-label="Фильтры каталога"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="filter-sheet-handle">
              <span className="filter-sheet-handle-bar" aria-hidden />
              <button
                type="button"
                className="filter-sheet-close"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <form action={filterProps.basePath} className="filter-sheet-form">
              <div className="filter-sheet-body">
                <FiltersPanelFields {...filterProps} />
              </div>
              <div className="filter-sheet-footer">
                <Link
                  href={filterProps.basePath}
                  className="btn btn-ghost"
                  onClick={() => setOpen(false)}
                  style={{ flex: 1 }}
                >
                  Сбросить
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  Применить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
