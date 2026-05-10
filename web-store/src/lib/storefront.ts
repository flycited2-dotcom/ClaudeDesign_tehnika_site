export const storefront = {
  brand: "БытТехОпт",
  city: "Симферополь",
  region: "Крым, Херсонская и Запорожская области",
  phones: ["+7 978 579-29-95", "+7 978 599-13-69"],
  email: "zakaz@climat-simf.ru",
  hours: "ежедневно с 8:00 до 22:00",
  siteUrl: "https://climat-simf.ru",
  telegram: "Telegram доступен по указанным телефонам",
};

export const storefrontCategories = [
  "Бытовая техника",
  "Климатическая техника",
  "Электроника",
  "Компьютерная техника",
  "Товары для дома",
];

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
