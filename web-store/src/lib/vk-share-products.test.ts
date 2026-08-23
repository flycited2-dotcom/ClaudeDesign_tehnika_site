import { describe, expect, it } from "vitest";
import {
  buildVkShareComment,
  buildVkShareUrl,
  getVkShareProduct,
} from "./vk-share-products";

describe("VK share product", () => {
  it("keeps the approved RUCELF image and a complete sales offer", () => {
    const product = getVkShareProduct("storefront-9758739");
    expect(product).toBeDefined();
    expect(product?.imageUrl).toBe(
      "https://splithome.ru/static/cf-cards/storefront_9758739.png",
    );
    const comment = buildVkShareComment(product!);
    expect(comment).toContain("22 900 ₽");
    expect(comment).toContain("130–270 В");
    expect(comment).toContain("Гарантия производителя 36 месяцев");
    expect(comment).not.toContain("Доставка");
    expect(comment).not.toContain("Запорож");
    expect(comment).not.toContain("Херсон");
    expect(comment).toContain("+7 978 579-29-95");
    expect(comment).toContain(
      "Почему стоит выбрать:\r\n✅ Мощность 12 000 ВА\r\n✅ Рабочий диапазон 130–270 В",
    );
    expect(comment.split("\r\n").filter((line) => line.startsWith("✅ "))).toHaveLength(7);

    const shareUrl = new URL(buildVkShareUrl(product!));
    expect(shareUrl.origin + shareUrl.pathname).toBe("https://vk.com/share.php");
    expect(shareUrl.searchParams.get("url")).toBe(
      "https://climat-simf.ru/share/vk/storefront-9758739",
    );
    expect(shareUrl.searchParams.get("comment")).toContain("Почему стоит выбрать:");
    expect(shareUrl.searchParams.get("comment")).toContain("Рабочий диапазон 130–270 В");
    expect(shareUrl.searchParams.get("comment")).toContain("\r\n✅ Мощность 12 000 ВА\r\n");
  });

  it.each([
    ["shtil-is3000rt", "36 300 ₽", "3000 ВА", "/static/cf-cards/shtil-is3000rt.png"],
    ["powerman-avs-2000s", "5 950 ₽", "2000 ВА", "/static/cf-cards/powerman-avs-2000s.png"],
    ["powerman-back-pro-1050", "9 450 ₽", "1050 ВА", "/static/cf-cards/powerman-back-pro-1050.png"],
  ])("builds a public customer-safe post for %s", (slug, price, power, imageUrl) => {
    const product = getVkShareProduct(slug);
    expect(product).toBeDefined();
    expect(product?.imageUrl).toBe(imageUrl);

    const comment = buildVkShareComment(product!);
    expect(comment).toContain(price);
    expect(comment).toContain(power);
    expect(comment).toContain("Почему стоит выбрать:");
    expect(comment).not.toContain("Доставка");
    expect(comment).not.toContain("Запорож");
    expect(comment).not.toContain("Херсон");

    const shareUrl = new URL(buildVkShareUrl(product!));
    expect(shareUrl.searchParams.get("url")).toBe(
      `https://climat-simf.ru/share/vk/${slug}`,
    );
  });
});
