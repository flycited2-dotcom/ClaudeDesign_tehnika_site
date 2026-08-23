export type VkShareProduct = {
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  highlights: string[];
  cta: string;
};

const products: VkShareProduct[] = [
  {
    slug: "storefront-9758739",
    title: "RUCELF SRW-12000-D — стабилизатор 12 кВА",
    description:
      "Настенный цифровой стабилизатор для защиты техники при нестабильном напряжении. Рабочий диапазон 130–270 В, гарантия 36 месяцев.",
    imageUrl: "https://splithome.ru/static/cf-cards/storefront_9758739.png",
    price: "22 900 ₽",
    highlights: [
      "Мощность 12 000 ВА",
      "Рабочий диапазон 130–270 В",
      "Настенное размещение — не занимает место на полу",
      "Цифровой контроль напряжения",
      "Гарантия производителя 36 месяцев",
      "Подбор мощности под вашу нагрузку",
      "Оплата при получении после подтверждения заказа",
    ],
    cta: "Позвоните или оставьте заявку — проверим наличие и подберём модель под параметры вашей сети.",
  },
  {
    slug: "shtil-is3000rt",
    title: "ШТИЛЬ ИнСтаб IS3000RT — стабилизатор 3000 ВА",
    description:
      "Инверторный стабилизатор 3000 ВА / 2500 Вт для защиты чувствительной техники от перепадов напряжения.",
    imageUrl: "/static/cf-cards/shtil-is3000rt.png",
    price: "36 300 ₽",
    highlights: [
      "Полная мощность 3000 ВА",
      "Активная мощность 2500 Вт",
      "Инверторная стабилизация",
      "Универсальное исполнение Rack/Tower",
      "Цифровая индикация параметров сети",
      "Гарантия производителя 24 месяца",
    ],
    cta: "Напишите или позвоните — проверим актуальное наличие и подберём стабилизатор под вашу нагрузку.",
  },
  {
    slug: "powerman-avs-2000s",
    title: "POWERMAN AVS 2000S — стабилизатор 2000 ВА",
    description:
      "Настенный ступенчатый стабилизатор с цифровой индикацией для защиты бытового и инженерного оборудования.",
    imageUrl: "/static/cf-cards/powerman-avs-2000s.png",
    price: "5 950 ₽",
    highlights: [
      "Полная мощность 2000 ВА",
      "Ступенчатая стабилизация напряжения",
      "Цифровая индикация",
      "Настенное размещение",
      "КПД до 98%",
      "Подбор мощности с учётом пусковых токов",
    ],
    cta: "Напишите или позвоните — проверим актуальное наличие и рассчитаем подходящую мощность.",
  },
  {
    slug: "powerman-back-pro-1050",
    title: "POWERMAN Back Pro 1050 — ИБП 1050 ВА",
    description:
      "Line-interactive источник бесперебойного питания 1050 ВА / 600 Вт для защиты совместимого оборудования.",
    imageUrl: "/static/cf-cards/powerman-back-pro-1050.png",
    price: "9 450 ₽",
    highlights: [
      "Полная мощность 1050 ВА",
      "Активная мощность 600 Вт",
      "Четыре евророзетки",
      "Светодиодная индикация состояния",
      "Гарантия производителя 24 месяца",
      "Время автономной работы зависит от нагрузки",
    ],
    cta: "Напишите или позвоните — проверим актуальное наличие и подберём ИБП под вашу нагрузку.",
  },
];

const bySlug = new Map(products.map((product) => [product.slug, product]));

export function getVkShareProduct(slug: string): VkShareProduct | undefined {
  return bySlug.get(slug);
}

export function getVkShareProductSlugs(): string[] {
  return products.map((product) => product.slug);
}

export function buildVkShareComment(product: VkShareProduct): string {
  return [
    `⚡ ${product.title}`,
    "",
    `💎 ${product.price}`,
    "",
    "Почему стоит выбрать:",
    ...product.highlights.map((item) => `✅ ${item}`),
    "",
    product.cta,
    "📞 +7 978 579-29-95",
  ].join("\r\n");
}

export function buildVkShareUrl(product: VkShareProduct): string {
  const productUrl = `https://climat-simf.ru/share/vk/${product.slug}`;
  const params = new URLSearchParams({
    url: productUrl,
    comment: buildVkShareComment(product),
  });
  return `https://vk.com/share.php?${params.toString()}`;
}
