import Link from "next/link";
import { SearchableCheckboxList } from "@/components/searchable-checkbox-list";
import {
  catalogAttributeFilterParam,
  type CatalogAttributeFilter,
  type CatalogAttributeFilterGroup,
  type CatalogAttributeRangeFilter,
  type CatalogAttributeRangeGroup,
} from "@/lib/catalog-attribute-filters";
import type { CatalogBrandFilterOption } from "@/lib/catalog-brand-filters";
import type { CatalogSort } from "@/lib/catalog-query";
import type { CatalogSpecFilterOption, CatalogSpecFilterValue } from "@/lib/catalog-spec-filters";

export type FiltersPanelProps = {
  basePath: string;
  brands: CatalogBrandFilterOption[];
  currentBrands?: string[];
  currentQuery?: string;
  onlyAvailable?: boolean;
  withPhoto?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort: CatalogSort;
  specFilterOptions: CatalogSpecFilterOption[];
  currentSpecFilters?: CatalogSpecFilterValue[];
  attributeFilterGroups: CatalogAttributeFilterGroup[];
  currentAttributeFilters?: CatalogAttributeFilter[];
  attributeRangeGroups: CatalogAttributeRangeGroup[];
  currentAttributeRangeFilters?: CatalogAttributeRangeFilter[];
};

/**
 * Just the filter input fields (no <form>, no Apply button). The desktop
 * sidebar uses this via `FiltersPanel`; the mobile bottom-sheet wraps it
 * in its own form with a sticky footer.
 */
export function FiltersPanelFields({
  basePath,
  brands,
  currentBrands = [],
  currentQuery,
  onlyAvailable,
  withPhoto,
  minPrice,
  maxPrice,
  sort,
  specFilterOptions,
  currentSpecFilters = [],
  attributeFilterGroups,
  currentAttributeFilters = [],
  attributeRangeGroups,
  currentAttributeRangeFilters = [],
}: FiltersPanelProps) {
  const hasFilters = Boolean(
    currentBrands.length ||
      currentQuery ||
      onlyAvailable ||
      withPhoto ||
      minPrice ||
      maxPrice ||
      sort !== "popular" ||
      currentSpecFilters.length ||
      currentAttributeFilters.length ||
      currentAttributeRangeFilters.length,
  );
  const specFilterGroups = specFilterOptions.reduce<Array<{ label: string; options: CatalogSpecFilterOption[] }>>(
    (groups, option) => {
      const group = groups.find((item) => item.label === option.groupLabel);
      if (group) {
        group.options.push(option);
      } else {
        groups.push({ label: option.groupLabel, options: [option] });
      }
      return groups;
    },
    [],
  );

  return (
    <>
      <div
        className="f-section"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h4 style={{ margin: 0 }}>Фильтры</h4>
        {hasFilters ? (
          <Link href={basePath} style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-2)" }}>
            Сбросить
          </Link>
        ) : null}
      </div>
      {currentQuery ? <input type="hidden" name="q" value={currentQuery} /> : null}
      {sort !== "popular" ? <input type="hidden" name="sort" value={sort} /> : null}

      {brands.length > 0 && (
        <div className="f-section">
          <h4>Бренд</h4>
          <SearchableCheckboxList
            name="brand"
            options={brands.map((brand) => ({ value: brand.value, label: brand.value, count: brand.count }))}
            selectedValues={currentBrands}
            searchPlaceholder="Найти бренд"
          />
        </div>
      )}

      <div className="f-section">
        <h4>Цена, ₽</h4>
        <div className="range-row">
          <input
            className="input"
            name="minPrice"
            inputMode="numeric"
            defaultValue={minPrice ?? ""}
            placeholder="от 0"
          />
          <input
            className="input"
            name="maxPrice"
            inputMode="numeric"
            defaultValue={maxPrice ?? ""}
            placeholder="до любая"
          />
        </div>
      </div>

      <div className="f-section">
        <h4>Наличие</h4>
        <label className="f-row" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            name="available"
            value="1"
            defaultChecked={onlyAvailable}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
          />
          <span className="box" />
          <span style={{ flex: 1 }}>Доступно к заказу</span>
        </label>
        <label className="f-row" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            name="photo"
            value="1"
            defaultChecked={withPhoto}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
          />
          <span className="box" />
          <span style={{ flex: 1 }}>Только с фото</span>
        </label>
      </div>

      {specFilterOptions.length > 0 && (
        <div className="f-section">
          <h4>Характеристики</h4>
          <div style={{ display: "grid", gap: 16 }}>
            {specFilterGroups.map((group) => (
              <div key={group.label}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: "var(--text-soft)",
                    marginBottom: 8,
                  }}
                >
                  {group.label}
                </p>
                <SearchableCheckboxList
                  name="spec"
                  options={group.options.map((option) => ({ value: option.key, label: option.label, count: option.count }))}
                  selectedValues={currentSpecFilters}
                  searchPlaceholder="Найти характеристику"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {attributeFilterGroups.length > 0 && (
        <div className="f-section">
          <h4>Параметры товаров</h4>
          <div style={{ display: "grid", gap: 16 }}>
            {attributeFilterGroups.map((group) => (
              <div key={group.key}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: "var(--text-soft)",
                    marginBottom: 8,
                  }}
                >
                  {group.label}
                </p>
                <SearchableCheckboxList
                  name="attr"
                  options={group.options}
                  selectedValues={currentAttributeFilters.map(catalogAttributeFilterParam)}
                  searchPlaceholder="Найти значение"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {attributeRangeGroups.length > 0 && (
        <div className="f-section">
          <h4>Диапазоны</h4>
          <div style={{ display: "grid", gap: 12 }}>
            {attributeRangeGroups.map((group) => {
              const current = currentAttributeRangeFilters.find((filter) => filter.key === group.key);
              const unit = group.unit ? `, ${group.unit}` : "";
              return (
                <div key={group.key}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      color: "var(--text-soft)",
                      marginBottom: 6,
                    }}
                  >
                    {group.label}
                    {unit}
                  </p>
                  <div className="range-row">
                    <input
                      className="input"
                      name={`attrMin.${group.key}`}
                      inputMode="decimal"
                      defaultValue={current?.min ?? ""}
                      placeholder={`от ${group.min}`}
                    />
                    <input
                      className="input"
                      name={`attrMax.${group.key}`}
                      inputMode="decimal"
                      defaultValue={current?.max ?? ""}
                      placeholder={`до ${group.max}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Desktop sidebar filter panel: wraps the fields in a <form> with a
 * full-width Apply button at the bottom.
 */
export function FiltersPanel(props: FiltersPanelProps) {
  return (
    <form action={props.basePath}>
      <FiltersPanelFields {...props} />
      <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 14, height: 44 }}>
        Применить
      </button>
    </form>
  );
}
