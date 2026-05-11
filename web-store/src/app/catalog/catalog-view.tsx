import type { Product, ProductAttribute, ProductImage } from "@prisma/client";
import { ArrowUpDown, Check, ChevronDown, Search, X } from "lucide-react";
import Link from "next/link";
import { GlassProductCard } from "@/components/glass-product-card";
import { SearchableCheckboxList } from "@/components/searchable-checkbox-list";
import {
  catalogAttributeFilterParam,
  type CatalogAttributeFilter,
  type CatalogAttributeFilterGroup,
  type CatalogAttributeRangeFilter,
  type CatalogAttributeRangeGroup,
} from "@/lib/catalog-attribute-filters";
import { buildCatalogBreadcrumbItems, truncateBreadcrumbLabel } from "@/lib/catalog-breadcrumbs";
import type { CatalogBrandFilterOption } from "@/lib/catalog-brand-filters";
import type { CategoryTreeItem, FlatCategory } from "@/lib/catalog-tree";
import type { CatalogSort } from "@/lib/catalog-query";
import { getCatalogSpecFilterLabel, type CatalogSpecFilterOption, type CatalogSpecFilterValue } from "@/lib/catalog-spec-filters";

const catalogSortLabels: Record<CatalogSort, string> = {
  popular: "Сначала рекомендуемые",
  price_asc: "Сначала дешевле",
  price_desc: "Сначала дороже",
  new: "Сначала обновленные",
};

type CatalogUrlState = {
  query?: string;
  brands?: string[];
  onlyAvailable?: boolean;
  withPhoto?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSort;
  specFilters?: CatalogSpecFilterValue[];
  attributeFilters?: CatalogAttributeFilter[];
  attributeRangeFilters?: CatalogAttributeRangeFilter[];
  page?: number;
};

function catalogHref(basePath: string, state: CatalogUrlState): string {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  state.brands?.forEach((brand) => params.append("brand", brand));
  if (state.onlyAvailable) params.set("available", "1");
  if (state.withPhoto) params.set("photo", "1");
  if (state.minPrice) params.set("minPrice", String(state.minPrice));
  if (state.maxPrice) params.set("maxPrice", String(state.maxPrice));
  if (state.sort && state.sort !== "popular") params.set("sort", state.sort);
  state.specFilters?.forEach((filter) => params.append("spec", filter));
  state.attributeFilters?.forEach((filter) => params.append("attr", catalogAttributeFilterParam(filter)));
  state.attributeRangeFilters?.forEach((filter) => {
    if (filter.min !== undefined) params.append("attrMin", `${filter.key}:${filter.min}`);
    if (filter.max !== undefined) params.append("attrMax", `${filter.key}:${filter.max}`);
  });
  if (state.page && state.page > 1) params.set("page", String(state.page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function removeAttributeRangeBound(
  filters: CatalogAttributeRangeFilter[] | undefined,
  key: string,
  bound: "min" | "max",
): CatalogAttributeRangeFilter[] {
  return (filters ?? []).flatMap((filter) => {
    if (filter.key !== key) return [filter];

    const next = { ...filter, [bound]: undefined };
    return next.min !== undefined || next.max !== undefined ? [next] : [];
  });
}

function hasActiveCategory(category: CategoryTreeItem, currentCategorySlug?: string): boolean {
  return category.slug === currentCategorySlug || category.children.some((child) => hasActiveCategory(child, currentCategorySlug));
}

function CategoryBranch({
  category,
  currentCategorySlug,
  level = 0,
}: {
  category: CategoryTreeItem;
  currentCategorySlug?: string;
  level?: number;
}) {
  const active = category.slug === currentCategorySlug;
  const expanded = currentCategorySlug ? hasActiveCategory(category, currentCategorySlug) : false;

  return (
    <div>
      <Link
        href={`/catalog/${category.slug}`}
        aria-current={active ? "page" : undefined}
        className={"f-row " + (active ? "on" : "")}
        style={{ paddingLeft: `${10 + level * 14}px` }}
      >
        <span className="box">{active && <Check size={12} aria-hidden />}</span>
        <span style={{ flex: 1, minWidth: 0 }}>{category.name}</span>
        <span className="cnt">{category.productCount.toLocaleString("ru-RU")}</span>
      </Link>
      {expanded && category.children.length > 0 ? (
        <div>
          {category.children.map((child) => (
            <CategoryBranch key={child.id} category={child} currentCategorySlug={currentCategorySlug} level={level + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SearchSection({ basePath, currentQuery }: { basePath: string; currentQuery?: string }) {
  return (
    <form action={basePath} className="f-section" style={{ paddingTop: 0, borderTop: 0 }}>
      <h4>Поиск</h4>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,0.56)",
          border: "1px solid var(--glass-stroke)",
          borderRadius: 14,
          height: 44,
          padding: "0 14px",
        }}
      >
        <Search size={16} aria-hidden style={{ opacity: 0.6 }} />
        <input
          name="q"
          defaultValue={currentQuery}
          placeholder="Название, SKU, бренд"
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            background: "transparent",
            outline: "none",
            fontSize: 14,
          }}
        />
      </div>
    </form>
  );
}

function CategoriesSection({
  categories,
  currentCategorySlug,
}: {
  categories: CategoryTreeItem[];
  currentCategorySlug?: string;
}) {
  const totalCount = categories.reduce((sum, category) => sum + category.productCount, 0);
  return (
    <div className="f-section">
      <h4>Категории</h4>
      <div style={{ maxHeight: "40vh", overflow: "auto" }}>
        <Link
          href="/catalog"
          aria-current={!currentCategorySlug ? "page" : undefined}
          className={"f-row " + (!currentCategorySlug ? "on" : "")}
        >
          <span className="box">{!currentCategorySlug && <Check size={12} aria-hidden />}</span>
          <span style={{ flex: 1, minWidth: 0 }}>Все товары</span>
          <span className="cnt">{totalCount.toLocaleString("ru-RU")}</span>
        </Link>
        {categories.map((category) => (
          <CategoryBranch key={category.id} category={category} currentCategorySlug={currentCategorySlug} />
        ))}
      </div>
    </div>
  );
}

function FiltersPanel({
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
}: {
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
}) {
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
  const specFilterGroups = specFilterOptions.reduce<Array<{ label: string; options: CatalogSpecFilterOption[] }>>((groups, option) => {
    const group = groups.find((item) => item.label === option.groupLabel);
    if (group) {
      group.options.push(option);
    } else {
      groups.push({ label: option.groupLabel, options: [option] });
    }
    return groups;
  }, []);

  return (
    <form action={basePath}>
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
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-soft)", marginBottom: 8 }}>
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
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-soft)", marginBottom: 8 }}>
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
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-soft)", marginBottom: 6 }}>
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

      <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 14, height: 44 }}>
        Применить
      </button>
    </form>
  );
}

function CatalogSortBar({
  basePath,
  state,
  total,
}: {
  basePath: string;
  state: CatalogUrlState & { sort: CatalogSort };
  total: number;
}) {
  return (
    <div className="cat-toolbar">
      <div className="left">
        Найдено <b>{total.toLocaleString("ru-RU")}</b> товаров
      </div>
      <form
        action={basePath}
        className="left"
        style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 10 }}
      >
        {state.query ? <input type="hidden" name="q" value={state.query} /> : null}
        {state.brands?.map((brand) => <input key={brand} type="hidden" name="brand" value={brand} />)}
        {state.onlyAvailable ? <input type="hidden" name="available" value="1" /> : null}
        {state.withPhoto ? <input type="hidden" name="photo" value="1" /> : null}
        {state.minPrice ? <input type="hidden" name="minPrice" value={state.minPrice} /> : null}
        {state.maxPrice ? <input type="hidden" name="maxPrice" value={state.maxPrice} /> : null}
        {state.specFilters?.map((filter) => <input key={filter} type="hidden" name="spec" value={filter} />)}
        {state.attributeFilters?.map((filter) => (
          <input key={catalogAttributeFilterParam(filter)} type="hidden" name="attr" value={catalogAttributeFilterParam(filter)} />
        ))}
        {state.attributeRangeFilters?.flatMap((filter) => {
          const inputs: React.ReactNode[] = [];
          if (filter.min !== undefined) {
            inputs.push(
              <input
                key={`min-${filter.key}`}
                type="hidden"
                name="attrMin"
                value={`${filter.key}:${filter.min}`}
              />,
            );
          }
          if (filter.max !== undefined) {
            inputs.push(
              <input
                key={`max-${filter.key}`}
                type="hidden"
                name="attrMax"
                value={`${filter.key}:${filter.max}`}
              />,
            );
          }
          return inputs;
        })}
        <span className="sort" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ArrowUpDown size={14} aria-hidden />
          <select
            name="sort"
            defaultValue={state.sort}
            style={{ background: "transparent", border: 0, fontWeight: 700, color: "inherit", outline: "none" }}
          >
            {Object.entries(catalogSortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden />
        </span>
        <button type="submit" className="btn btn-soft btn-sm">
          Ок
        </button>
      </form>
    </div>
  );
}

function ActiveFilterChips({
  basePath,
  state,
  specFilterOptions,
  attributeFilterGroups,
  attributeRangeGroups,
}: {
  basePath: string;
  state: CatalogUrlState & { sort: CatalogSort };
  specFilterOptions: CatalogSpecFilterOption[];
  attributeFilterGroups: CatalogAttributeFilterGroup[];
  attributeRangeGroups: CatalogAttributeRangeGroup[];
}) {
  const specFilterLabels = new Map(specFilterOptions.map((option) => [option.key, option.label]));
  const attributeFilterLabels = new Map(
    attributeFilterGroups.flatMap((group) => group.options.map((option) => [option.value, `${group.label}: ${option.label}`])),
  );
  const attributeRangeLabels = new Map(attributeRangeGroups.map((group) => [group.key, group]));
  const chips = [
    state.query
      ? { label: `Поиск: ${state.query}`, href: catalogHref(basePath, { ...state, query: undefined, page: 1 }) }
      : null,
    ...(state.brands ?? []).map((brand) => ({
      label: `Бренд: ${brand}`,
      href: catalogHref(basePath, { ...state, brands: state.brands?.filter((current) => current !== brand), page: 1 }),
    })),
    state.onlyAvailable
      ? { label: "Доступно к заказу", href: catalogHref(basePath, { ...state, onlyAvailable: false, page: 1 }) }
      : null,
    state.withPhoto ? { label: "С фото", href: catalogHref(basePath, { ...state, withPhoto: false, page: 1 }) } : null,
    state.minPrice
      ? { label: `От ${state.minPrice.toLocaleString("ru-RU")} ₽`, href: catalogHref(basePath, { ...state, minPrice: undefined, page: 1 }) }
      : null,
    state.maxPrice
      ? { label: `До ${state.maxPrice.toLocaleString("ru-RU")} ₽`, href: catalogHref(basePath, { ...state, maxPrice: undefined, page: 1 }) }
      : null,
    ...(state.specFilters ?? []).map((filter) => ({
      label: specFilterLabels.get(filter) ?? getCatalogSpecFilterLabel(filter),
      href: catalogHref(basePath, { ...state, specFilters: state.specFilters?.filter((current) => current !== filter), page: 1 }),
    })),
    ...(state.attributeFilters ?? []).map((filter) => {
      const value = catalogAttributeFilterParam(filter);
      return {
        label: attributeFilterLabels.get(value) ?? value,
        href: catalogHref(basePath, {
          ...state,
          attributeFilters: state.attributeFilters?.filter((current) => catalogAttributeFilterParam(current) !== value),
          page: 1,
        }),
      };
    }),
    ...(state.attributeRangeFilters ?? []).flatMap((filter) => {
      const group = attributeRangeLabels.get(filter.key);
      const label = group?.label ?? filter.key;
      const unit = group?.unit ? ` ${group.unit}` : "";
      const rangeChips: Array<{ label: string; href: string }> = [];
      if (filter.min !== undefined) {
        rangeChips.push({
          label: `${label}: от ${filter.min.toLocaleString("ru-RU")}${unit}`,
          href: catalogHref(basePath, {
            ...state,
            attributeRangeFilters: removeAttributeRangeBound(state.attributeRangeFilters, filter.key, "min"),
            page: 1,
          }),
        });
      }
      if (filter.max !== undefined) {
        rangeChips.push({
          label: `${label}: до ${filter.max.toLocaleString("ru-RU")}${unit}`,
          href: catalogHref(basePath, {
            ...state,
            attributeRangeFilters: removeAttributeRangeBound(state.attributeRangeFilters, filter.key, "max"),
            page: 1,
          }),
        });
      }
      return rangeChips;
    }),
    state.sort !== "popular"
      ? { label: catalogSortLabels[state.sort], href: catalogHref(basePath, { ...state, sort: "popular", page: 1 }) }
      : null,
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  if (!chips.length) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 16px" }}>
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          className="btn btn-soft btn-sm"
          style={{ paddingRight: 12, gap: 6 }}
        >
          {chip.label}
          <X size={12} aria-hidden />
        </Link>
      ))}
      <Link href={basePath} className="btn btn-ghost btn-sm">
        Сбросить всё
      </Link>
    </div>
  );
}

export function CatalogView({
  title,
  categoryPath = [],
  products,
  total,
  page,
  perPage,
  categories,
  brands,
  currentCategorySlug,
  currentQuery,
  currentBrands = [],
  onlyAvailable,
  withPhoto,
  minPrice,
  maxPrice,
  sort = "popular",
  currentSpecFilters = [],
  specFilterOptions = [],
  currentAttributeFilters = [],
  attributeFilterGroups = [],
  currentAttributeRangeFilters = [],
  attributeRangeGroups = [],
  basePath = "/catalog",
  error,
}: {
  title: string;
  categoryPath?: FlatCategory[];
  products: Array<Product & { images?: ProductImage[]; attributes?: ProductAttribute[] }>;
  total: number;
  page: number;
  perPage: number;
  categories: CategoryTreeItem[];
  brands: CatalogBrandFilterOption[];
  currentCategorySlug?: string;
  currentQuery?: string;
  currentBrands?: string[];
  onlyAvailable?: boolean;
  withPhoto?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSort;
  currentSpecFilters?: CatalogSpecFilterValue[];
  specFilterOptions?: CatalogSpecFilterOption[];
  currentAttributeFilters?: CatalogAttributeFilter[];
  attributeFilterGroups?: CatalogAttributeFilterGroup[];
  currentAttributeRangeFilters?: CatalogAttributeRangeFilter[];
  attributeRangeGroups?: CatalogAttributeRangeGroup[];
  basePath?: string;
  error?: string;
}) {
  const totalPages = Math.max(Math.ceil(total / perPage), 1);
  const state = {
    query: currentQuery,
    brands: currentBrands,
    onlyAvailable,
    withPhoto,
    minPrice,
    maxPrice,
    sort,
    specFilters: currentSpecFilters,
    attributeFilters: currentAttributeFilters,
    attributeRangeFilters: currentAttributeRangeFilters,
  };
  const pageHref = (nextPage: number) => catalogHref(basePath, { ...state, page: nextPage });
  const breadcrumbs = buildCatalogBreadcrumbItems(categoryPath);

  return (
    <>
      <div className="bread">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const label = truncateBreadcrumbLabel(item.label, isLast ? 56 : 28);
          return (
            <span
              key={`${item.href ?? item.label}-${index}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                maxWidth: isLast ? "min(420px, 50vw)" : "240px",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
              title={item.label}
            >
              {index > 0 ? <span>›</span> : null}
              {item.href && !isLast ? (
                <Link href={item.href} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {label}
                </Link>
              ) : (
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
              )}
            </span>
          );
        })}
      </div>

      <div className="section-head" style={{ margin: "6px 4px 18px" }}>
        <div>
          <h2>{title}</h2>
          <div className="meta">{total.toLocaleString("ru-RU")} товаров</div>
        </div>
      </div>

      <div className="cat-layout">
        <aside
          className="filters"
          style={{ maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}
        >
          <SearchSection basePath={basePath} currentQuery={currentQuery} />
          <CategoriesSection categories={categories} currentCategorySlug={currentCategorySlug} />
          <FiltersPanel
            basePath={basePath}
            brands={brands}
            currentBrands={currentBrands}
            currentQuery={currentQuery}
            onlyAvailable={onlyAvailable}
            withPhoto={withPhoto}
            minPrice={minPrice}
            maxPrice={maxPrice}
            sort={sort}
            specFilterOptions={specFilterOptions}
            currentSpecFilters={currentSpecFilters}
            attributeFilterGroups={attributeFilterGroups}
            currentAttributeFilters={currentAttributeFilters}
            attributeRangeGroups={attributeRangeGroups}
            currentAttributeRangeFilters={currentAttributeRangeFilters}
          />
        </aside>

        <div>
          <CatalogSortBar basePath={basePath} state={state} total={total} />
          <ActiveFilterChips
            basePath={basePath}
            state={state}
            specFilterOptions={specFilterOptions}
            attributeFilterGroups={attributeFilterGroups}
            attributeRangeGroups={attributeRangeGroups}
          />

          {error ? (
            <div
              className="glass"
              style={{ padding: 16, marginBottom: 16, color: "var(--text-2)", borderRadius: 16 }}
            >
              {error}
            </div>
          ) : null}

          {products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <GlassProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="glass" style={{ padding: 32, textAlign: "center", borderRadius: 18 }}>
              <p style={{ fontWeight: 700, fontSize: 18 }}>Товары не найдены</p>
              <p style={{ marginTop: 8, color: "var(--text-mute)" }}>
                Попробуйте изменить поиск, выбрать другой бренд или открыть весь каталог.
              </p>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="pager">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="pager-link">
                  ‹
                </Link>
              ) : null}
              <span className="on">{page}</span>
              <span style={{ color: "var(--text-mute)" }}>
                из {totalPages}
              </span>
              {page < totalPages ? (
                <Link href={pageHref(page + 1)} className="pager-link">
                  ›
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
