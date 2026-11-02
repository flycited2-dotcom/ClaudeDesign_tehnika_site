import generatedCategoryArt from "./generated-category-art.json";
import { buildCategoryPath, type FlatCategory } from "./catalog-tree";

// Готовые иллюстрации категорий всех уровней (public/static/category-cards).
// Используются на главной и в карточках меню каталога. Во время пополнения
// библиотеки вложенные категории могут использовать иллюстрацию родителя.
export const CATEGORY_ART_BY_SLUG: Record<string, string> = Object.assign({
  "bytovaya-tehnika-9839": "/static/category-cards/bytovaya-tehnika.png",
  "dacha-sad-i-ogorod-11038": "/static/category-cards/dacha-sad-i-ogorod-v2.png",
  "detskie-tovary-11173": "/static/category-cards/detskie-tovary.png",
  "dosug-i-razvlecheniya-11714": "/static/category-cards/dosug-i-razvlecheniya.png",
  "zapchasti-12719": "/static/category-cards/zapchasti.png",
  "kompyuternaya-tehnika-9975": "/static/category-cards/kompyuternaya-tehnika.png",
  "stroitelstvo-i-remont-10118": "/static/category-cards/stroitelstvo-i-remont.png",
  "tovary-dlya-doma-10754": "/static/category-cards/tovary-dlya-doma.png",
  "tovary-dlya-avto-i-moto-9629": "/static/category-cards/tovary-dlya-avto-i-moto.png",
  "elektronika-9756": "/static/category-cards/elektronika.png",
  "televizory-9758": "/static/category-cards/televizory.png",
  "oborudovanie-13597": "/static/category-cards/oborudovanie.png",
}, generatedCategoryArt);

export function resolveCategoryArt(categories: FlatCategory[], categoryId: string): string | null {
  for (const category of buildCategoryPath(categories, categoryId).reverse()) {
    const art = CATEGORY_ART_BY_SLUG[category.slug];
    if (art) return art;
  }
  return null;
}
