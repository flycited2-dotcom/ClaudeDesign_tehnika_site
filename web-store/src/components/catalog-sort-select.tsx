"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

const SORT_LABELS = {
  popular: "Сначала рекомендуемые",
  price_asc: "Сначала дешевле",
  price_desc: "Сначала дороже",
  new: "Сначала обновлённые",
} as const;

type SortValue = keyof typeof SORT_LABELS;

export function CatalogSortSelect({
  current,
  buildHref,
}: {
  current: SortValue;
  buildHref: (sort: SortValue) => string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <label
      className="sort"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.55)",
        border: "1px solid var(--glass-stroke)",
        opacity: isPending ? 0.65 : 1,
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text-mute)" }}>Сортировка:</span>
      <select
        value={current}
        onChange={(event) => {
          const next = event.target.value as SortValue;
          startTransition(() => {
            router.push(buildHref(next));
          });
        }}
        style={{
          background: "transparent",
          border: 0,
          outline: "none",
          fontWeight: 700,
          color: "var(--text)",
          fontSize: 13,
        }}
      >
        {(Object.entries(SORT_LABELS) as Array<[SortValue, string]>).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
