import { catalogAttributeDefinitions } from "@/lib/catalog-attribute-registry";
import type { ExtractedProductAttribute } from "@/lib/product-attributes";

function normalizeToken(value: string): string {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

function compactNumber(value: string): string {
  return value.replace(",", ".").replace(/\.0+$/, "");
}

function numberValue(value: string): number | null {
  const parsed = Number(compactNumber(value));
  return Number.isFinite(parsed) ? parsed : null;
}

const definitionByInput = new Map(
  catalogAttributeDefinitions.flatMap((definition) => [
    [normalizeToken(definition.key), definition],
    [normalizeToken(definition.label), definition],
  ]),
);

const normalizedAliases = new Map([
  ["да", "yes"],
  ["yes", "yes"],
  ["true", "yes"],
  ["нет", "no"],
  ["no", "no"],
  ["false", "no"],
  ["белый", "white"],
  ["черный", "black"],
  ["чёрный", "black"],
  ["серый", "gray"],
  ["красный", "red"],
  ["синий", "blue"],
  ["зеленый", "green"],
  ["зелёный", "green"],
  ["бежевый", "beige"],
  ["тепловой_насос", "heat_pump"],
  ["конденсационная", "condensation"],
  ["вентиляционная", "vented"],
  ["снизу", "bottom"],
  ["сверху", "top"],
  ["аккумуляторный", "battery"],
  ["бензиновый", "petrol"],
  ["электрический", "electric"],
]);

function splitManualLine(line: string): { keyOrLabel: string; value: string } | null {
  const separatorIndex = line.search(/[:|]/);
  if (separatorIndex < 1) return null;

  const keyOrLabel = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();
  if (!keyOrLabel || !value) return null;

  return { keyOrLabel, value };
}

function normalizedValueFor(value: string, numericValue: number | null): string {
  if (numericValue !== null) return compactNumber(String(numericValue));

  const normalized = normalizeToken(value);
  return normalizedAliases.get(normalized) ?? normalized;
}

export function parseManualProductAttributeLines(text: string | null | undefined): ExtractedProductAttribute[] {
  const rows: ExtractedProductAttribute[] = [];
  const seenKeys = new Set<string>();

  for (const line of (text ?? "").split(/\r?\n/)) {
    const parsed = splitManualLine(line.trim());
    if (!parsed) continue;

    const definition = definitionByInput.get(normalizeToken(parsed.keyOrLabel));
    if (!definition || seenKeys.has(definition.key)) continue;

    const numericMatch = parsed.value.match(/(\d+(?:[.,]\d+)?)/);
    const numericValue = definition.valueType === "number" && numericMatch ? numberValue(numericMatch[1]) : null;
    rows.push({
      key: definition.key,
      label: definition.label,
      value: parsed.value,
      normalizedValue: normalizedValueFor(parsed.value, numericValue),
      numericValue,
      unit: "unit" in definition ? definition.unit ?? null : null,
      source: "manual",
    });
    seenKeys.add(definition.key);
  }

  return rows.slice(0, 30);
}
