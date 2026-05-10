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
    <div style={{ display: "grid", gap: 8 }}>
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
      <div
        style={{
          display: "grid",
          gap: 2,
          maxHeight: 220,
          overflow: "auto",
          paddingRight: 4,
        }}
      >
        {visibleOptions.map((option) => {
          const checked = selected.has(option.value);
          return (
            <label
              key={option.value}
              className={"f-row " + (checked ? "on" : "")}
              style={{ cursor: "pointer", margin: 0 }}
            >
              <input
                name={name}
                value={option.value}
                type="checkbox"
                defaultChecked={checked}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
              />
              <span className="box" />
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
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
    </div>
  );
}
