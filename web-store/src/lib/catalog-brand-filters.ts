export type CatalogBrandFilterOption = {
  value: string;
  count: number;
};

export type CatalogBrandCountRow = {
  vendor: string | null;
  count: number;
};

export function buildCatalogBrandFilterOptions(
  rows: CatalogBrandCountRow[],
  activeBrands: string[] = [],
): CatalogBrandFilterOption[] {
  const options = rows.flatMap((row) => {
    const value = row.vendor?.trim();
    return value ? [{ value, count: row.count }] : [];
  });
  const visible = new Set(options.map((option) => option.value));

  for (const brand of activeBrands) {
    const value = brand.trim();
    if (value && !visible.has(value)) {
      options.push({ value, count: 0 });
      visible.add(value);
    }
  }

  return options;
}
