import { extractProductNameAttributes } from "@/lib/product-attributes";

export type ExtractedProductSpec = {
  label: string;
  value: string;
};

function compactNumber(value: string): string {
  return value.replace(",", ".").replace(/\.0+$/, "");
}

function normalizeStorageUnit(unit: string): string {
  const lower = unit.toLocaleLowerCase("ru-RU");
  return lower === "тб" || lower === "tb" ? "ТБ" : "ГБ";
}

function addSpec(specs: ExtractedProductSpec[], label: string, value: string) {
  if (specs.some((spec) => spec.label === label && spec.value === value)) return;
  specs.push({ label, value });
}

const cardAttributeKeys = new Set([
  "power_source",
  "power_hp",
  "battery_voltage",
  "battery_capacity",
  "load_capacity",
  "drying_type",
  "installation_type",
  "inverter_motor",
  "program_count",
  "spin_speed",
  "depth_cm",
  "electrical_product_type",
  "cable_cores",
  "cable_section",
  "cable_length",
  "processor_family",
  "processor_model",
  "interface",
]);

export function extractProductNameSpecs(name: string | null | undefined): ExtractedProductSpec[] {
  const text = name?.trim();
  if (!text) return [];

  const specs: ExtractedProductSpec[] = [];

  const dailyCapacity = text.match(/(\d+(?:[.,]\d+)?)\s*л\s*\/\s*сут/i);
  if (dailyCapacity) {
    addSpec(specs, "Производительность", `${compactNumber(dailyCapacity[1])} л/сутки`);
  }

  const looksLikeTankProduct = /осушител|увлажнител|мойк[аи]\s+воздуха|бак|резервуар/i.test(text);
  if (looksLikeTankProduct) {
    const literMatches = Array.from(text.matchAll(/(\d+(?:[.,]\d+)?)\s*л(?!\s*\/)/gi));
    const tankMatch = literMatches.find((match) => {
      const value = Number(compactNumber(match[1]));
      return Number.isFinite(value) && value > 0 && value <= 30;
    });
    if (tankMatch) {
      addSpec(specs, "Объем бака", `${compactNumber(tankMatch[1])} л`);
    }
  }

  const diagonal = text.match(/(?:^|[^\d])(\d{2,3})\s*(?:"|”|дюйм(?:ов|а)?)/i);
  if (diagonal) {
    addSpec(specs, "Диагональ", `${diagonal[1]}"`);
  }

  if (/\b4\s*k\b/i.test(text)) {
    addSpec(specs, "Разрешение", /uhd/i.test(text) ? "4K UHD" : "4K");
  } else if (/full\s*hd/i.test(text)) {
    addSpec(specs, "Разрешение", "Full HD");
  }

  const ram = text.match(/(\d+)\s*(?:гб|gb)\s*(?:ram|оператив)/i) ?? text.match(/(?:ram|оператив\D{0,20})(\d+)\s*(?:гб|gb)/i);
  if (ram) {
    addSpec(specs, "Оперативная память", `${ram[1]} ГБ`);
  }

  const storageForward = text.match(/(ssd|hdd)\s*(\d+(?:[.,]\d+)?)\s*(гб|gb|тб|tb)/i);
  const storageReverse = storageForward ? null : text.match(/(\d+(?:[.,]\d+)?)\s*(гб|gb|тб|tb)\s*(ssd|hdd)/i);
  if (storageForward) {
    addSpec(
      specs,
      "Накопитель",
      `${storageForward[1].toLocaleUpperCase("ru-RU")} ${compactNumber(storageForward[2])} ${normalizeStorageUnit(storageForward[3])}`,
    );
  } else if (storageReverse) {
    addSpec(
      specs,
      "Накопитель",
      `${storageReverse[3].toLocaleUpperCase("ru-RU")} ${compactNumber(storageReverse[1])} ${normalizeStorageUnit(storageReverse[2])}`,
    );
  }

  for (const attribute of extractProductNameAttributes(text)) {
    if (cardAttributeKeys.has(attribute.key)) {
      addSpec(specs, attribute.label, attribute.value);
    }
  }

  return specs.slice(0, 4);
}
