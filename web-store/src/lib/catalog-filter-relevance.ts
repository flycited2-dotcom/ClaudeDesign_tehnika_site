/**
 * ПОТОК 2 — логика релевантности и дедупликации фильтров каталога.
 *
 * Чистые функции (без Prisma, без I/O), которые при сборке панели фильтров для
 * категории:
 *  - B1: устраняют дубль одного и того же критерия между «быстрыми подборками»
 *    (spec-пресеты `catalog-spec-filters.ts`) и структурными фасетами
 *    (`attr`-фасеты `catalog-attribute-filters.ts` + registry).
 *  - B3: отсевают значения фасета с числом товаров ниже порога и явный мусор
 *    (чёрный список).
 *
 * Вызовы подключает ПОТОК 4 в `catalog.ts`/`catalog-view`. Здесь — только логика
 * и типы; никакого UI.
 */

import type { CatalogSpecFilterValue } from "@/lib/catalog-spec-filters";

/**
 * Карта «дубликатов»: какой spec-пресет описывает ту же сущность, что и
 * структурный attr-ключ. `ownership: "spec"` — критерий булев/популярный, его
 * место в «быстрых подборках», поэтому структурный attr-фасет того же ключа
 * скрываем. `ownership: "attr"` — критерий перечисляемый/числовой, его место —
 * в структурных фасетах, поэтому spec-пресет считается лишь шорткатом и может
 * быть скрыт/помечен UI (структурный фасет остаётся).
 *
 * Правило из ТЗ §4.2 (Вариант A): булевы/популярные → spec; перечисляемые/
 * числовые → attr.
 */
export type CatalogFilterDuplicate = {
  specKey: CatalogSpecFilterValue;
  attrKey: string;
  ownership: "spec" | "attr";
};

export const catalogFilterDuplicates: readonly CatalogFilterDuplicate[] = [
  // Булевы — владеет spec-пресет, структурный фасет того же ключа прячем.
  { specKey: "fridge_no_frost", attrKey: "fridge_no_frost", ownership: "spec" },
  { specKey: "tv_smart", attrKey: "smart_tv", ownership: "spec" },
  { specKey: "washer_inverter", attrKey: "inverter_motor", ownership: "spec" },
  { specKey: "ac_inverter", attrKey: "inverter_motor", ownership: "spec" },
  // Перечисляемые/числовые — владеет структурный фасет; пресеты — шорткаты.
  { specKey: "tv_4k", attrKey: "resolution", ownership: "attr" },
  { specKey: "tv_full_hd", attrKey: "resolution", ownership: "attr" },
  { specKey: "tv_55_plus", attrKey: "screen_diagonal", ownership: "attr" },
  { specKey: "tv_65_plus", attrKey: "screen_diagonal", ownership: "attr" },
  { specKey: "storage_ssd", attrKey: "storage_type", ownership: "attr" },
  { specKey: "storage_512_plus", attrKey: "storage_capacity", ownership: "attr" },
  { specKey: "computer_ram", attrKey: "ram", ownership: "attr" },
  { specKey: "ram_16_plus", attrKey: "ram", ownership: "attr" },
  { specKey: "washer_narrow", attrKey: "width_cm", ownership: "attr" },
  { specKey: "daily_capacity", attrKey: "daily_capacity", ownership: "attr" },
  { specKey: "daily_capacity_20_plus", attrKey: "daily_capacity", ownership: "attr" },
  { specKey: "daily_capacity_50_plus", attrKey: "daily_capacity", ownership: "attr" },
  { specKey: "tank_volume", attrKey: "tank_volume", ownership: "attr" },
  { specKey: "tank_volume_3_plus", attrKey: "tank_volume", ownership: "attr" },
];

const specOwnedAttrKeys = new Set(
  catalogFilterDuplicates.filter((duplicate) => duplicate.ownership === "spec").map((duplicate) => duplicate.attrKey),
);

const attrOwnedSpecKeys = new Set<string>(
  catalogFilterDuplicates.filter((duplicate) => duplicate.ownership === "attr").map((duplicate) => duplicate.specKey),
);

/**
 * B1 — список структурных attr-ключей, которые надо СКРЫТЬ из фасетов, потому что
 * этот булев/популярный критерий уже представлен «быстрой подборкой» (spec).
 * Сейчас не зависит от того, какие именно пресеты видимы: булев дубль всегда
 * живёт в подборках. Возвращает Set для удобного `has()`.
 */
export function getSpecOwnedAttributeKeys(): Set<string> {
  return new Set(specOwnedAttrKeys);
}

/**
 * B1 — отфильтровать список разрешённых attr-ключей категории, убрав те, что
 * дублируют булев spec-пресет. Чистая функция, сохраняет порядок входа.
 * ПОТОК 4: применить к результату `getCatalogAttributeKeysForCategory(...)`
 * перед передачей в `getCachedAttributeFilterGroups` / `getCachedAttributeRangeGroups`.
 */
export function removeSpecDuplicatedAttributeKeys(allowedKeys: string[]): string[] {
  return allowedKeys.filter((key) => !specOwnedAttrKeys.has(key));
}

/**
 * B1 — является ли spec-пресет «шорткатом» структурного фасета (перечисляемый/
 * числовой дубль). UI может пометить такой пресет или скрыть его, если рядом
 * показан структурный фасет. Структурный фасет при этом остаётся.
 */
export function isSpecShortcutDuplicate(specKey: string): boolean {
  return attrOwnedSpecKeys.has(specKey);
}

/** Значение фасета (минимум полей, нужных для отсева). */
export type FacetValueForPruning = {
  /** Параметр выбора, напр. `"width_cm:45"` — для сравнения с активными. */
  value: string;
  /** Нормализованное значение, напр. `"45"` — для чёрного списка. */
  normalizedValue?: string;
  count: number;
};

export type PruneFacetValuesOptions = {
  /** Минимальное число товаров на значение, ниже — отсев. По умолчанию 3. */
  minCount?: number;
  /** Активные параметры выбора (`value`), которые нельзя убирать. */
  activeValues?: Iterable<string>;
  /**
   * Чёрный список нормализованных значений (мусор из парсинга названий).
   * Сравнение по `normalizedValue` без учёта регистра/пробелов по краям.
   */
  blacklist?: Iterable<string>;
};

/**
 * Глобальный чёрный список заведомо мусорных нормализованных значений фасетов
 * (db-data-trap: выбросы парсинга названий). Расширяется по мере находок.
 */
export const catalogFacetValueBlacklist: readonly string[] = [
  "",
  "-",
  "—",
  "нет данных",
  "не указано",
  "n/a",
  "na",
  "null",
  "undefined",
  "0",
];

function normalizeForBlacklist(value: string | null | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase("ru-RU");
}

/**
 * B3 — отсев значений фасета: убирает значения с `count` ниже порога и значения
 * из чёрного списка, КРОМЕ уже выбранных (активных). Чистая функция, сохраняет
 * порядок входа.
 *
 * ПОТОК 4: применить к `options` каждой группы из `buildCatalogAttributeFilterGroups`
 * (или к facet-rows до сборки групп). Порог по умолчанию < 3.
 */
export function pruneFacetValues<T extends FacetValueForPruning>(
  values: readonly T[],
  options: PruneFacetValuesOptions = {},
): T[] {
  const minCount = options.minCount ?? 3;
  const active = new Set(options.activeValues ?? []);
  const blacklist = new Set(
    [...(options.blacklist ?? catalogFacetValueBlacklist)].map((entry) => normalizeForBlacklist(entry)),
  );

  return values.filter((value) => {
    if (active.has(value.value)) return true;
    // Чёрный список применяем только если у значения есть normalizedValue —
    // отсутствие поля (undefined) не равно «пустому мусорному значению».
    if (value.normalizedValue !== undefined && blacklist.has(normalizeForBlacklist(value.normalizedValue))) {
      return false;
    }
    return value.count >= minCount;
  });
}
