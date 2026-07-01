export type CatalogAttributeValueType = "enum" | "number" | "boolean" | "text";
export type CatalogAttributeControl = "checkbox" | "range" | "boolean";
export type CatalogAttributeFamily =
  | "universal"
  | "computer"
  | "tv"
  | "climate"
  | "garden"
  | "electrical"
  | "network"
  | "laundry"
  | "refrigeration"
  | "camera"
  | "paper"
  | "auto"
  | "dishes"
  | "furniture"
  | "apparel"
  | "appliance"
  | "cleaning";

export type CatalogAttributeDefinition = {
  key: string;
  label: string;
  valueType: CatalogAttributeValueType;
  control: CatalogAttributeControl;
  unit?: string;
  families?: CatalogAttributeFamily[];
};

export const catalogAttributeDefinitions = [
  { key: "storage_type", label: "Тип накопителя", valueType: "enum", control: "checkbox", families: ["computer"] },
  { key: "storage_capacity", label: "Объем накопителя", valueType: "number", control: "range", unit: "ГБ", families: ["computer"] },
  { key: "ram", label: "Оперативная память", valueType: "number", control: "range", unit: "ГБ", families: ["computer"] },
  { key: "screen_diagonal", label: "Диагональ", valueType: "number", control: "range", unit: "дюйм", families: ["tv", "computer"] },
  { key: "resolution", label: "Разрешение", valueType: "enum", control: "checkbox", families: ["tv", "computer", "camera"] },
  { key: "smart_tv", label: "Smart TV", valueType: "boolean", control: "checkbox", families: ["tv"] },
  { key: "daily_capacity", label: "Производительность", valueType: "number", control: "range", unit: "л/сутки", families: ["climate"] },
  { key: "tank_volume", label: "Объем бака", valueType: "number", control: "range", unit: "л", families: ["climate"] },
  { key: "load_capacity", label: "Загрузка", valueType: "number", control: "range", unit: "кг", families: ["laundry"] },
  { key: "drying_type", label: "Тип сушки", valueType: "enum", control: "checkbox", families: ["laundry"] },
  { key: "installation_type", label: "Установка", valueType: "enum", control: "checkbox", families: ["laundry", "refrigeration", "appliance"] },
  { key: "inverter_motor", label: "Инверторный двигатель", valueType: "boolean", control: "checkbox", families: ["laundry", "refrigeration"] },
  { key: "program_count", label: "Количество программ", valueType: "number", control: "range", unit: "программ", families: ["laundry"] },
  { key: "spin_speed", label: "Скорость отжима", valueType: "number", control: "range", unit: "об/мин", families: ["laundry"] },
  { key: "width_cm", label: "Ширина", valueType: "number", control: "range", unit: "см", families: ["laundry", "refrigeration", "appliance"] },
  { key: "height_cm", label: "Высота", valueType: "number", control: "range", unit: "см", families: ["laundry", "refrigeration", "appliance"] },
  { key: "depth_cm", label: "Глубина", valueType: "number", control: "range", unit: "см", families: ["laundry", "refrigeration", "appliance"] },
  { key: "energy_class", label: "Класс энергопотребления", valueType: "enum", control: "checkbox", families: ["laundry", "refrigeration", "appliance"] },
  { key: "fridge_no_frost", label: "No Frost", valueType: "boolean", control: "checkbox", families: ["refrigeration"] },
  { key: "total_volume_l", label: "Общий объем", valueType: "number", control: "range", unit: "л", families: ["refrigeration"] },
  { key: "freezer_volume_l", label: "Объем морозильной камеры", valueType: "number", control: "range", unit: "л", families: ["refrigeration"] },
  { key: "freezer_position", label: "Расположение морозильника", valueType: "enum", control: "checkbox", families: ["refrigeration"] },
  { key: "power_source", label: "Тип питания", valueType: "enum", control: "checkbox", families: ["garden"] },
  { key: "vacuum_type", label: "Тип пылесоса", valueType: "enum", control: "checkbox", families: ["cleaning"] },
  { key: "dust_collector", label: "Пылесборник", valueType: "enum", control: "checkbox", families: ["cleaning"] },
  { key: "suction_power_w", label: "Мощность всасывания", valueType: "number", control: "range", unit: "Вт", families: ["cleaning"] },
  { key: "cleaning_type", label: "Тип уборки", valueType: "enum", control: "checkbox", families: ["cleaning"] },
  { key: "filter_type", label: "Фильтр", valueType: "enum", control: "checkbox", families: ["cleaning"] },
  { key: "power_hp", label: "Мощность двигателя", valueType: "number", control: "range", unit: "л.с.", families: ["garden"] },
  { key: "battery_voltage", label: "Напряжение аккумулятора", valueType: "number", control: "range", unit: "В", families: ["garden", "cleaning", "appliance"] },
  { key: "battery_capacity", label: "Емкость аккумулятора", valueType: "number", control: "range", unit: "Ач", families: ["garden", "cleaning", "appliance"] },
  { key: "electrical_product_type", label: "Тип электротовара", valueType: "enum", control: "checkbox", families: ["electrical"] },
  { key: "cable_section", label: "Сечение кабеля", valueType: "number", control: "range", unit: "мм²", families: ["electrical"] },
  { key: "cable_cores", label: "Количество жил", valueType: "number", control: "range", unit: "жил", families: ["electrical"] },
  { key: "cable_length", label: "Длина", valueType: "number", control: "range", unit: "м", families: ["electrical"] },
  { key: "voltage", label: "Напряжение", valueType: "number", control: "range", unit: "В", families: ["electrical", "garden", "climate", "appliance"] },
  { key: "current_amp", label: "Ток", valueType: "number", control: "range", unit: "А", families: ["electrical"] },
  { key: "power_w", label: "Мощность", valueType: "number", control: "range", unit: "Вт", families: ["electrical", "garden", "climate", "appliance", "cleaning"] },
  { key: "ip_rating", label: "Степень защиты", valueType: "enum", control: "checkbox", families: ["electrical", "garden", "camera"] },
  { key: "mount_type", label: "Установка", valueType: "enum", control: "checkbox", families: ["electrical"] },
  { key: "gang_count", label: "Количество клавиш/постов", valueType: "number", control: "range", unit: "шт.", families: ["electrical"] },
  { key: "camera_lens_mm", label: "Фокусное расстояние", valueType: "number", control: "range", unit: "мм", families: ["camera"] },
  { key: "camera_type", label: "Тип камеры", valueType: "enum", control: "checkbox", families: ["camera"] },
  { key: "night_vision", label: "ИК-подсветка", valueType: "boolean", control: "checkbox", families: ["camera"] },
  { key: "paper_format", label: "Формат", valueType: "enum", control: "checkbox", families: ["paper"] },
  { key: "paper_density", label: "Плотность", valueType: "number", control: "range", unit: "г/м²", families: ["paper"] },
  { key: "paper_whiteness", label: "Белизна", valueType: "number", control: "range", unit: "%", families: ["paper"] },
  { key: "sheet_count", label: "Количество листов", valueType: "number", control: "range", unit: "листов", families: ["paper"] },
  { key: "tire_width", label: "Ширина шины", valueType: "number", control: "range", unit: "мм", families: ["auto"] },
  { key: "tire_profile", label: "Профиль шины", valueType: "number", control: "range", unit: "%", families: ["auto"] },
  { key: "rim_diameter", label: "Диаметр диска", valueType: "number", control: "range", unit: "R", families: ["auto"] },
  { key: "tire_season", label: "Сезон", valueType: "enum", control: "checkbox", families: ["auto"] },
  { key: "volume_l", label: "Объем", valueType: "number", control: "range", unit: "л", families: ["dishes", "climate", "refrigeration", "appliance", "cleaning"] },
  { key: "oven_type", label: "Тип духовки", valueType: "enum", control: "checkbox", families: ["appliance"] },
  { key: "oven_volume_l", label: "Объем духовки", valueType: "number", control: "range", unit: "л", families: ["appliance"] },
  { key: "cooktop_type", label: "Тип варочной панели", valueType: "enum", control: "checkbox", families: ["appliance"] },
  { key: "burner_count", label: "Количество конфорок", valueType: "number", control: "range", unit: "конф.", families: ["appliance"] },
  { key: "diameter_cm", label: "Диаметр", valueType: "number", control: "range", unit: "см", families: ["dishes"] },
  { key: "pieces_count", label: "Количество предметов", valueType: "number", control: "range", unit: "шт.", families: ["dishes"] },
  { key: "material", label: "Материал", valueType: "enum", control: "checkbox", families: ["dishes", "furniture", "apparel"] },
  { key: "size", label: "Размер", valueType: "enum", control: "checkbox", families: ["apparel"] },
  { key: "color", label: "Цвет", valueType: "enum", control: "checkbox", families: ["universal"] },
  { key: "processor_family", label: "Процессор", valueType: "enum", control: "checkbox", families: ["computer"] },
  { key: "processor_model", label: "Модель процессора", valueType: "enum", control: "checkbox", families: ["computer"] },
  { key: "gpu_family", label: "Видеокарта", valueType: "enum", control: "checkbox", families: ["computer"] },
  { key: "interface", label: "Интерфейс", valueType: "enum", control: "checkbox", families: ["computer", "camera"] },
  { key: "fan_size_mm", label: "Размер вентилятора", valueType: "number", control: "range", unit: "мм", families: ["computer"] },
  { key: "noise_db", label: "Уровень шума", valueType: "number", control: "range", unit: "дБ", families: ["computer"] },
  { key: "rpm", label: "Скорость вращения", valueType: "number", control: "range", unit: "об/мин", families: ["computer"] },
  { key: "has_argb", label: "Подсветка ARGB/RGB", valueType: "boolean", control: "checkbox", families: ["computer"] },
  { key: "port_count", label: "Количество портов", valueType: "number", control: "range", unit: "порт.", families: ["network"] },
  { key: "poe_support", label: "Поддержка PoE", valueType: "boolean", control: "checkbox", families: ["network"] },
  { key: "managed_type", label: "Тип управления", valueType: "enum", control: "checkbox", families: ["network"] },
] as const satisfies readonly CatalogAttributeDefinition[];

export const catalogAttributeFacetKeys: string[] = catalogAttributeDefinitions.map((definition) => definition.key);

export const catalogRangeAttributeKeys: string[] = catalogAttributeDefinitions
  .filter((definition) => definition.control === "range")
  .map((definition) => definition.key);

const catalogAttributeDefinitionByKey = new Map<string, CatalogAttributeDefinition>(catalogAttributeDefinitions.map((definition) => [definition.key, definition]));

export function getCatalogAttributeDefinition(key: string): CatalogAttributeDefinition | undefined {
  return catalogAttributeDefinitionByKey.get(key);
}

function normalizeCategoryScope(value: string | null | undefined): string {
  return (value ?? "").toLocaleLowerCase("ru-RU").replace(/ё/g, "е");
}

export function getCatalogAttributeFamilyForCategory({
  categoryName,
  categorySlug,
}: {
  categoryName?: string | null;
  categorySlug?: string | null;
}): CatalogAttributeFamily | null {
  const text = `${normalizeCategoryScope(categoryName)} ${normalizeCategoryScope(categorySlug)}`;
  if (!text.trim()) return null;

  if (/сушильн|стиральн|sushil|stiral|washer|washing|dryer|laundry/.test(text)) return "laundry";
  if (/холодильн|морозильн|холодильно-морозильн|винн.*шкаф|holodil|morozil|refrigerator|fridge|freezer/.test(text)) return "refrigeration";
  if (/телевиз|televiz/.test(text) || /(^|[^a-zа-я0-9])tv([^a-zа-я0-9]|$)/.test(text)) return "tv";
  if (/компьютер|ноутбук|планшет|монитор|процессор|kompyut|noutbuk|planshet|laptop|computer|notebook|monitor/.test(text)) return "computer";
  if (/пылесос|пылеудален|уборк|пароочистител|полотер|pylesos|pyleudal|ubork|paroochist|vacuum|cleaning/.test(text)) return "cleaning";
  // Built-in / kitchen appliances must match BEFORE the "посуд" (tableware) and
  // generic electrical checks: a dishwasher ("посудомоечная") contains "посуд"
  // but is an appliance, not tableware; a microwave ("микроволнов") and hob
  // ("варочная панель") would otherwise fall through.
  if (
    /посудомо|dishwasher|posudomo/.test(text) ||
    /духов|oven|duhov/.test(text) ||
    /варочн|cooktop|\bhob\b|varochn/.test(text) ||
    /вытяжк|vytyazhk|hood/.test(text) ||
    /микровол|свч|microwave|mikrovol/.test(text) ||
    /кофемашин|кофеварк|кофейн|kofemashin|kofevark|coffee/.test(text) ||
    /встраиваем|встройк|встроенн.*техник|vstraivaem|built-?in/.test(text) ||
    // Small countertop kitchen appliances — must match BEFORE garden (which owns
    // power_hp/л.с.) so аэрогрили/мультиварки don't get engine-power facets.
    /аэрогриль|электрогриль|мультиварк|пароварк|фритюрниц|су-?вид|медленноварк|йогуртниц|ростер|морожениц|тостер|блендер|миксер|кофемолк|соковыжим|мясорубк|вафельниц|сэндвичниц|aerogril|multivark|blender|mikser|toster/.test(text) ||
    /мелк.*техник|бытов.*техник|кухонн.*техник|melkaya.*tehnika|bytovaya.*tehnika|kuhonn.*tehnika|appliance/.test(text)
  )
    return "appliance";
  // Must run before "electrical" below — "Проводные роутеры" contains "провод"
  // (from "Проводные"), which would otherwise match the electrical check first.
  if (/роутер|коммутатор|маршрутизатор|switch|router/.test(text)) return "network";
  if (/кабел|провод|электр|розетк|выключател|светильник|ламп|щит|kabel|provod|elektr|rozetk|vykl|svetil|cable|wire|electric/.test(text)) return "electrical";
  if (/сад|огород|снегоубор|газон|мотоблок|триммер|культиватор|sad|ogorod|snegoub|gazon|motoblok|trimmer|kultivator|dacha|garden/.test(text)) return "garden";
  if (/кондиционер|сплит|осушител|увлажнител|очистител|климат|вентилятор|обогревател|kondits|split|osush|uvlazhn|ochist|climat|conditioner|humidifier|dehumidifier/.test(text)) return "climate";
  if (/камер|фотоаппарат|объектив|kamer|fotoapparat|obektiv|camera|video/.test(text)) return "camera";
  if (/бумаг|картон|канцеляр|bumag|karton|kantcel|paper|cardboard/.test(text)) return "paper";
  if (/шин|покрыш|автошин|колес|диск|shin|pokrysh|avtoshin|koles|tire|tyre/.test(text)) return "auto";
  if (/посуд|бокал|чашк|тарелк|кастрюл|сковород|стакан|posud|bokal|chashk|tarelk|kastryul|skovorod|stakan|dishes|glass/.test(text)) return "dishes";
  if (/мебел|стол|стул|шкаф|диван|кровать|матрас|mebel|shkaf|divan|krovat|matras|furniture/.test(text)) return "furniture";
  if (/одежд|обув|кроссов|ботин|куртк|плать|брюк|odezhd|obuv|krossov|botin|kurtk|plat|bryuk|apparel|shoe|sneaker/.test(text)) return "apparel";

  return null;
}

// Маркетинговый порядок параметров по важности для покупателя внутри семейства
// (B4). Ключи, перечисленные здесь, идут первыми в этом порядке; остальные
// релевантные ключи семейства — после них в порядке объявления в реестре.
// Используется catalog-view/панелью фильтров для сортировки секций.
const familyMarketingOrder: Partial<Record<CatalogAttributeFamily, string[]>> = {
  refrigeration: [
    "total_volume_l",
    "fridge_no_frost",
    "energy_class",
    "freezer_position",
    "freezer_volume_l",
    "installation_type",
    "inverter_motor",
    "width_cm",
    "height_cm",
    "depth_cm",
  ],
  laundry: [
    "load_capacity",
    "spin_speed",
    "width_cm",
    "depth_cm",
    "inverter_motor",
    "drying_type",
    "program_count",
    "energy_class",
    "installation_type",
    "height_cm",
  ],
  tv: ["screen_diagonal", "resolution", "smart_tv"],
  appliance: [
    "oven_type",
    "cooktop_type",
    "burner_count",
    "oven_volume_l",
    "volume_l",
    "power_w",
    "energy_class",
    "installation_type",
    "width_cm",
    "height_cm",
    "depth_cm",
  ],
  climate: ["power_w", "daily_capacity", "tank_volume", "volume_l", "voltage"],
  cleaning: ["vacuum_type", "suction_power_w", "dust_collector", "cleaning_type", "filter_type", "power_w"],
};

/**
 * Маркетинговый ранг ключа атрибута внутри семейства категории.
 * Чем меньше число — тем выше параметр в списке. Ключи без явного порядка
 * получают большой ранг (идут после приоритетных). Универсальные ключи (color)
 * не приоритизируются и уходят в хвост.
 */
export function getCatalogAttributeMarketingRank(
  key: string,
  family: CatalogAttributeFamily | null,
): number {
  if (!family) return 1000;
  const order = familyMarketingOrder[family];
  if (!order) return 1000;
  const index = order.indexOf(key);
  return index === -1 ? 1000 : index;
}

export function getCatalogAttributeKeysForCategory({
  categoryName,
  categorySlug,
}: {
  categoryName?: string | null;
  categorySlug?: string | null;
}): string[] {
  const family = getCatalogAttributeFamilyForCategory({ categoryName, categorySlug });
  if (!family) {
    // Unknown / mixed category — text search across heterogeneous results, or a
    // category not mapped to a family. Do NOT build per-attribute facets for all
    // ~58 keys: that fires 40+ range aggregates over the 372k ProductAttribute
    // table and hangs /search for ~90s. Параметрические фасеты осмысленны только
    // для однородной категории. Only universal facets (Цвет) remain here;
    // brand/price/availability are separate and always shown.
    return catalogAttributeDefinitions
      .filter((definition) => {
        const families: readonly CatalogAttributeFamily[] = definition.families ?? ["universal"];
        return families.includes("universal");
      })
      .map((definition) => definition.key);
  }

  const relevant = catalogAttributeDefinitions.filter((definition) => {
    const families: readonly CatalogAttributeFamily[] = definition.families ?? ["universal"];
    return families.includes("universal") || families.includes(family);
  });

  // Маркетинговый порядок (B4): приоритетные ключи семейства — первыми, в
  // заданном порядке; остальные — в порядке объявления в реестре.
  return relevant
    .map((definition, index) => ({ key: definition.key, index }))
    .sort((left, right) => {
      const leftRank = getCatalogAttributeMarketingRank(left.key, family);
      const rightRank = getCatalogAttributeMarketingRank(right.key, family);
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.index - right.index;
    })
    .map((item) => item.key);
}
