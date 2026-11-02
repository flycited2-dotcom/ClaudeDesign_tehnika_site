import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CATEGORY_ART_BY_SLUG, resolveCategoryArt } from "@/lib/category-art";

const categories = [
  {id:"root",parentId:null,slug:"art-test-root",name:"Root"},
  {id:"child",parentId:"root",slug:"art-test-child",name:"Child"},
  {id:"leaf",parentId:"child",slug:"art-test-leaf",name:"Leaf"},
  {id:"other",parentId:"root",slug:"art-test-other",name:"Other"},
  {id:"empty",parentId:null,slug:"art-test-empty",name:"Empty"},
];

beforeAll(() => {
  CATEGORY_ART_BY_SLUG["art-test-root"] = "/static/category-cards/root.webp";
  CATEGORY_ART_BY_SLUG["art-test-child"] = "/static/category-cards/child.webp";
});
afterAll(() => {
  delete CATEGORY_ART_BY_SLUG["art-test-root"];
  delete CATEGORY_ART_BY_SLUG["art-test-child"];
});

describe("generated category artwork", () => {
  it("prefers a category's own artwork to its parent's artwork", () => {
    expect(resolveCategoryArt(categories,"child")).toBe("/static/category-cards/child.webp");
  });
  it("uses the nearest illustrated ancestor for an unfinished deep category", () => {
    expect(resolveCategoryArt(categories,"leaf")).toBe("/static/category-cards/child.webp");
  });
  it("can use root artwork without depending on supplier product photos", () => {
    expect(resolveCategoryArt(categories,"other")).toBe("/static/category-cards/root.webp");
  });
  it("returns no supplier image for unknown or unillustrated roots", () => {
    expect(resolveCategoryArt(categories,"empty")).toBeNull();
    expect(resolveCategoryArt(categories,"unknown")).toBeNull();
  });
});
