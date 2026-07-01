export type ProductAttributeSource = "name" | "manual" | "supplier" | "backfill";

export type ExtractedProductAttribute = {
  key: string;
  label: string;
  value: string;
  normalizedValue: string;
  numericValue: number | null;
  unit: string | null;
  source: ProductAttributeSource;
};

function compactNumber(value: string): string {
  return value.replace(",", ".").replace(/\.0+$/, "");
}

function numberValue(value: string): number | null {
  const parsed = Number(compactNumber(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStorageUnit(unit: string): string {
  const lower = unit.toLocaleLowerCase("ru-RU");
  return lower === "тб" || lower === "tb" ? "ТБ" : "ГБ";
}

function normalizeToken(value: string): string {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

function cableCoreUnit(value: number): string {
  const lastDigit = value % 10;
  const lastTwoDigits = value % 100;
  if (lastDigit === 1 && lastTwoDigits !== 11) return "жила";
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) return "жилы";
  return "жил";
}

function looksLikeLaundryProduct(text: string): boolean {
  return /сушильн|стиральн|washer|washing machine|dryer/i.test(text);
}

function looksLikeEngineProduct(text: string): boolean {
  return /двигател|снегоубор|мотоблок|газонокос|генератор|культиватор|триммер|бензопил|мотопомп/i.test(text);
}

// Countertop kitchen appliances whose capacity is given in litres ("10 л") —
// аэрогрили/мультиварки/пароварки и т.п. Their "N л" is volume, NOT engine power.
function looksLikeKitchenCapacityAppliance(text: string): boolean {
  return /аэрогриль|мультиварк|пароварк|фритюрниц|су-?вид|медленноварк|йогуртниц|ростер|электрогриль|морожениц/i.test(text);
}

function looksLikeRefrigerationProduct(text: string): boolean {
  return /холодильн|морозильн|морозильник|морозильная\s+камера|refrigerator|fridge|freezer/i.test(text);
}

function looksLikeCameraProduct(text: string): boolean {
  return /видеокамер|камера|фотоаппарат|объектив|экшн-?камер|camera|lens/i.test(text);
}

function looksLikePaperProduct(text: string): boolean {
  return /бумаг|картон|ватман|paper|cardboard/i.test(text);
}

function looksLikeTireProduct(text: string): boolean {
  return /(^|[^а-яё])шин[аы]?|покрыш|автошин|tire|tyre/i.test(text);
}

function looksLikeDishProduct(text: string): boolean {
  return /посуд|бокал|чашк|кружк|тарелк|стакан|кастрюл|сковород|dishes|glass/i.test(text);
}

function looksLikeApparelProduct(text: string): boolean {
  return /одежд|обув|кроссов|ботин|сапог|куртк|плать|брюк|apparel|shoe|sneaker/i.test(text);
}

function looksLikeVacuumProduct(text: string): boolean {
  return /пылесос|пылеудален|vacuum/i.test(text);
}

function extractElectricalProductType(text: string): { value: string; normalizedValue: string } | null {
  if (/кабел|провод|шнур|\bcable\b|\bwire\b|\bcord\b/i.test(text)) {
    return { value: "Кабель", normalizedValue: "cable" };
  }
  if (/розетк|\bsocket\b|\boutlet\b/i.test(text)) {
    return { value: "Розетка", normalizedValue: "socket" };
  }
  // Must run before the bare "выключател" check below — "переключатель" does not
  // contain "выключател" as a substring, but both describe wall switches and we
  // want the more specific label when the accompanying words make it clear this
  // is a two-way/crossover switch, not a plain on/off one.
  if (/переключател[а-яё]*\s*(?:проходн|перекр[её]стн|клавиш)/i.test(text)) {
    return { value: "Переключатель", normalizedValue: "changeover_switch" };
  }
  if (/выключател|\bswitch\b/i.test(text)) {
    return { value: "Выключатель", normalizedValue: "switch" };
  }
  if (/дифавтомат|автоматическ\D{0,12}выключател|узо|\bbreaker\b/i.test(text)) {
    return { value: "Автомат", normalizedValue: "breaker" };
  }
  if (/светильник|ламп|\blamp\b/i.test(text)) {
    return { value: "Светильник", normalizedValue: "lamp" };
  }
  if (/разъ[её]м|коннектор|клемм|\bconnector\b/i.test(text)) {
    return { value: "Коннектор", normalizedValue: "connector" };
  }
  if (/терморегулятор|термостат/i.test(text)) {
    return { value: "Терморегулятор", normalizedValue: "thermostat" };
  }
  // "Рамка" alone is too generic (photo frames, mirror frames, license plate
  // frames, etc.) — only tag it when a gang/post count is present, which is how
  // electrical wall-plate frames are actually named ("Рамка 2-м", "Рамка на 3 поста").
  if (/рамк/i.test(text) && /\d+[\s-]*(?:м\b|пост)/i.test(text)) {
    return { value: "Рамка", normalizedValue: "frame" };
  }
  if (/коробк|бокс|\bbox\b|(^|[^а-яё])щит(ок)?(?=$|[^а-яё])/i.test(text)) {
    return { value: "Коробка/щит", normalizedValue: "box" };
  }

  return null;
}

function extractIpRating(text: string): { value: string; normalizedValue: string } | null {
  const match = text.match(/\bIP\s?(\d{2})\b/i);
  if (!match) return null;
  return { value: `IP${match[1]}`, normalizedValue: `ip${match[1]}` };
}

function looksLikeElectricalAccessory(text: string): boolean {
  if (/розетк|выключател|переключател/i.test(text)) return true;
  // Bare "рамка" is too generic on its own — only treat it as an electrical
  // wall-plate frame when a gang/post count is present nearby.
  return /рамк/i.test(text) && /\d+[\s-]*(?:м\b|пост)/i.test(text);
}

const electricalGangWordCounts: Record<string, number> = {
  "одно": 1,
  "двух": 2,
  "трех": 3,
  "трёх": 3,
  "четырех": 4,
  "четырёх": 4,
};

function extractElectricalAccessoryAttributes(text: string, attributes: ExtractedProductAttribute[]) {
  if (!looksLikeElectricalAccessory(text)) return;

  // Full word forms only — no 2-letter abbreviations (ОП/СП/ОУ/СУ), those are
  // too easy to collide with unrelated brand/model codes.
  if (/открыт[а-яё]*\s+установ|наружн[а-яё]*\s+установ/i.test(text)) {
    addAttribute(attributes, {
      key: "mount_type",
      label: "Установка",
      value: "Открытая",
      normalizedValue: "surface",
      numericValue: null,
      unit: null,
    });
  } else if (/скрыт[а-яё]*\s+установ|внутренн[а-яё]*\s+установ/i.test(text)) {
    addAttribute(attributes, {
      key: "mount_type",
      label: "Установка",
      value: "Скрытая",
      normalizedValue: "flush",
      numericValue: null,
      unit: null,
    });
  }

  const gangMatch =
    text.match(/(\d+)[\s-]*кл(?:авиш[а-яё]*)?/i) ??
    text.match(/(одно|двух|тр[её]х|четыр[её]х)[\s-]*кл(?:авиш[а-яё]*)?/i) ??
    text.match(/(\d+)[\s-]*пост/i);
  if (gangMatch) {
    const raw = gangMatch[1];
    const count = /^\d+$/.test(raw) ? Number(raw) : electricalGangWordCounts[raw.toLocaleLowerCase("ru-RU")];
    if (count) {
      addAttribute(attributes, {
        key: "gang_count",
        label: "Количество клавиш/постов",
        value: `${count} шт.`,
        normalizedValue: String(count),
        numericValue: count,
        unit: "шт.",
      });
    }
  }
}

function extractColor(text: string): { value: string; normalizedValue: string } | null {
  const colors: Array<{ pattern: RegExp; value: string; normalizedValue: string }> = [
    { pattern: /бел(ый|ая|ое|ые)|\bwhite\b/i, value: "Белый", normalizedValue: "white" },
    { pattern: /ч[её]рн(ый|ая|ое|ые)|\bblack\b/i, value: "Черный", normalizedValue: "black" },
    { pattern: /сер(ый|ая|ое|ые)|\bgr[ae]y\b/i, value: "Серый", normalizedValue: "gray" },
    { pattern: /красн(ый|ая|ое|ые)|\bred\b/i, value: "Красный", normalizedValue: "red" },
    { pattern: /син(ий|яя|ее|ие)|\bblue\b/i, value: "Синий", normalizedValue: "blue" },
    { pattern: /зел[её]н(ый|ая|ое|ые)|\bgreen\b/i, value: "Зеленый", normalizedValue: "green" },
    { pattern: /бежев(ый|ая|ое|ые)|\bbeige\b/i, value: "Бежевый", normalizedValue: "beige" },
  ];

  return colors.find((color) => color.pattern.test(text)) ?? null;
}

function extractPowerSource(text: string): { value: string; normalizedValue: string } | null {
  if (/аккумуляторн|акб|battery|cordless/i.test(text)) {
    return { value: "Аккумуляторный", normalizedValue: "battery" };
  }
  if (/бензинов/i.test(text)) {
    return { value: "Бензиновый", normalizedValue: "petrol" };
  }
  if (/дизельн/i.test(text)) {
    return { value: "Дизельный", normalizedValue: "diesel" };
  }
  if (/электрическ|сетев/i.test(text)) {
    return { value: "Электрический", normalizedValue: "electric" };
  }

  return null;
}

function normalizeEnergyClass(value: string): string {
  return value.toLocaleUpperCase("ru-RU").replace(/^А/, "A");
}

function extractEnergyClass(text: string, attributes: ExtractedProductAttribute[]) {
  const energy = text.match(/(?:кл\.?\s*энер\.?|энергоэффективность|класс энергопотребления|класс)\s*:?\s*([aа][+]{0,3}|[bcdefgвсдефг])/i);
  if (!energy) return;

  const value = normalizeEnergyClass(energy[1]);
  addAttribute(attributes, {
    key: "energy_class",
    label: "Класс энергопотребления",
    value,
    normalizedValue: normalizeToken(value),
    numericValue: null,
    unit: null,
  });
}

function extractDimensionsCm(text: string, attributes: ExtractedProductAttribute[]) {
  const dimensions = text.match(/(\d+(?:[.,]\d+)?)\s*[xх]\s*(\d+(?:[.,]\d+)?)\s*[xх]\s*(\d+(?:[.,]\d+)?)\s*см/i);
  if (dimensions) {
    addNumberAttribute(attributes, "width_cm", "Ширина", dimensions[1], "см");
    addNumberAttribute(attributes, "height_cm", "Высота", dimensions[2], "см");
    addNumberAttribute(attributes, "depth_cm", "Глубина", dimensions[3], "см");
    return;
  }

  const depth = text.match(/глубин[аы]?\s*[:-]?\s*(\d+(?:[.,]\d+)?)\s*см/i);
  if (depth) {
    addNumberAttribute(attributes, "depth_cm", "Глубина", depth[1], "см");
  }
}

// Pull an explicit "ширина N см" only — used for appliances where the bare
// dimensions string (WxHxD) is often absent but the labelled width is present.
// Skip if a width was already derived (e.g. from the WxHxD triple) to avoid two
// conflicting width values on one product.
function extractLabelledWidthCm(text: string, attributes: ExtractedProductAttribute[]) {
  if (attributes.some((attribute) => attribute.key === "width_cm")) return;
  const width = text.match(/ширин[аы]?\s*[:-]?\s*(\d+(?:[.,]\d+)?)\s*см/i);
  if (width) {
    addNumberAttribute(attributes, "width_cm", "Ширина", width[1], "см");
  }
}

function addAttribute(
  attributes: ExtractedProductAttribute[],
  attribute: Omit<ExtractedProductAttribute, "source"> & { source?: ProductAttributeSource },
) {
  if (attributes.some((item) => item.key === attribute.key && item.normalizedValue === attribute.normalizedValue)) return;
  attributes.push({ ...attribute, source: attribute.source ?? "name" });
}

function addNumberAttribute(
  attributes: ExtractedProductAttribute[],
  key: string,
  label: string,
  rawValue: string,
  unit: string,
) {
  const normalized = compactNumber(rawValue);
  addAttribute(attributes, {
    key,
    label,
    value: `${normalized} ${unit}`,
    normalizedValue: normalized,
    numericValue: numberValue(normalized),
    unit,
  });
}

function addPowerWAttribute(text: string, attributes: ExtractedProductAttribute[]) {
  const power = text.match(/(\d+(?:[.,]\d+)?)\s*(квт|kw|вт|w)(?=$|[\s,;.])/i);
  if (!power) return;

  const sourceValue = numberValue(power[1]);
  const unit = power[2].toLocaleLowerCase("ru-RU");
  const numericWatts = sourceValue === null ? null : unit === "квт" || unit === "kw" ? sourceValue * 1000 : sourceValue;
  const displayUnit = unit === "квт" || unit === "kw" ? "кВт" : "Вт";
  const displayValue = compactNumber(power[1]);
  addAttribute(attributes, {
    key: "power_w",
    label: "Мощность",
    value: `${displayValue} ${displayUnit}`,
    normalizedValue: numericWatts === null ? displayValue : compactNumber(String(numericWatts)),
    numericValue: numericWatts,
    unit: "Вт",
  });
}

function extractLaundryAttributes(text: string, attributes: ExtractedProductAttribute[]) {
  if (!looksLikeLaundryProduct(text)) return;

  const load = text.match(/(?:макс\.?\s*загр\.?\s*:?\s*)?(\d+(?:[.,]\d+)?)\s*кг/i);
  if (load) {
    addNumberAttribute(attributes, "load_capacity", "Загрузка", load[1], "кг");
  }

  if (/теплов(ой|ым)\s+насос|heat\s*pump/i.test(text)) {
    addAttribute(attributes, {
      key: "drying_type",
      label: "Тип сушки",
      value: "Тепловой насос",
      normalizedValue: "heat_pump",
      numericValue: null,
      unit: null,
    });
  } else if (/конденсацион/i.test(text)) {
    addAttribute(attributes, {
      key: "drying_type",
      label: "Тип сушки",
      value: "Конденсационная",
      normalizedValue: "condensation",
      numericValue: null,
      unit: null,
    });
  } else if (/вентиляцион/i.test(text)) {
    addAttribute(attributes, {
      key: "drying_type",
      label: "Тип сушки",
      value: "Вентиляционная",
      normalizedValue: "vented",
      numericValue: null,
      unit: null,
    });
  }

  if (/отдельностоящ/i.test(text)) {
    addAttribute(attributes, {
      key: "installation_type",
      label: "Установка",
      value: "Отдельностоящая",
      normalizedValue: "freestanding",
      numericValue: null,
      unit: null,
    });
  } else if (/встраиваем/i.test(text)) {
    addAttribute(attributes, {
      key: "installation_type",
      label: "Установка",
      value: "Встраиваемая",
      normalizedValue: "built_in",
      numericValue: null,
      unit: null,
    });
  }

  if (/inverter|инвертор/i.test(text)) {
    addAttribute(attributes, {
      key: "inverter_motor",
      label: "Инверторный двигатель",
      value: "Да",
      normalizedValue: "yes",
      numericValue: null,
      unit: null,
    });
  }

  const programs = text.match(/программ\D{0,8}(\d{1,2})/i) ?? text.match(/(\d{1,2})\s*программ/i);
  if (programs) {
    addNumberAttribute(attributes, "program_count", "Количество программ", programs[1], "программ");
  }

  const spinSpeed = text.match(/(\d{3,4})\s*(?:об\s*\/\s*мин|об\.?\s*мин|rpm)/i);
  if (spinSpeed) {
    addNumberAttribute(attributes, "spin_speed", "Скорость отжима", spinSpeed[1], "об/мин");
  }

  extractDimensionsCm(text, attributes);
  // Slim/narrow washers usually state only a labelled width/depth, not the full
  // WxHxD string, so fill width when the dimensions parser found nothing for it.
  extractLabelledWidthCm(text, attributes);

  extractEnergyClass(text, attributes);
}

function extractRefrigerationAttributes(text: string, attributes: ExtractedProductAttribute[]) {
  if (!looksLikeRefrigerationProduct(text)) return;

  if (/no\s*frost|nofrost|ноу\s*фрост/i.test(text)) {
    addAttribute(attributes, {
      key: "fridge_no_frost",
      label: "No Frost",
      value: "Да",
      normalizedValue: "yes",
      numericValue: null,
      unit: null,
    });
  }

  const totalVolume =
    text.match(/(?:общий\s+)?объ[её]м\D{0,12}(\d+(?:[.,]\d+)?)\s*л/i) ??
    Array.from(text.matchAll(/(\d+(?:[.,]\d+)?)\s*л(?!\s*\/)/gi)).find((match) => {
      const value = numberValue(match[1]);
      return value !== null && value >= 40 && value <= 900;
    });
  if (totalVolume) {
    addNumberAttribute(attributes, "total_volume_l", "Общий объем", totalVolume[1], "л");
  }

  const freezerVolume = text.match(/морозильн\D{0,24}(\d+(?:[.,]\d+)?)\s*л/i);
  if (freezerVolume) {
    addNumberAttribute(attributes, "freezer_volume_l", "Объем морозильной камеры", freezerVolume[1], "л");
  }

  if (/морозильн\D{0,30}(сниз|нижн)/i.test(text)) {
    addAttribute(attributes, {
      key: "freezer_position",
      label: "Расположение морозильника",
      value: "Снизу",
      normalizedValue: "bottom",
      numericValue: null,
      unit: null,
    });
  } else if (/морозильн\D{0,30}(сверх|верхн)/i.test(text)) {
    addAttribute(attributes, {
      key: "freezer_position",
      label: "Расположение морозильника",
      value: "Сверху",
      normalizedValue: "top",
      numericValue: null,
      unit: null,
    });
  } else if (/side[\s-]?by[\s-]?side/i.test(text)) {
    addAttribute(attributes, {
      key: "freezer_position",
      label: "Расположение морозильника",
      value: "Side-by-Side",
      normalizedValue: "side_by_side",
      numericValue: null,
      unit: null,
    });
  }

  if (/отдельностоящ/i.test(text)) {
    addAttribute(attributes, {
      key: "installation_type",
      label: "Установка",
      value: "Отдельностоящая",
      normalizedValue: "freestanding",
      numericValue: null,
      unit: null,
    });
  } else if (/встраиваем/i.test(text)) {
    addAttribute(attributes, {
      key: "installation_type",
      label: "Установка",
      value: "Встраиваемая",
      normalizedValue: "built_in",
      numericValue: null,
      unit: null,
    });
  }

  if (/inverter|инвертор/i.test(text)) {
    addAttribute(attributes, {
      key: "inverter_motor",
      label: "Инверторный двигатель",
      value: "Да",
      normalizedValue: "yes",
      numericValue: null,
      unit: null,
    });
  }

  extractDimensionsCm(text, attributes);
  extractEnergyClass(text, attributes);
}

function extractPaperAttributes(text: string, attributes: ExtractedProductAttribute[]) {
  if (!looksLikePaperProduct(text)) return;

  const format = text.match(/\b(a[0-6]|а[0-6])\b/i);
  if (format) {
    const value = format[1].toLocaleUpperCase("ru-RU").replace(/^А/, "A");
    addAttribute(attributes, {
      key: "paper_format",
      label: "Формат",
      value,
      normalizedValue: value.toLocaleLowerCase("ru-RU"),
      numericValue: null,
      unit: null,
    });
  }

  const density = text.match(/(\d+(?:[.,]\d+)?)\s*(?:г\s*\/\s*м2|г\s*\/\s*м²|gsm)\b/i);
  if (density) {
    addNumberAttribute(attributes, "paper_density", "Плотность", density[1], "г/м²");
  }

  const whiteness = text.match(/белизн\D{0,10}(\d+(?:[.,]\d+)?)\s*%/i);
  if (whiteness) {
    addNumberAttribute(attributes, "paper_whiteness", "Белизна", whiteness[1], "%");
  }

  const sheets = text.match(/(\d{2,5})\s*(?:лист(?:ов|а)?|л\.)/i);
  if (sheets) {
    addNumberAttribute(attributes, "sheet_count", "Количество листов", sheets[1], "листов");
  }
}

function extractCameraAttributes(text: string, attributes: ExtractedProductAttribute[]) {
  if (!looksLikeCameraProduct(text)) return;

  const megapixels = text.match(/(\d+(?:[.,]\d+)?)\s*(?:мп|mp|мегапиксел)/i);
  if (megapixels) {
    const value = compactNumber(megapixels[1]);
    addAttribute(attributes, {
      key: "resolution",
      label: "Разрешение",
      value: `${value} Мп`,
      normalizedValue: `${value}_mp`,
      numericValue: numberValue(value),
      unit: "Мп",
    });
  }

  const lens = text.match(/(?:объектив|фокус\D{0,16})\D{0,8}(\d+(?:[.,]\d+)?)\s*мм/i);
  if (lens) {
    addNumberAttribute(attributes, "camera_lens_mm", "Фокусное расстояние", lens[1], "мм");
  }

  const ipRating = extractIpRating(text);
  if (ipRating) {
    addAttribute(attributes, {
      key: "ip_rating",
      label: "Степень защиты",
      value: ipRating.value,
      normalizedValue: ipRating.normalizedValue,
      numericValue: null,
      unit: null,
    });
  }
}

function extractTireAttributes(text: string, attributes: ExtractedProductAttribute[]) {
  if (!looksLikeTireProduct(text)) return;

  const size = text.match(/(\d{3})\s*\/\s*(\d{2})\s*r\s*(\d{2})/i);
  if (size) {
    addNumberAttribute(attributes, "tire_width", "Ширина шины", size[1], "мм");
    addNumberAttribute(attributes, "tire_profile", "Профиль шины", size[2], "%");
    addNumberAttribute(attributes, "rim_diameter", "Диаметр диска", size[3], "R");
  }

  if (/зимн|winter/i.test(text)) {
    addAttribute(attributes, {
      key: "tire_season",
      label: "Сезон",
      value: "Зимние",
      normalizedValue: "winter",
      numericValue: null,
      unit: null,
    });
  } else if (/летн|summer/i.test(text)) {
    addAttribute(attributes, {
      key: "tire_season",
      label: "Сезон",
      value: "Летние",
      normalizedValue: "summer",
      numericValue: null,
      unit: null,
    });
  } else if (/всесезон|all[\s-]?season/i.test(text)) {
    addAttribute(attributes, {
      key: "tire_season",
      label: "Сезон",
      value: "Всесезонные",
      normalizedValue: "all_season",
      numericValue: null,
      unit: null,
    });
  }
}

function extractDishAndApparelAttributes(text: string, attributes: ExtractedProductAttribute[]) {
  if (looksLikeDishProduct(text)) {
    const volume = text.match(/(\d+(?:[.,]\d+)?)\s*(?:л|l)(?=$|[\s,;])/i);
    if (volume) {
      addNumberAttribute(attributes, "volume_l", "Объем", volume[1], "л");
    }

    const diameter = text.match(/(?:диаметр|d)\D{0,6}(\d+(?:[.,]\d+)?)\s*см/i);
    if (diameter) {
      addNumberAttribute(attributes, "diameter_cm", "Диаметр", diameter[1], "см");
    }

    const pieces = text.match(/(\d{1,3})\s*(?:шт|предмет|персон|пар)/i);
    if (pieces) {
      addNumberAttribute(attributes, "pieces_count", "Количество предметов", pieces[1], "шт.");
    }
  }

  if (looksLikeApparelProduct(text)) {
    const size = text.match(/(?:размер|р-р|р\.)\s*([0-9]{2,3}(?:[-/][0-9]{2,3})?|[xsml]{1,4})\b/i);
    if (size) {
      const value = size[1].toLocaleUpperCase("ru-RU");
      addAttribute(attributes, {
        key: "size",
        label: "Размер",
        value,
        normalizedValue: normalizeToken(value),
        numericValue: numberValue(value),
        unit: null,
      });
    }
  }

  const materials: Array<{ pattern: RegExp; value: string; normalizedValue: string }> = [
    { pattern: /нержавеющ(?:ая|ей)?\s+сталь|нерж\.?\s*сталь/i, value: "Нержавеющая сталь", normalizedValue: "stainless_steel" },
    { pattern: /стекл(?:о|янн)/i, value: "Стекло", normalizedValue: "glass" },
    { pattern: /фарфор/i, value: "Фарфор", normalizedValue: "porcelain" },
    { pattern: /керамик/i, value: "Керамика", normalizedValue: "ceramic" },
    { pattern: /пластик/i, value: "Пластик", normalizedValue: "plastic" },
    { pattern: /дерев|массив/i, value: "Дерево", normalizedValue: "wood" },
    { pattern: /металл/i, value: "Металл", normalizedValue: "metal" },
    { pattern: /кожа|экокожа/i, value: "Кожа", normalizedValue: "leather" },
  ];
  const material = materials.find((item) => item.pattern.test(text));
  if (material) {
    addAttribute(attributes, {
      key: "material",
      label: "Материал",
      value: material.value,
      normalizedValue: material.normalizedValue,
      numericValue: null,
      unit: null,
    });
  }
}

function extractVacuumAttributes(text: string, attributes: ExtractedProductAttribute[]) {
  if (!looksLikeVacuumProduct(text)) return;

  if (/робот/i.test(text)) {
    addAttribute(attributes, {
      key: "vacuum_type",
      label: "Тип пылесоса",
      value: "Робот-пылесос",
      normalizedValue: "robot",
      numericValue: null,
      unit: null,
    });
  } else if (/вертикальн/i.test(text)) {
    addAttribute(attributes, {
      key: "vacuum_type",
      label: "Тип пылесоса",
      value: "Вертикальный",
      normalizedValue: "vertical",
      numericValue: null,
      unit: null,
    });
  } else if (/профессиональн|строительн|промышленн/i.test(text)) {
    addAttribute(attributes, {
      key: "vacuum_type",
      label: "Тип пылесоса",
      value: "Профессиональный",
      normalizedValue: "professional",
      numericValue: null,
      unit: null,
    });
  }

  if (/контейнер|циклон/i.test(text)) {
    addAttribute(attributes, {
      key: "dust_collector",
      label: "Пылесборник",
      value: "Контейнер",
      normalizedValue: "container",
      numericValue: null,
      unit: null,
    });
  } else if (/мешок|мешк/i.test(text)) {
    addAttribute(attributes, {
      key: "dust_collector",
      label: "Пылесборник",
      value: "Мешок",
      normalizedValue: "bag",
      numericValue: null,
      unit: null,
    });
  } else if (/аквафильтр|водян/i.test(text)) {
    addAttribute(attributes, {
      key: "dust_collector",
      label: "Пылесборник",
      value: "Аквафильтр",
      normalizedValue: "aquafilter",
      numericValue: null,
      unit: null,
    });
  }

  const suction = text.match(/(?:мощность\s+всасывания|всасывани[ея])\D{0,16}(\d+(?:[.,]\d+)?)\s*(?:вт|w)(?=$|[\s,;.])/i);
  if (suction) {
    addNumberAttribute(attributes, "suction_power_w", "Мощность всасывания", suction[1], "Вт");
  }

  if (/моющ|влажн/i.test(text)) {
    addAttribute(attributes, {
      key: "cleaning_type",
      label: "Тип уборки",
      value: "Влажная уборка",
      normalizedValue: "wet",
      numericValue: null,
      unit: null,
    });
  } else if (/сух/i.test(text)) {
    addAttribute(attributes, {
      key: "cleaning_type",
      label: "Тип уборки",
      value: "Сухая уборка",
      normalizedValue: "dry",
      numericValue: null,
      unit: null,
    });
  }

  if (/hepa/i.test(text)) {
    addAttribute(attributes, {
      key: "filter_type",
      label: "Фильтр",
      value: "HEPA",
      normalizedValue: "hepa",
      numericValue: null,
      unit: null,
    });
  }
}

function looksLikeTvProduct(text: string): boolean {
  return /телевизор|smart\s*tv|\bтв\b|qled|oled|\bled\b\s*т[ \-]?в|плазменн/i.test(text);
}

function extractInstallationType(text: string, attributes: ExtractedProductAttribute[]) {
  if (/встраиваем|встроенн/i.test(text)) {
    addAttribute(attributes, {
      key: "installation_type",
      label: "Установка",
      value: "Встраиваемая",
      normalizedValue: "built_in",
      numericValue: null,
      unit: null,
    });
  } else if (/отдельностоящ|настольн/i.test(text)) {
    addAttribute(attributes, {
      key: "installation_type",
      label: "Установка",
      value: "Отдельностоящая",
      normalizedValue: "freestanding",
      numericValue: null,
      unit: null,
    });
  }
}

function extractDishwasherAttributes(text: string, attributes: ExtractedProductAttribute[]) {
  if (!/посудомо\w*|dishwasher/i.test(text)) return;
  extractInstallationType(text, attributes);

  const width = text.match(/(?<!\d)(45|60)\s*см/i);
  if (width) {
    addNumberAttribute(attributes, "width_cm", "Ширина", width[1], "см");
  }

  const programs = text.match(/(\d{1,2})\s*прогр/i) ?? text.match(/программ\D{0,8}(\d{1,2})/i) ?? text.match(/(\d{1,2})\s*программ/i);
  if (programs) {
    addNumberAttribute(attributes, "program_count", "Количество программ", programs[1], "программ");
  }

  const settings = text.match(/(\d{1,2})\s*компл\w*/i);
  if (settings) {
    addNumberAttribute(attributes, "place_settings", "Комплектов посуды", settings[1], "компл.");
  }

  extractEnergyClass(text, attributes);
}

function extractMicrowaveAttributes(text: string, attributes: ExtractedProductAttribute[]) {
  if (!/микроволнов\w*|свч|microwave/i.test(text)) return;
  extractInstallationType(text, attributes);

  const volume = Array.from(text.matchAll(/(\d{1,2})\s*л(?!\s*\/)/gi)).find((match) => {
    const value = numberValue(match[1]);
    return value !== null && value >= 10 && value <= 45;
  });
  if (volume) {
    addNumberAttribute(attributes, "volume_l", "Объем", volume[1], "л");
  }

  addPowerWAttribute(text, attributes);
}

function extractOvenAttributes(text: string, attributes: ExtractedProductAttribute[]) {
  // \w does not cover Cyrillic, so "духовой шкаф" must be matched with an
  // explicit Cyrillic gap, not \w*.
  if (!/духов[а-яё]*\s+шкаф|духовк|\boven\b/i.test(text)) return;
  extractInstallationType(text, attributes);

  const volume = Array.from(text.matchAll(/(\d{2,3})\s*л(?!\s*\/)/gi)).find((match) => {
    const value = numberValue(match[1]);
    return value !== null && value >= 35 && value <= 130;
  });
  if (volume) {
    addNumberAttribute(attributes, "oven_volume_l", "Объем духовки", volume[1], "л");
  }

  if (/газов/i.test(text)) {
    addAttribute(attributes, { key: "oven_type", label: "Тип", value: "Газовая", normalizedValue: "gas", numericValue: null, unit: null });
  } else if (/электрическ/i.test(text)) {
    addAttribute(attributes, { key: "oven_type", label: "Тип", value: "Электрическая", normalizedValue: "electric", numericValue: null, unit: null });
  }

  extractLabelledWidthCm(text, attributes);
  extractEnergyClass(text, attributes);
}

function extractCooktopAttributes(text: string, attributes: ExtractedProductAttribute[]) {
  // \w does not cover Cyrillic, so "варочная панель" must be matched with an
  // explicit Cyrillic gap, not \w* (same bug class already fixed for "духовой шкаф").
  if (!/варочн[а-яё]*\s*(?:панел|поверхн)|cooktop|\bhob\b/i.test(text)) return;

  if (/индукцион/i.test(text)) {
    addAttribute(attributes, { key: "cooktop_type", label: "Тип", value: "Индукционная", normalizedValue: "induction", numericValue: null, unit: null });
  } else if (/комбинирован/i.test(text)) {
    addAttribute(attributes, { key: "cooktop_type", label: "Тип", value: "Комбинированная", normalizedValue: "combined", numericValue: null, unit: null });
  } else if (/газов/i.test(text)) {
    addAttribute(attributes, { key: "cooktop_type", label: "Тип", value: "Газовая", normalizedValue: "gas", numericValue: null, unit: null });
  } else if (/электрическ|стеклокерам/i.test(text)) {
    addAttribute(attributes, { key: "cooktop_type", label: "Тип", value: "Электрическая", normalizedValue: "electric", numericValue: null, unit: null });
  }

  const burners = text.match(/(\d)\s*конфор\w*/i);
  if (burners) {
    addNumberAttribute(attributes, "burner_count", "Конфорок", burners[1], "конф.");
  }

  const width = text.match(/(?<!\d)(30|45|60|90)\s*см/i);
  if (width) {
    addNumberAttribute(attributes, "width_cm", "Ширина", width[1], "см");
  }
}

export function extractProductNameAttributes(name: string | null | undefined): ExtractedProductAttribute[] {
  const text = name?.trim();
  if (!text) return [];

  const attributes: ExtractedProductAttribute[] = [];

  const dailyCapacity = text.match(/(\d+(?:[.,]\d+)?)\s*л\s*\/\s*сут/i);
  if (dailyCapacity) {
    addNumberAttribute(attributes, "daily_capacity", "Производительность", dailyCapacity[1], "л/сутки");
  }

  const looksLikeTankProduct = /осушител|увлажнител|мойк[аи]\s+воздуха|бак|резервуар/i.test(text);
  if (looksLikeTankProduct) {
    const literMatches = Array.from(text.matchAll(/(\d+(?:[.,]\d+)?)\s*л(?!\s*\/)/gi));
    const tankMatch = literMatches.find((match) => {
      const value = numberValue(match[1]);
      return value !== null && value > 0 && value <= 30;
    });
    if (tankMatch) {
      addNumberAttribute(attributes, "tank_volume", "Объем бака", tankMatch[1], "л");
    }
  }

  const diagonal = text.match(/(?:^|[^\d])(\d{2,3})\s*(?:"|”|дюйм(?:ов|а)?)/i);
  if (diagonal) {
    addAttribute(attributes, {
      key: "screen_diagonal",
      label: "Диагональ",
      value: `${diagonal[1]}"`,
      normalizedValue: diagonal[1],
      numericValue: numberValue(diagonal[1]),
      unit: "дюйм",
    });
  }

  if (/\b4\s*k\b/i.test(text)) {
    addAttribute(attributes, {
      key: "resolution",
      label: "Разрешение",
      value: /uhd/i.test(text) ? "4K UHD" : "4K",
      normalizedValue: /uhd/i.test(text) ? "4k_uhd" : "4k",
      numericValue: null,
      unit: null,
    });
  } else if (/full\s*hd/i.test(text)) {
    addAttribute(attributes, {
      key: "resolution",
      label: "Разрешение",
      value: "Full HD",
      normalizedValue: "full_hd",
      numericValue: null,
      unit: null,
    });
  }

  // Only tag Smart TV for actual TVs. A bare "смарт" used to match "смартфоне"
  // and stamped smart_tv=Да onto dishwashers, kettles, etc.
  if (/smart\s*tv|смарт[\s-]?тв/i.test(text) || (looksLikeTvProduct(text) && /smart|смарт/i.test(text))) {
    addAttribute(attributes, {
      key: "smart_tv",
      label: "Smart TV",
      value: "Да",
      normalizedValue: "yes",
      numericValue: null,
      unit: null,
    });
  }

  extractLaundryAttributes(text, attributes);
  extractRefrigerationAttributes(text, attributes);
  extractDishwasherAttributes(text, attributes);
  extractMicrowaveAttributes(text, attributes);
  extractOvenAttributes(text, attributes);
  extractCooktopAttributes(text, attributes);
  extractPaperAttributes(text, attributes);
  extractCameraAttributes(text, attributes);
  extractTireAttributes(text, attributes);
  extractDishAndApparelAttributes(text, attributes);
  extractVacuumAttributes(text, attributes);

  const electricalProductType = extractElectricalProductType(text);
  if (electricalProductType) {
    addAttribute(attributes, {
      key: "electrical_product_type",
      label: "Тип электротовара",
      value: electricalProductType.value,
      normalizedValue: electricalProductType.normalizedValue,
      numericValue: null,
      unit: null,
    });

    if (electricalProductType.normalizedValue === "cable") {
      const cableSize = text.match(/(\d+)\s*[xх]\s*(\d+(?:[.,]\d+)?)/i);
      if (cableSize) {
        const cores = Number(cableSize[1]);
        const section = compactNumber(cableSize[2]);
        if (Number.isFinite(cores) && cores > 0) {
          addAttribute(attributes, {
            key: "cable_cores",
            label: "Количество жил",
            value: `${cores} ${cableCoreUnit(cores)}`,
            normalizedValue: String(cores),
            numericValue: cores,
            unit: "жил",
          });
        }
        addNumberAttribute(attributes, "cable_section", "Сечение кабеля", section, "мм²");
      }

      const cableLength = text.match(/(\d+(?:[.,]\d+)?)\s*м(?=$|[\s,;.])/i);
      if (cableLength) {
        addNumberAttribute(attributes, "cable_length", "Длина", cableLength[1], "м");
      }
    }

    const voltage = text.match(/(\d+(?:[.,]\d+)?)\s*(?:в|v)(?=$|[\s,;])/i);
    if (voltage) {
      addNumberAttribute(attributes, "voltage", "Напряжение", voltage[1], "В");
    }

    const current = text.match(/(\d+(?:[.,]\d+)?)\s*(?:а(?!\s*ч)|a(?!h))(?=$|[\s,;])/i);
    if (current) {
      addNumberAttribute(attributes, "current_amp", "Сила тока", current[1], "А");
    }

    addPowerWAttribute(text, attributes);

    const ipRating = extractIpRating(text);
    if (ipRating) {
      addAttribute(attributes, {
        key: "ip_rating",
        label: "Степень защиты",
        value: ipRating.value,
        normalizedValue: ipRating.normalizedValue,
        numericValue: null,
        unit: null,
      });
    }
  }

  extractElectricalAccessoryAttributes(text, attributes);

  const color = extractColor(text);
  if (color) {
    addAttribute(attributes, {
      key: "color",
      label: "Цвет",
      value: color.value,
      normalizedValue: color.normalizedValue,
      numericValue: null,
      unit: null,
    });
  }

  const powerSource = extractPowerSource(text);
  if (powerSource) {
    addAttribute(attributes, {
      key: "power_source",
      label: "Тип питания",
      value: powerSource.value,
      normalizedValue: powerSource.normalizedValue,
      numericValue: null,
      unit: null,
    });
  }

  addPowerWAttribute(text, attributes);

  // "л.с." (лошадиные силы). Must NOT swallow "N л, сенсор" / "N л сенсор"
  // (литры + слово начинающееся на «с», напр. у аэрогрилей «10 л, сенсор»):
  // require the «с» to be a standalone unit — negative lookahead for a letter
  // right after it. Real "6.5 л.с." (мотоблоки/генераторы) still matches.
  const powerHp =
    text.match(/(\d+(?:[.,]\d+)?)\s*л[.,]?\s*с\.?(?![а-яёa-z])/i) ??
    (looksLikeEngineProduct(text) ? text.match(/(\d+(?:[.,]\d+)?)\s*(?:hp\b|h\.?\s*p\.?\b)/i) : null);
  if (powerHp) {
    addNumberAttribute(attributes, "power_hp", "Мощность двигателя", powerHp[1], "л.с.");
  }

  // Countertop kitchen appliances state capacity in litres ("10 л, сенсор").
  // Capture it as volume (the greedy power_hp above no longer steals it).
  if (looksLikeKitchenCapacityAppliance(text)) {
    const litres = text.match(/(\d+(?:[.,]\d+)?)\s*л(?![а-яёa-z])/i);
    if (litres) {
      addNumberAttribute(attributes, "volume_l", "Объем", litres[1], "л");
    }
  }

  const looksLikeBatteryProduct = /аккумулятор|акб|battery|cordless|батаре/i.test(text) || /(\d+(?:[.,]\d+)?)\s*(?:а\s*ч|а·ч|ah)/i.test(text);
  if (looksLikeBatteryProduct) {
    const voltage = text.match(/(\d+(?:[.,]\d+)?)\s*(?:в|v)(?=$|[\s,;])/i);
    if (voltage) {
      addNumberAttribute(attributes, "battery_voltage", "Напряжение аккумулятора", voltage[1], "В");
    }

    const capacity = text.match(/(\d+(?:[.,]\d+)?)\s*(?:а\s*ч|а·ч|ah)/i);
    if (capacity) {
      addNumberAttribute(attributes, "battery_capacity", "Емкость аккумулятора", capacity[1], "Ач");
    }
  }

  const ram = text.match(/(\d+)\s*(?:гб|gb)\s*(?:ram|оператив)/i) ?? text.match(/(?:ram|оператив\D{0,20})(\d+)\s*(?:гб|gb)/i);
  if (ram) {
    addNumberAttribute(attributes, "ram", "Оперативная память", ram[1], "ГБ");
  }

  const storageForward = text.match(/(ssd|hdd)\s*(\d+(?:[.,]\d+)?)\s*(гб|gb|тб|tb)/i);
  const storageReverse = storageForward ? null : text.match(/(\d+(?:[.,]\d+)?)\s*(гб|gb|тб|tb)\s*(ssd|hdd)/i);
  const storage = storageForward
    ? { type: storageForward[1], capacity: storageForward[2], unit: storageForward[3] }
    : storageReverse
      ? { type: storageReverse[3], capacity: storageReverse[1], unit: storageReverse[2] }
      : null;

  if (storage) {
    const normalizedCapacity = compactNumber(storage.capacity);
    const normalizedUnit = normalizeStorageUnit(storage.unit);
    addAttribute(attributes, {
      key: "storage_type",
      label: "Тип накопителя",
      value: storage.type.toLocaleUpperCase("ru-RU"),
      normalizedValue: storage.type.toLocaleLowerCase("ru-RU"),
      numericValue: null,
      unit: null,
    });
    addAttribute(attributes, {
      key: "storage_capacity",
      label: "Объем накопителя",
      value: `${normalizedCapacity} ${normalizedUnit}`,
      normalizedValue: normalizedCapacity,
      numericValue: numberValue(normalizedCapacity),
      unit: normalizedUnit,
    });
  }

  const intelProcessor = text.match(/\bintel\s+core\s+(i[3579])(?:[-\s]+([a-z0-9][a-z0-9-]*))?/i);
  if (intelProcessor) {
    const family = `Intel Core ${intelProcessor[1].toLocaleLowerCase("ru-RU")}`;
    addAttribute(attributes, {
      key: "processor_family",
      label: "Процессор",
      value: family,
      normalizedValue: normalizeToken(family),
      numericValue: null,
      unit: null,
    });
    if (intelProcessor[2]) {
      const model = `${family}-${intelProcessor[2].toLocaleUpperCase("ru-RU")}`;
      addAttribute(attributes, {
        key: "processor_model",
        label: "Модель процессора",
        value: model,
        normalizedValue: normalizeToken(model),
        numericValue: null,
        unit: null,
      });
    }
  }

  const amdProcessor = text.match(/\bamd\s+ryzen\s+([3579])(?:[-\s]+([a-z0-9][a-z0-9-]*))?/i);
  if (amdProcessor) {
    const family = `AMD Ryzen ${amdProcessor[1]}`;
    addAttribute(attributes, {
      key: "processor_family",
      label: "Процессор",
      value: family,
      normalizedValue: normalizeToken(family),
      numericValue: null,
      unit: null,
    });
    if (amdProcessor[2]) {
      const model = `${family}-${amdProcessor[2].toLocaleUpperCase("ru-RU")}`;
      addAttribute(attributes, {
        key: "processor_model",
        label: "Модель процессора",
        value: model,
        normalizedValue: normalizeToken(model),
        numericValue: null,
        unit: null,
      });
    }
  }

  const interfaces: Array<{ pattern: RegExp; value: string; normalizedValue: string }> = [
    { pattern: /\bhdmi\b/i, value: "HDMI", normalizedValue: "hdmi" },
    { pattern: /\busb\b/i, value: "USB", normalizedValue: "usb" },
    { pattern: /\brj\s*[- ]?\s*45\b/i, value: "RJ-45", normalizedValue: "rj_45" },
    { pattern: /\bwi[\s-]?fi\b|вай\s?фай/i, value: "Wi-Fi", normalizedValue: "wi_fi" },
    { pattern: /\bbluetooth\b|блютуз/i, value: "Bluetooth", normalizedValue: "bluetooth" },
  ];
  for (const item of interfaces) {
    if (!item.pattern.test(text)) continue;
    addAttribute(attributes, {
      key: "interface",
      label: "Интерфейс",
      value: item.value,
      normalizedValue: item.normalizedValue,
      numericValue: null,
      unit: null,
    });
  }

  return attributes;
}
