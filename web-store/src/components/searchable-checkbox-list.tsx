"use client";

import { useMemo, useState } from "react";

type SearchableCheckboxOption = {
  value: string;
  label: string;
  count?: number;
};

export function SearchableCheckboxList({
  name,
  options,
  selectedValues = [],
  searchPlaceholder,
}: {
  name: string;
  options: SearchableCheckboxOption[];
  selectedValues?: string[];
  searchPlaceholder: string;
}) {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(selectedValues), [selectedValues]);
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
  const visibleOptions = normalizedQuery
    ? options.filter((option) => option.label.toLocaleLowerCase("ru-RU").includes(normalizedQuery))
    : options;
  const visibleValues = new Set(visibleOptions.map((option) => option.value));

  return (
    <div className="grid gap-2">
      {selectedValues
        .filter((value) => !visibleValues.has(value))
        .map((value) => (
          <input key={value} type="hidden" name={name} value={value} />
        ))}
      {options.length > 6 ? (
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 placeholder:text-zinc-400"
        />
      ) : null}
      <div className="grid max-h-52 gap-2 overflow-auto rounded-lg border border-zinc-200 bg-white p-3">
        {visibleOptions.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              name={name}
              value={option.value}
              type="checkbox"
              defaultChecked={selected.has(option.value)}
              className="size-4 accent-teal-700"
            />
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {typeof option.count === "number" ? (
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                {option.count.toLocaleString("ru-RU")}
              </span>
            ) : null}
          </label>
        ))}
        {!visibleOptions.length ? <p className="py-2 text-sm text-zinc-500">Ничего не найдено</p> : null}
      </div>
    </div>
  );
}
