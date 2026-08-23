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
    expect(comment).toContain("Крыму, Запорожской и Херсонской областям");
    expect(comment).toContain("+7 978 579-29-95");

    const shareUrl = new URL(buildVkShareUrl(product!));
    expect(shareUrl.origin + shareUrl.pathname).toBe("https://vk.com/share.php");
    expect(shareUrl.searchParams.get("url")).toBe(
      "https://climat-simf.ru/share/vk/storefront-9758739",
    );
    expect(shareUrl.searchParams.get("comment")).toContain("Почему стоит выбрать:");
    expect(shareUrl.searchParams.get("comment")).toContain("Рабочий диапазон 130–270 В");
  });
});
