import type { Product, ProductImage } from "@prisma/client";
import { ArrowUpDown, ChevronDown, Image as ImageIcon, Phone, Search, ShieldCheck, SlidersHorizontal, Truck, X } from "lucide-react";
import Link from "next/link";
import { CatalogGrid } from "@/components/catalog-grid";
import { SearchableCheckboxList } from "@/components/searchable-checkbox-list";
import {
  catalogAttributeFilterParam,
  type CatalogAttributeFilter,
  type CatalogAttributeFilterGroup,
  type CatalogAttributeRangeFilter,
  type CatalogAttributeRangeGroup,
} from "@/lib/catalog-attribute-filters";
import { buildCatalogBreadcrumbItems } from "@/lib/catalog-breadcrumbs";
import type { CatalogBrandFilterOption } from "@/lib/catalog-brand-filters";
import type { CategoryTreeItem, FlatCategory } from "@/lib/catalog-tree";
import type { CatalogSort } from "@/lib/catalog-query";
import { getCatalogSpecFilterLabel, type CatalogSpecFilterOption, type CatalogSpecFilterValue } from "@/lib/catalog-spec-filters";
import { countActiveCatalogFilters } from "@/lib/catalog-ui";
import { phoneHref, storefront } from "@/lib/storefront";

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
        className={[
          "group flex items-start justify-between gap-3 rounded-md border-l-2 py-2 pr-2 text-sm font-medium hover:bg-stone-100",
          active ? "border-teal-600 bg-teal-50 text-teal-900" : "border-transparent text-zinc-700",
        ].join(" ")}
        style={{ paddingLeft: `${8 + level * 12}px` }}
      >
        <span className="min-w-0 flex-1 break-words leading-5">{category.name}</span>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
          {category.productCount.toLocaleString("ru-RU")}
        </span>
      </Link>
      {expanded && category.children.length ? (
        <div className="mt-1 space-y-1 border-l border-zinc-100 pl-2">
          {category.children.map((child) => (
            <CategoryBranch key={child.id} category={child} currentCategorySlug={currentCategorySlug} level={level + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SearchPanel({
  basePath,
  currentQuery,
  framed = true,
}: {
  basePath: string;
  currentQuery?: string;
  framed?: boolean;
}) {
  return (
    <div className={framed ? "rounded-lg border border-zinc-200 bg-white p-4" : ""}>
      <p className="text-sm font-bold uppercase tracking-wide text-zinc-500">Поиск</p>
      <form action={basePath} className="mt-3 flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
        <Search className="mr-2 size-4 text-zinc-400" aria-hidden />
        <input
          name="q"
          defaultValue={currentQuery}
          placeholder="Название, SKU, бренд"
          className="min-w-0 flex-1 bg-transparent text-sm"
        />
      </form>
    </div>
  );
}

function CategoriesPanel({
  categories,
  currentCategorySlug,
  framed = true,
}: {
  categories: CategoryTreeItem[];
  currentCategorySlug?: string;
  framed?: boolean;
}) {
  return (
    <div className={framed ? "rounded-lg border border-zinc-200 bg-white p-4" : ""}>
      {framed ? <p className="text-sm font-bold uppercase tracking-wide text-zinc-500">Категории</p> : null}
      <div className="mt-3 max-h-[70vh] space-y-1 overflow-auto pr-1">
        <Link
          href="/catalog"
          aria-current={!currentCategorySlug ? "page" : undefined}
          className={[
            "flex items-start justify-between gap-3 rounded-md px-2 py-2 text-sm font-medium hover:bg-stone-100",
            !currentCategorySlug ? "bg-teal-50 text-teal-900" : "text-zinc-700",
          ].join(" ")}
        >
          <span className="min-w-0 flex-1 break-words leading-5">Все товары</span>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
            {categories.reduce((sum, category) => sum + category.productCount, 0).toLocaleString("ru-RU")}
          </span>
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
  framed = true,
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
  framed?: boolean;
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
    <form action={basePath} className={framed ? "rounded-lg border border-zinc-200 bg-white p-4" : ""}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-wide text-zinc-500">Фильтры</p>
        {hasFilters ? (
          <Link href={basePath} className="text-xs font-semibold text-teal-800 hover:text-teal-950">
            Сбросить
          </Link>
        ) : null}
      </div>
      {currentQuery ? <input type="hidden" name="q" value={currentQuery} /> : null}
      {sort !== "popular" ? <input type="hidden" name="sort" value={sort} /> : null}
      {brands.length ? (
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-zinc-700">Бренды</legend>
          <div className="mt-2">
            <SearchableCheckboxList
              name="brand"
              options={brands.map((brand) => ({ value: brand.value, label: brand.value, count: brand.count }))}
              selectedValues={currentBrands}
              searchPlaceholder="Найти бренд"
            />
          </div>
        </fieldset>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-zinc-700">
          Цена от
          <input
            name="minPrice"
            inputMode="numeric"
            defaultValue={minPrice ?? ""}
            placeholder="0"
            className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700">
          Цена до
          <input
            name="maxPrice"
            inputMode="numeric"
            defaultValue={maxPrice ?? ""}
            placeholder="любая"
            className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
          />
        </label>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-zinc-700">
        <input name="available" value="1" type="checkbox" defaultChecked={onlyAvailable} className="size-4 accent-teal-700" />
        Доступно к заказу
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700">
        <input name="photo" value="1" type="checkbox" defaultChecked={withPhoto} className="size-4 accent-teal-700" />
        Только с фото
      </label>
      {specFilterOptions.length ? (
        <fieldset className="mt-4 border-t border-zinc-100 pt-4">
          <legend className="text-sm font-semibold text-zinc-700">Характеристики</legend>
          <div className="mt-3 grid gap-4">
            {specFilterGroups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{group.label}</p>
                <div className="mt-2">
                  <SearchableCheckboxList
                    name="spec"
                    options={group.options.map((option) => ({ value: option.key, label: option.label, count: option.count }))}
                    selectedValues={currentSpecFilters}
                    searchPlaceholder="Найти характеристику"
                  />
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      ) : null}
      {attributeFilterGroups.length ? (
        <fieldset className="mt-4 border-t border-zinc-100 pt-4">
          <legend className="text-sm font-semibold text-zinc-700">Параметры товаров</legend>
          <div className="mt-3 grid gap-4">
            {attributeFilterGroups.map((group) => (
              <div key={group.key}>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{group.label}</p>
                <div className="mt-2">
                  <SearchableCheckboxList
                    name="attr"
                    options={group.options}
                    selectedValues={currentAttributeFilters.map(catalogAttributeFilterParam)}
                    searchPlaceholder="Найти значение"
                  />
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      ) : null}
      {attributeRangeGroups.length ? (
        <fieldset className="mt-4 border-t border-zinc-100 pt-4">
          <legend className="text-sm font-semibold text-zinc-700">Диапазоны</legend>
          <div className="mt-3 grid gap-4">
            {attributeRangeGroups.map((group) => {
              const current = currentAttributeRangeFilters.find((filter) => filter.key === group.key);
              const unit = group.unit ? `, ${group.unit}` : "";

              return (
                <div key={group.key}>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    {group.label}
                    {unit}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <label className="block text-sm font-medium text-zinc-700">
                      От
                      <input
                        name={`attrMin.${group.key}`}
                        inputMode="decimal"
                        defaultValue={current?.min ?? ""}
                        placeholder={String(group.min)}
                        className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="block text-sm font-medium text-zinc-700">
                      До
                      <input
                        name={`attrMax.${group.key}`}
                        inputMode="decimal"
                        defaultValue={current?.max ?? ""}
                        placeholder={String(group.max)}
                        className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      <button className="mt-4 h-10 w-full rounded-lg bg-zinc-950 text-sm font-semibold text-white hover:bg-teal-800">
        Применить
      </button>
    </form>
  );
}

function CatalogTrustStrip() {
  return (
    <div className="mb-6 grid gap-2 sm:grid-cols-3">
      <div className="flex gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
        <Truck className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Доставка по региону</p>
          <p className="mt-1 text-xs leading-5">{storefront.region}</p>
        </div>
      </div>
      <div className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden />
        <div>
          <p className="font-semibold text-zinc-950">Проверка заказа</p>
          <p className="mt-1 text-xs leading-5">Менеджер подтвердит наличие, цену и срок.</p>
        </div>
      </div>
      <a href={phoneHref(storefront.phones[0])} className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-700 hover:border-teal-200 hover:text-teal-800">
        <Phone className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden />
        <div>
          <p className="font-semibold text-zinc-950">Связь с магазином</p>
          <p className="mt-1 text-xs leading-5">{storefront.phones[0]}</p>
        </div>
      </a>
    </div>
  );
}

function QuickCategoryRail({
  categories,
  currentCategorySlug,
}: {
  categories: CategoryTreeItem[];
  currentCategorySlug?: string;
}) {
  const visibleCategories = categories.slice(0, 10);
  if (!visibleCategories.length) return null;

  return (
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
      <Link
        href="/catalog"
        aria-current={!currentCategorySlug ? "page" : undefined}
        className={[
          "shrink-0 rounded-full border px-3 py-2 text-sm font-semibold",
          !currentCategorySlug ? "border-teal-200 bg-teal-50 text-teal-900" : "border-zinc-200 bg-white text-zinc-700 hover:border-teal-200",
        ].join(" ")}
      >
        Все товары
      </Link>
      {visibleCategories.map((category) => (
        <Link
          key={category.id}
          href={`/catalog/${category.slug}`}
          aria-current={category.slug === currentCategorySlug ? "page" : undefined}
          className={[
            "shrink-0 rounded-full border px-3 py-2 text-sm font-semibold",
            category.slug === currentCategorySlug
              ? "border-teal-200 bg-teal-50 text-teal-900"
              : "border-zinc-200 bg-white text-zinc-700 hover:border-teal-200",
          ].join(" ")}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}

function CatalogControls({
  basePath,
  state,
}: {
  basePath: string;
  state: CatalogUrlState & { sort: CatalogSort };
}) {
  return (
    <div className="mb-5 grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        <Link
          href={catalogHref(basePath, { ...state, onlyAvailable: true, page: 1 })}
          className={[
            "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-semibold",
            state.onlyAvailable ? "border-teal-200 bg-teal-50 text-teal-900" : "border-zinc-200 text-zinc-700 hover:border-teal-200",
          ].join(" ")}
        >
          <ShieldCheck className="size-4" aria-hidden />
          К заказу
        </Link>
        <Link
          href={catalogHref(basePath, { ...state, withPhoto: true, page: 1 })}
          className={[
            "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-semibold",
            state.withPhoto ? "border-teal-200 bg-teal-50 text-teal-900" : "border-zinc-200 text-zinc-700 hover:border-teal-200",
          ].join(" ")}
        >
          <ImageIcon className="size-4" aria-hidden />
          С фото
        </Link>
        <Link
          href={catalogHref(basePath, { ...state, maxPrice: 10000, page: 1 })}
          className={[
            "inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-sm font-semibold",
            state.maxPrice === 10000 ? "border-teal-200 bg-teal-50 text-teal-900" : "border-zinc-200 text-zinc-700 hover:border-teal-200",
          ].join(" ")}
        >
          До 10 000 ₽
        </Link>
      </div>

      <form action={basePath} className="flex w-full min-w-0 items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 sm:w-auto sm:min-w-[260px]">
        <ArrowUpDown className="size-4 shrink-0 text-zinc-500" aria-hidden />
        {state.query ? <input type="hidden" name="q" value={state.query} /> : null}
        {state.brands?.map((brand) => <input key={brand} type="hidden" name="brand" value={brand} />)}
        {state.onlyAvailable ? <input type="hidden" name="available" value="1" /> : null}
        {state.withPhoto ? <input type="hidden" name="photo" value="1" /> : null}
        {state.minPrice ? <input type="hidden" name="minPrice" value={state.minPrice} /> : null}
        {state.maxPrice ? <input type="hidden" name="maxPrice" value={state.maxPrice} /> : null}
        {state.specFilters?.map((filter) => <input key={filter} type="hidden" name="spec" value={filter} />)}
        {state.attributeFilters?.map((filter) => <input key={catalogAttributeFilterParam(filter)} type="hidden" name="attr" value={catalogAttributeFilterParam(filter)} />)}
        {state.attributeRangeFilters?.map((filter) => (
          <span key={filter.key} className="hidden">
            {filter.min !== undefined ? <input type="hidden" name="attrMin" value={`${filter.key}:${filter.min}`} /> : null}
            {filter.max !== undefined ? <input type="hidden" name="attrMax" value={`${filter.key}:${filter.max}`} /> : null}
          </span>
        ))}
        <label className="sr-only" htmlFor="catalog-sort">
          Сортировка
        </label>
        <select id="catalog-sort" name="sort" defaultValue={state.sort} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-zinc-800">
          {Object.entries(catalogSortLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="shrink-0 rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-800">Ок</button>
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
  const attributeFilterLabels = new Map(attributeFilterGroups.flatMap((group) => group.options.map((option) => [option.value, `${group.label}: ${option.label}`])));
  const attributeRangeLabels = new Map(attributeRangeGroups.map((group) => [group.key, group]));
  const chips = [
    state.query
      ? {
          label: `Поиск: ${state.query}`,
          href: catalogHref(basePath, { ...state, query: undefined, page: 1 }),
        }
      : null,
    ...(state.brands ?? []).map((brand) => ({
      label: `Бренд: ${brand}`,
      href: catalogHref(basePath, {
        ...state,
        brands: state.brands?.filter((current) => current !== brand),
        page: 1,
      }),
    })),
    state.onlyAvailable
      ? {
          label: "Доступно к заказу",
          href: catalogHref(basePath, { ...state, onlyAvailable: false, page: 1 }),
        }
      : null,
    state.withPhoto
      ? {
          label: "С фото",
          href: catalogHref(basePath, { ...state, withPhoto: false, page: 1 }),
        }
      : null,
    state.minPrice
      ? {
          label: `От ${state.minPrice.toLocaleString("ru-RU")} ₽`,
          href: catalogHref(basePath, { ...state, minPrice: undefined, page: 1 }),
        }
      : null,
    state.maxPrice
      ? {
          label: `До ${state.maxPrice.toLocaleString("ru-RU")} ₽`,
          href: catalogHref(basePath, { ...state, maxPrice: undefined, page: 1 }),
        }
      : null,
    ...(state.specFilters ?? []).map((filter) => ({
      label: specFilterLabels.get(filter) ?? getCatalogSpecFilterLabel(filter),
      href: catalogHref(basePath, {
        ...state,
        specFilters: state.specFilters?.filter((current) => current !== filter),
        page: 1,
      }),
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
      ? {
          label: catalogSortLabels[state.sort],
          href: catalogHref(basePath, { ...state, sort: "popular", page: 1 }),
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  if (!chips.length) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-zinc-100 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-200"
        >
          {chip.label}
          <X className="size-3.5" aria-hidden />
        </Link>
      ))}
      <Link href={basePath} className="inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold text-teal-800 hover:bg-teal-50">
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
  products: Array<Product & { images?: ProductImage[] }>;
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
  const activeFilterCount = countActiveCatalogFilters({
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
  });
  const pageHref = (nextPage: number) => {
    return catalogHref(basePath, { ...state, page: nextPage });
  };
  const breadcrumbs = buildCatalogBreadcrumbItems(categoryPath);

  return (
    <div className="mx-auto grid max-w-[1560px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)] lg:px-8">
      <section className="min-w-0 lg:order-2">
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500" aria-label="Хлебные крошки">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.href ?? item.label}-${index}`} className="inline-flex min-w-0 items-center gap-2">
              {index > 0 ? <span className="text-zinc-300">/</span> : null}
              {item.href && index < breadcrumbs.length - 1 ? (
                <Link href={item.href} className="truncate font-semibold text-zinc-700 hover:text-teal-800">
                  {item.label}
                </Link>
              ) : (
                <span className="truncate font-semibold text-zinc-950">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Каталог</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-zinc-950">{title}</h1>
            <p className="mt-2 text-sm text-zinc-500">Найдено товаров: {total}</p>
          </div>
        </div>

        <CatalogTrustStrip />
        <QuickCategoryRail categories={categories} currentCategorySlug={currentCategorySlug} />
        <CatalogControls basePath={basePath} state={state} />
        <ActiveFilterChips
          basePath={basePath}
          state={state}
          specFilterOptions={specFilterOptions}
          attributeFilterGroups={attributeFilterGroups}
          attributeRangeGroups={attributeRangeGroups}
        />

        <div className="sticky top-16 z-30 mb-6 grid gap-2 bg-stone-50/95 py-2 backdrop-blur lg:hidden">
          <details className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold uppercase tracking-wide text-zinc-700 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="size-4" aria-hidden />
                Фильтры
                {activeFilterCount ? (
                  <span className="inline-flex min-w-6 justify-center rounded-full bg-teal-700 px-2 py-0.5 text-xs font-bold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </span>
              <ChevronDown className="size-4 shrink-0 text-zinc-400" aria-hidden />
            </summary>
            <div className="grid gap-5 border-t border-zinc-100 p-4">
              <SearchPanel basePath={basePath} currentQuery={currentQuery} framed={false} />
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
                framed={false}
              />
            </div>
          </details>
          <details className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold uppercase tracking-wide text-zinc-700 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                Категории
                {currentCategorySlug ? <span className="size-2 rounded-full bg-teal-600" aria-hidden /> : null}
              </span>
              <ChevronDown className="size-4 shrink-0 text-zinc-400" aria-hidden />
            </summary>
            <div className="border-t border-zinc-100 p-4">
              <CategoriesPanel categories={categories} currentCategorySlug={currentCategorySlug} framed={false} />
            </div>
          </details>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</div>
        ) : null}

        <CatalogGrid products={products} />

        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
                Назад
              </Link>
            ) : null}
            <span className="text-sm text-zinc-500">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
                Дальше
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>

      <aside className="hidden lg:order-1 lg:block">
        <div className="sticky top-24 space-y-6">
        <SearchPanel basePath={basePath} currentQuery={currentQuery} />
        <CategoriesPanel categories={categories} currentCategorySlug={currentCategorySlug} />
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
        </div>
      </aside>
    </div>
  );
}
