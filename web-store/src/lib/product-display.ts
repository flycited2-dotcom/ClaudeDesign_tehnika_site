import { publicFulfillmentText } from "@/lib/fulfillment";
import { extractProductNameSpecs } from "@/lib/product-name-specs";

export type ProductFact = {
  label: string;
  value: string;
};

export type ProductAttributeFactInput = {
  key: string;
  label: string;
  value: string;
};

export type ProductFactInput = {
  sku: number;
  title?: string | null;
  categoryName?: string | null;
  vendor?: string | null;
  part?: string | null;
  barcodes?: string | null;
  warranty?: string | null;
  weight?: number | null;
  volume?: number | null;
  deliveryDays?: number | null;
  multiplicity?: number | null;
  attributes?: ProductAttributeFactInput[];
};

export type ProductDescriptionInput = {
  supplierName: string;
  name?: string | null;
  categoryName?: string | null;
  vendor?: string | null;
  warranty?: string | null;
  deliveryDays?: number | null;
  multiplicity?: number | null;
};

export type ProductCardHighlightInput = Pick<ProductFactInput, "title" | "part" | "warranty" | "weight" | "volume" | "multiplicity" | "attributes">;

export function warrantyLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const numeric = Number(trimmed.replace(",", "."));
  if (Number.isFinite(numeric)) {
    return numeric > 0 ? `${trimmed} мес.` : null;
  }

  return trimmed;
}

function trimNumber(value: number, fractionDigits: number): string {
  return value.toFixed(fractionDigits).replace(/\.?0+$/, "");
}

function publicDeliveryShortLabel(): string {
  return publicFulfillmentText({ isAvailable: true }).deliveryShortLabel.toLowerCase();
}

function volumeLabel(value: number | null | undefined): string | null {
  if (!value || value <= 0) return null;
  return `${trimNumber(value, value < 0.001 ? 6 : 3)} м³`;
}

function barcodesLabel(value: string | null | undefined): string | null {
  const barcodes = value
    ?.split(/[,\s;]+/)
    .map((barcode) => barcode.trim())
    .filter(Boolean);

  return barcodes?.length ? barcodes.join(", ") : null;
}

function pushFact(facts: ProductFact[], label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return;
  facts.push({ label, value: String(value) });
}

const productAttributeFactOrder = [
  "power_source",
  "vacuum_type",
  "dust_collector",
  "suction_power_w",
  "cleaning_type",
  "filter_type",
  "power_hp",
  "battery_voltage",
  "battery_capacity",
  "load_capacity",
  "drying_type",
  "installation_type",
  "mount_type",
  "gang_count",
  "inverter_motor",
  "program_count",
  "spin_speed",
  "width_cm",
  "height_cm",
  "depth_cm",
  "energy_class",
  "fridge_no_frost",
  "total_volume_l",
  "freezer_volume_l",
  "freezer_position",
  "daily_capacity",
  "tank_volume",
  "screen_diagonal",
  "resolution",
  "smart_tv",
  "ram",
  "storage_type",
  "storage_capacity",
  "processor_family",
  "processor_model",
  "fan_size_mm",
  "noise_db",
  "rpm",
  "has_argb",
  "interface",
  "port_count",
  "poe_support",
  "managed_type",
  "camera_lens_mm",
  "camera_type",
  "night_vision",
  "paper_format",
  "paper_density",
  "paper_whiteness",
  "sheet_count",
  "tire_width",
  "tire_profile",
  "rim_diameter",
  "tire_season",
  "volume_l",
  "diameter_cm",
  "pieces_count",
  "material",
  "size",
  "color",
];

const productAttributeFactRank = new Map(productAttributeFactOrder.map((key, index) => [key, index]));

// Negative-boolean attribute values carry no useful spec info ("Нет холодильника"
// type rows just clutter the table).
const NEGATIVE_ATTRIBUTE_VALUES = new Set(["нет", "-", "—", "отсутствует", "не поддерживается", "false"]);

function buildAttributeFacts(
  attributes: ProductAttributeFactInput[] | null | undefined,
  isTvLike: boolean,
): ProductFact[] {
  const seen = new Set<string>();

  return [...(attributes ?? [])]
    .sort((left, right) => (productAttributeFactRank.get(left.key) ?? 999) - (productAttributeFactRank.get(right.key) ?? 999))
    .flatMap((attribute) => {
      // The supplier feed mis-tags many non-TV products with smart_tv=Да; only
      // surface it for products that actually look like a TV.
      if (attribute.key === "smart_tv" && !isTvLike) return [];
      const label = attribute.label.trim();
      const value = attribute.value.trim();
      if (NEGATIVE_ATTRIBUTE_VALUES.has(value.toLocaleLowerCase("ru-RU"))) return [];
      const id = `${label}:${value}`;
      if (!label || !value || seen.has(id)) return [];
      seen.add(id);

      return [{ label, value }];
    });
}

export function buildProductFacts(product: ProductFactInput): ProductFact[] {
  const facts: ProductFact[] = [];

  pushFact(facts, "SKU", product.sku);
  const isTvLike = /телевизор|\bтв\b|\btv\b|smart\s*tv/i.test(`${product.categoryName ?? ""} ${product.title ?? ""}`);
  const attributeFacts = buildAttributeFacts(product.attributes, isTvLike);
  // Always pull specs out of the (rich) product name and merge them in — the
  // supplier attribute set is sparse, so the name is often the only real source
  // of characteristics. Skip any whose label is already covered by an attribute.
  const usedLabels = new Set(attributeFacts.map((fact) => fact.label));
  const titleFacts = extractProductNameSpecs(product.title).filter((spec) => !usedLabels.has(spec.label));
  for (const spec of [...attributeFacts, ...titleFacts]) {
    pushFact(facts, spec.label, spec.value);
  }
  pushFact(facts, "Категория", product.categoryName);
  pushFact(facts, "Бренд", product.vendor);
  pushFact(facts, "Партномер", product.part);
  pushFact(facts, "Штрихкоды", barcodesLabel(product.barcodes));
  pushFact(facts, "Гарантия", warrantyLabel(product.warranty));
  pushFact(facts, "Вес", product.weight ? `${trimNumber(product.weight, 3)} кг` : null);
  pushFact(facts, "Объем упаковки", volumeLabel(product.volume));
  pushFact(facts, "Кратность заказа", product.multiplicity && product.multiplicity > 1 ? `${product.multiplicity} шт.` : null);
  pushFact(facts, "Срок поставки", publicFulfillmentText({ isAvailable: true }).deliveryShortLabel);

  return facts;
}

export function buildProductCardHighlights(product: ProductCardHighlightInput): string[] {
  const isTvLike = /телевизор|\bтв\b|\btv\b|smart\s*tv/i.test(product.title ?? "");
  const attributeHighlights = buildAttributeFacts(product.attributes, isTvLike).map((spec) => spec.value);
  const highlights = [
    ...(attributeHighlights.length ? attributeHighlights : extractProductNameSpecs(product.title).map((spec) => spec.value)),
    warrantyLabel(product.warranty) ? `Гарантия ${warrantyLabel(product.warranty)}` : null,
    product.weight ? `${trimNumber(product.weight, 3)} кг` : null,
    product.multiplicity && product.multiplicity > 1 ? `Кратно ${product.multiplicity} шт.` : null,
    volumeLabel(product.volume),
    product.part ? `Арт. ${product.part}` : null,
  ].filter(Boolean) as string[];

  return highlights.slice(0, 3);
}

export function productShortTitle(
  name: string | null | undefined,
  vendor?: string | null,
  part?: string | null,
  maxLength = 80,
): string {
  const trimmed = name?.trim();
  if (!trimmed) {
    return [vendor, part].filter((value): value is string => Boolean(value)).join(" ").trim() || "Товар";
  }
  if (trimmed.length <= maxLength) return trimmed;

  const naturalBreak = trimmed.slice(0, maxLength).search(/[.,;]\s/);
  if (naturalBreak >= 30) {
    return trimmed.slice(0, naturalBreak).trimEnd();
  }
  return trimmed.slice(0, maxLength - 1).trimEnd() + "…";
}

export function productDescriptionText(description: string | null | undefined, product?: ProductDescriptionInput): string {
  const trimmed = description?.trim();
  if (trimmed) return trimmed;

  if (!product) {
    return "Подробное описание пока не заполнено. Менеджер проверит характеристики, наличие и срок доставки перед подтверждением заказа.";
  }

  const name = product.name?.trim() || product.supplierName;
  const details = [
    product.vendor ? `Бренд: ${product.vendor}` : null,
    product.categoryName ? `Категория: ${product.categoryName}` : null,
    warrantyLabel(product.warranty) ? `Гарантия: ${warrantyLabel(product.warranty)}` : null,
  ].filter(Boolean);
  const orderNotes = [
    product.multiplicity && product.multiplicity > 1 ? `Заказ кратно ${product.multiplicity} шт.` : null,
    `Ориентировочный срок поставки: ${publicDeliveryShortLabel()}.`,
  ].filter(Boolean);

  return [
    `${name} доступен для заказа в интернет-магазине БытТехОпт.`,
    details.length ? `${details.join(". ")}.` : null,
    orderNotes.join(" "),
    "Менеджер подтвердит актуальную цену, наличие и срок доставки перед оформлением заказа.",
  ]
    .filter(Boolean)
    .join(" ");
}
