import { describe, expect, it } from "vitest";
import { isAllowedSupplierImageUrl, productImageSrc } from "@/lib/product-images";

describe("productImageSrc", () => {
  it("uses an internal image endpoint instead of exposing supplier URLs", () => {
    expect(productImageSrc({ id: "image id" })).toBe("/api/product-images/image%20id");
    expect(productImageSrc(null)).toBeNull();
  });
});

describe("isAllowedSupplierImageUrl", () => {
  it("allows only supplier image host URLs", () => {
    expect(isAllowedSupplierImageUrl("https://b2b.i-t-p.pro/model_files/product_images/1.jpg")).toBe(true);
    expect(isAllowedSupplierImageUrl("https://example.com/image.jpg")).toBe(false);
    expect(isAllowedSupplierImageUrl("/model_files/product_images/1.jpg")).toBe(false);
  });
});
