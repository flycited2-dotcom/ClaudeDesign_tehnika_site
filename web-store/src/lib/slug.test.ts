import { describe, expect, it } from "vitest";
import { productSlug } from "@/lib/slug";

describe("productSlug", () => {
  it("transliterates product names and appends supplier SKU", () => {
    expect(productSlug("Стабилизатор напряжения ExeGate Master Turbo", 2881306)).toBe(
      "stabilizator-napryazheniya-exegate-master-turbo-2881306",
    );
  });
});
