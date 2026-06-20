"use client";

import { useMemo, useState } from "react";

type SearchableCheckboxOption = {
  value: string;
  label: string;
  count?: number;
};

/** How many options to show before the "Показать ещё (N)" toggle appears. */
const COLLAPSED_LIMIT = 8;

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
  const [expanded, setExpanded] = useState(false);
  const selected = useMemo(() => new Set(selectedValues), [selectedValues]);
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
  const filteredOptions = normalizedQuery
    ? options.filter((option) => option.label.toLocaleLowerCase("ru-RU").includes(normalizedQuery))
    : options;

  // While searching, show every match. Otherwise show the first 8 and reveal
  // the rest on "Показать ещё (N)" — so long facet lists don't become a tall
  // internal scrollbox by default.
  const isSearching = normalizedQuery.length > 0;
  const hiddenCount = filteredOptions.length - COLLAPSED_LIMIT;
  const collapsible = !isSearching && !expanded && hiddenCount > 0;
  const visibleOptions = collapsible ? filteredOptions.slice(0, COLLAPSED_LIMIT) : filteredOptions;
  const visibleValues = new Set(visibleOptions.map((option) => option.value));

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {/* Keep selected-but-hidden values submitted (collapsed, filtered out, or
          hidden by the "Показать ещё" toggle) so applying the form preserves
          every active selection. */}
      {selectedValues
        .filter((value) => !visibleValues.has(value))
        .map((value) => (
          <input key={value} type="hidden" name={name} value={value} />
        ))}
      {options.length > 6 ? (
        <input
          className="input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          style={{ height: 38 }}
        />
      ) : null}
      <div className="f-list">
        {visibleOptions.map((option) => {
          const checked = selected.has(option.value);
          return (
            <label key={option.value} className={"f-row" + (checked ? " on" : "")} style={{ margin: 0 }}>
              <input
                name={name}
                value={option.value}
                type="checkbox"
                defaultChecked={checked}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
              />
              <span className="box" />
              <span className="f-val" title={option.label}>
                {option.label}
              </span>
              {typeof option.count === "number" ? (
                <span className="cnt">{option.count.toLocaleString("ru-RU")}</span>
              ) : null}
            </label>
          );
        })}
        {!visibleOptions.length ? (
          <p style={{ padding: "8px 0", fontSize: 13, color: "var(--text-mute)" }}>Ничего не найдено</p>
        ) : null}
      </div>
      {collapsible ? (
        <button type="button" className="f-more" onClick={() => setExpanded(true)}>
          Показать ещё ({hiddenCount.toLocaleString("ru-RU")})
        </button>
      ) : null}
      {!isSearching && expanded && options.length > COLLAPSED_LIMIT ? (
        <button type="button" className="f-more" onClick={() => setExpanded(false)}>
          Свернуть
        </button>
      ) : null}
    </div>
  );
}
