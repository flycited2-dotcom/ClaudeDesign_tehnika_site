import { storefront, storefrontCategories } from "@/lib/storefront";

export const dynamic = "force-static";

export function GET() {
  const text = `# ${storefront.brand}

${storefront.brand} - розничный интернет-магазин бытовой техники, электроники, климатического оборудования, компьютерной техники и товаров для дома. Магазин обслуживает покупателей в городе ${storefront.city}, Крыму, Херсонской и Запорожской областях.

Основной сайт: ${storefront.siteUrl}
Каталог: ${storefront.siteUrl}/catalog
Политика обработки персональных данных: ${storefront.siteUrl}/privacy

Основные категории:
${storefrontCategories.map((category) => `- ${category}`).join("\n")}

Как оформляется заказ:
- Покупатель ищет товары в каталоге, добавляет их в корзину и оставляет контактные данные.
- Менеджер подтверждает наличие, срок доставки и детали заказа.
- Регион доставки: ${storefront.region}.
- Оплата: при получении после подтверждения заказа.

Контакты:
${storefront.phones.map((phone) => `- Телефон: ${phone}`).join("\n")}
- Email: ${storefront.email}
- Часы работы: ${storefront.hours}
`;

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
