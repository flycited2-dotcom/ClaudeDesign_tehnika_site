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
      "Настенный цифровой стабилизатор для защиты техники при нестабильном напряжении. Рабочий диапазон 130–270 В, гарантия 36 месяцев. Доставка по Крыму, Запорожской и Херсонской областям.",
    imageUrl: "https://splithome.ru/static/cf-cards/storefront_9758739.png",
    price: "22 900 ₽",
    highlights: [
      "Мощность 12 000 ВА",
      "Рабочий диапазон 130–270 В",
      "Настенное размещение — не занимает место на полу",
      "Цифровой контроль напряжения",
      "Гарантия производителя 36 месяцев",
      "Подбор мощности под вашу нагрузку",
      "Доставка по Крыму, Запорожской и Херсонской областям",
      "Оплата при получении после подтверждения заказа",
    ],
    cta: "Позвоните или оставьте заявку — проверим наличие и подберём модель под параметры вашей сети.",
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
  ].join("\n");
}

export function buildVkShareUrl(product: VkShareProduct): string {
  const productUrl = `https://climat-simf.ru/share/vk/${product.slug}`;
  const params = new URLSearchParams({
    url: productUrl,
    comment: buildVkShareComment(product),
  });
  return `https://vk.com/share.php?${params.toString()}`;
}
