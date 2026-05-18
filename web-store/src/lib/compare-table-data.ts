import type { Product, ProductAttribute, ProductImage } from "@prisma/client";

import { decimalToNumber } from "@/lib/catalog";
import { formatRub } from "@/lib/format";

export type CompareProduct = Product & {
  attributes?: ProductAttribute[];
  images?: ProductImage[];
};

export type CompareRow = {
  label: string;
  /** Display strings, one per product, in input order. "—" for missing. */
  values: string[];
  /** True if not all non-empty values are identical (or if some are missing). */
  hasDiff: boolean;
};

const EMPTY = "—";

function isEmpty(value: string): boolean {
  return !value || value === EMPTY;
}

/**
 * A row has a "difference" when products disagree:
 *   - any product lacks a value the others have, OR
 *   - non-empty values differ.
 * If only one product is being compared, nothing is a difference.
 */
function rowHasDiff(values: string[]): boolean {
  if (values.length < 2) return false;
  const nonEmpty = values.filter((v) => !isEmpty(v));
  if (nonEmpty.length === 0) return false; // all missing — not a diff
  if (nonEmpty.length !== values.length) return true; // some have, some don't
  return new Set(nonEmpty).size > 1;
}

/**
 * Merge product attributes into a key → joined-value map.
 * Multiple values under the same key (registry source variants) are joined
 * with ", " in sorted order for stable comparison.
 */
function attributeMap(product: CompareProduct): Map<string, string> {
  const map = new Map<string, string[]>();
  for (const attr of product.attributes ?? []) {
    const list = map.get(attr.key) ?? [];
    list.push(attr.value);
    map.set(attr.key, list);
  }
  const out = new Map<string, string>();
  for (const [key, values] of map) {
    const cleaned = [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort();
    if (cleaned.length) out.set(key, cleaned.join(", "));
  }
  return out;
}

function baseRow(label: string, values: string[]): CompareRow {
  return { label, values, hasDiff: rowHasDiff(values) };
}

function formatPrice(product: CompareProduct): string {
  const price = decimalToNumber(product.retailPrice);
  return price > 0 ? formatRub(price) : EMPTY;
}

function formatNumber(value: unknown, unit: string): string {
  if (value === null || value === undefined) return EMPTY;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return EMPTY;
  return `${num} ${unit}`;
}

function formatString(value: unknown): string {
  if (value === null || value === undefined) return EMPTY;
  const str = String(value).trim();
  return str.length ? str : EMPTY;
}

function formatBool(value: boolean): string {
  return value ? "Да" : "Нет";
}

/**
 * Build the comparison table. Returns one row per attribute or base field,
 * in stable display order: base fields first, then merged attribute keys
 * sorted alphabetically (Cyrillic-friendly).
 *
 * Each row's `values` array matches the order of `products`.
 */
export function buildCompareRows(products: CompareProduct[]): CompareRow[] {
  if (products.length === 0) return [];

  const rows: CompareRow[] = [
    baseRow(
      "Бренд",
      products.map((p) => formatString(p.vendor)),
    ),
    baseRow(
      "Цена",
      products.map(formatPrice),
    ),
    baseRow(
      "В наличии",
      products.map((p) => formatBool(p.isAvailable)),
    ),
    baseRow(
      "Артикул",
      products.map((p) => formatString(p.part ?? String(p.sku))),
    ),
    baseRow(
      "Гарантия",
      products.map((p) => formatNumber(p.warranty, "мес")),
    ),
    baseRow(
      "Вес",
      products.map((p) => formatNumber(p.weight, "кг")),
    ),
    baseRow(
      "Объём",
      products.map((p) => formatNumber(p.volume, "м³")),
    ),
  ];

  // Union of attribute keys across all products.
  const attrMaps = products.map(attributeMap);
  const allKeys = new Set<string>();
  for (const m of attrMaps) for (const k of m.keys()) allKeys.add(k);

  const sortedKeys = [...allKeys].sort((a, b) => a.localeCompare(b, "ru"));
  for (const key of sortedKeys) {
    rows.push(baseRow(key, attrMaps.map((m) => m.get(key) ?? EMPTY)));
  }

  return rows;
}
