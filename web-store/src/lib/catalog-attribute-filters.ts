import type { Prisma } from "@prisma/client";
import {
  catalogAttributeFacetKeys,
  catalogRangeAttributeKeys,
  getCatalogAttributeMarketingRank,
  type CatalogAttributeFamily,
} from "@/lib/catalog-attribute-registry";

export type CatalogAttributeFilter = {
  key: string;
  normalizedValue: string;
};

export type CatalogAttributeRangeFilter = {
  key: string;
  min?: number;
  max?: number;
};

export type CatalogAttributeFilterGroup = {
  key: string;
  label: string;
  options: Array<{
    value: string;
    label: string;
    count: number;
  }>;
};

export type CatalogAttributeRangeGroup = {
  key: string;
  label: string;
  min: number;
  max: number;
  unit: string | null;
  count: number;
};

export type CatalogAttributeFacetRow = {
  key: string;
  label: string;
  value: string;
  normalizedValue: string;
  numericValue: number | null;
  unit: string | null;
  count: number;
};

export { catalogAttributeFacetKeys } from "@/lib/catalog-attribute-registry";

const keyRank = new Map(catalogAttributeFacetKeys.map((key, index) => [key, index]));

function isAllowedAttributeKey(key: string, allowedKeys?: string[]): boolean {
  return !allowedKeys || allowedKeys.includes(key);
}

/**
 * Сравнение ключей атрибутов для порядка секций фасетов. Если задано семейство
 * категории — маркетинговый порядок (B4) с keyRank-добивкой; иначе — старый
 * порядок по keyRank (обратная совместимость).
 */
function compareAttributeKeysForFamily(left: string, right: string, family?: CatalogAttributeFamily | null): number {
  if (family) {
    const leftRank = getCatalogAttributeMarketingRank(left, family);
    const rightRank = getCatalogAttributeMarketingRank(right, family);
    if (leftRank !== rightRank) return leftRank - rightRank;
  }
  return (keyRank.get(left) ?? 999) - (keyRank.get(right) ?? 999);
}

export function catalogAttributeFilterParam(filter: CatalogAttributeFilter): string {
  return `${filter.key}:${filter.normalizedValue}`;
}

export function normalizeCatalogAttributeFilters(values: Array<string | null | undefined>): CatalogAttributeFilter[] {
  const filters: CatalogAttributeFilter[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const raw = value?.trim();
    if (!raw || !raw.includes(":")) continue;

    const [key, ...rest] = raw.split(":");
    const normalizedValue = rest.join(":").trim();
    const normalizedKey = key.trim();
    if (!normalizedKey || !normalizedValue || !keyRank.has(normalizedKey)) continue;

    const id = `${normalizedKey}:${normalizedValue}`;
    if (seen.has(id)) continue;
    filters.push({ key: normalizedKey, normalizedValue });
    seen.add(id);
  }

  return filters.slice(0, 24);
}

export function buildCatalogAttributeFilterWhere(filters: CatalogAttributeFilter[]): Prisma.ProductWhereInput {
  if (!filters.length) return {};

  return {
    AND: filters.map((filter) => ({
      attributes: {
        some: {
          key: filter.key,
          normalizedValue: filter.normalizedValue,
        },
      },
    })),
  };
}

function parseRangeParam(value: string | null | undefined): { key: string; value: number } | null {
  const raw = value?.trim();
  if (!raw || !raw.includes(":")) return null;

  const [key, ...rest] = raw.split(":");
  const normalizedKey = key.trim();
  const numberValue = Number(rest.join(":").trim().replace(",", "."));
  if (!catalogRangeAttributeKeys.includes(normalizedKey) || !Number.isFinite(numberValue) || numberValue < 0) {
    return null;
  }

  return { key: normalizedKey, value: numberValue };
}

export function normalizeCatalogAttributeRangeFilters({
  minValues,
  maxValues,
}: {
  minValues: Array<string | null | undefined>;
  maxValues: Array<string | null | undefined>;
}): CatalogAttributeRangeFilter[] {
  const byKey = new Map<string, CatalogAttributeRangeFilter>();

  for (const value of minValues) {
    const parsed = parseRangeParam(value);
    if (parsed) byKey.set(parsed.key, { ...byKey.get(parsed.key), key: parsed.key, min: parsed.value });
  }

  for (const value of maxValues) {
    const parsed = parseRangeParam(value);
    if (parsed) byKey.set(parsed.key, { ...byKey.get(parsed.key), key: parsed.key, max: parsed.value });
  }

  return Array.from(byKey.values())
    .filter((filter) => filter.min !== undefined || filter.max !== undefined)
    .slice(0, 16);
}

export function buildCatalogAttributeRangeFilterWhere(filters: CatalogAttributeRangeFilter[]): Prisma.ProductWhereInput {
  if (!filters.length) return {};

  return {
    AND: filters.map((filter) => ({
      attributes: {
        some: {
          key: filter.key,
          numericValue: {
            ...(filter.min !== undefined ? { gte: filter.min } : {}),
            ...(filter.max !== undefined ? { lte: filter.max } : {}),
          },
        },
      },
    })),
  };
}

export function buildCatalogAttributeRangeGroups(
  rows: CatalogAttributeRangeGroup[],
  allowedKeys?: string[],
  family?: CatalogAttributeFamily | null,
): CatalogAttributeRangeGroup[] {
  return rows
    .filter((row) => keyRank.has(row.key) && isAllowedAttributeKey(row.key, allowedKeys) && row.count > 0 && Number.isFinite(row.min) && Number.isFinite(row.max) && row.min < row.max)
    .sort((left, right) => compareAttributeKeysForFamily(left.key, right.key, family));
}

function toProductWhereArray(value: Prisma.ProductWhereInput["AND"]): Prisma.ProductWhereInput[] {
  if (!value) return [];

  return Array.isArray(value) ? value : [value];
}

export function buildCatalogAttributeFacetProductWhere(
  baseWhere: Prisma.ProductWhereInput,
  activeFilters: CatalogAttributeFilter[],
  facetKey: string,
): Prisma.ProductWhereInput {
  const otherAttributeWhere = buildCatalogAttributeFilterWhere(activeFilters.filter((filter) => filter.key !== facetKey));
  const otherAttributeAnd = toProductWhereArray(otherAttributeWhere.AND);
  if (!otherAttributeAnd.length) return { ...baseWhere };

  return {
    ...baseWhere,
    AND: [...toProductWhereArray(baseWhere.AND), ...otherAttributeAnd],
  };
}

export function buildCatalogAttributeFilterGroups(
  rows: CatalogAttributeFacetRow[],
  activeFilters: CatalogAttributeFilter[] = [],
  allowedKeys?: string[],
  family?: CatalogAttributeFamily | null,
): CatalogAttributeFilterGroup[] {
  const active = new Set(activeFilters.map(catalogAttributeFilterParam));
  const groups = new Map<string, CatalogAttributeFilterGroup>();

  for (const row of rows) {
    if (!keyRank.has(row.key) || !isAllowedAttributeKey(row.key, allowedKeys)) continue;
    const optionValue = catalogAttributeFilterParam({ key: row.key, normalizedValue: row.normalizedValue });
    if (row.count <= 0 && !active.has(optionValue)) continue;

    const group = groups.get(row.key) ?? { key: row.key, label: row.label, options: [] };
    if (!group.options.some((option) => option.value === optionValue)) {
      group.options.push({
        value: optionValue,
        label: row.value,
        count: row.count,
      });
    }
    groups.set(row.key, group);
  }

  return Array.from(groups.values())
    .sort((left, right) => compareAttributeKeysForFamily(left.key, right.key, family))
    .map((group) => ({
      ...group,
      options: group.options
        .sort((left, right) => {
          const leftRow = rows.find((row) => catalogAttributeFilterParam(row) === left.value);
          const rightRow = rows.find((row) => catalogAttributeFilterParam(row) === right.value);
          if (leftRow?.numericValue !== null && leftRow?.numericValue !== undefined && rightRow?.numericValue !== null && rightRow?.numericValue !== undefined) {
            return leftRow.numericValue - rightRow.numericValue;
          }
          return left.label.localeCompare(right.label, "ru-RU");
        })
        .slice(0, 16),
    }))
    .filter((group) => group.options.length > 0);
}
