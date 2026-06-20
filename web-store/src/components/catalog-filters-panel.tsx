import Link from "next/link";
import { FilterAccordion } from "@/components/filter-accordion";
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
 * "Быстрые подборки" — the curated `spec` presets shown as prominent
 * one-click toggle chips at the top of the panel (marketing shortcuts like
 * "No Frost", "4K", "Узкие"). Same `spec` URL param / contract as before:
 * each chip is a label-wrapped checkbox so it serialises with the native GET
 * form. Selected chips that aren't in the current category's option list are
 * preserved via hidden inputs so applying the form keeps them.
 */
function QuickPickChips({
  options,
  selectedValues,
}: {
  options: CatalogSpecFilterOption[];
  selectedValues: string[];
}) {
  const visibleValues = new Set<string>(options.map((option) => option.key));
  return (
    <div className="f-section f-quickpicks">
      <h4>Быстрые подборки</h4>
      {selectedValues
        .filter((value) => !visibleValues.has(value))
        .map((value) => (
          <input key={value} type="hidden" name="spec" value={value} />
        ))}
      <div className="quickpick-row">
        {options.map((option) => {
          const checked = selectedValues.includes(option.key);
          return (
            <label key={option.key} className={"quickpick" + (checked ? " on" : "")} title={option.label}>
              <input
                type="checkbox"
                name="spec"
                value={option.key}
                defaultChecked={checked}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
              />
              <span className="quickpick-label">{option.label}</span>
              {typeof option.count === "number" ? (
                <span className="quickpick-cnt">{option.count.toLocaleString("ru-RU")}</span>
              ) : null}
            </label>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Just the filter input fields (no <form>, no Apply button). The desktop
 * sidebar uses this via `FiltersPanel`; the mobile bottom-sheet wraps it
 * in its own form with a sticky footer.
 *
 * Layout: quick-pick chips up top, then each group in a collapsible
 * accordion. Default-open: Price, Availability, and the first 1–2 attribute
 * groups (the most-used facets); everything else is collapsed to avoid the
 * long "простыня".
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

  const currentAttributeFilterParams = currentAttributeFilters.map(catalogAttributeFilterParam);
  const selectedAttributeParams = new Set(currentAttributeFilterParams);

  // Count selections per attribute group so a collapsed accordion still shows
  // its active badge.
  const attributeGroupSelectedCount = (group: CatalogAttributeFilterGroup) =>
    group.options.reduce((sum, option) => sum + (selectedAttributeParams.has(option.value) ? 1 : 0), 0);

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

      {specFilterOptions.length > 0 && (
        <QuickPickChips options={specFilterOptions} selectedValues={currentSpecFilters} />
      )}

      <FilterAccordion title="Цена, ₽" defaultOpen>
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
      </FilterAccordion>

      <FilterAccordion title="Наличие" defaultOpen badge={(onlyAvailable ? 1 : 0) + (withPhoto ? 1 : 0)}>
        <label className="f-row" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            name="available"
            value="1"
            defaultChecked={onlyAvailable}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
          />
          <span className="box" />
          <span className="f-val">Доступно к заказу</span>
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
          <span className="f-val">Только с фото</span>
        </label>
      </FilterAccordion>

      {attributeFilterGroups.map((group, index) => (
        <FilterAccordion
          key={group.key}
          title={group.label}
          defaultOpen={index < 2}
          badge={attributeGroupSelectedCount(group)}
        >
          <SearchableCheckboxList
            name="attr"
            options={group.options}
            selectedValues={currentAttributeFilterParams}
            searchPlaceholder="Найти значение"
          />
        </FilterAccordion>
      ))}

      {brands.length > 0 && (
        <FilterAccordion title="Бренд" badge={currentBrands.length}>
          <SearchableCheckboxList
            name="brand"
            options={brands.map((brand) => ({ value: brand.value, label: brand.value, count: brand.count }))}
            selectedValues={currentBrands}
            searchPlaceholder="Найти бренд"
          />
        </FilterAccordion>
      )}

      {attributeRangeGroups.length > 0 && (
        <FilterAccordion title="Диапазоны">
          <div style={{ display: "grid", gap: 12 }}>
            {attributeRangeGroups.map((group) => {
              const current = currentAttributeRangeFilters.find((filter) => filter.key === group.key);
              const unit = group.unit ? `, ${group.unit}` : "";
              return (
                <div key={group.key}>
                  <p className="f-sublabel">
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
        </FilterAccordion>
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
