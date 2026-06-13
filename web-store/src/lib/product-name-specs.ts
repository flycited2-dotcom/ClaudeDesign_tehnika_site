import { extractProductNameAttributes } from "@/lib/product-attributes";

export type ExtractedProductSpec = {
  label: string;
  value: string;
};

/**
 * Specs pulled out of the product name, adapted from the shared name-attribute
 * extractor. The supplier feed rarely carries structured attributes, so the name
 * is usually the only source of real characteristics — show everything the
 * extractor recognises (deduped), capped so the table stays readable.
 */
export function extractProductNameSpecs(name: string | null | undefined): ExtractedProductSpec[] {
  const specs: ExtractedProductSpec[] = [];
  for (const attribute of extractProductNameAttributes(name)) {
    if (specs.some((spec) => spec.label === attribute.label && spec.value === attribute.value)) continue;
    specs.push({ label: attribute.label, value: attribute.value });
  }
  return specs.slice(0, 8);
}
