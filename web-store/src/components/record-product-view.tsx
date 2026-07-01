"use client";

import { useEffect } from "react";
import { recordRecentlyViewed } from "@/lib/sku-list-storage";

/** Invisible — records this product into "Вы недавно смотрели" on mount. */
export function RecordProductView({ sku }: { sku: number }) {
  useEffect(() => {
    recordRecentlyViewed(sku);
  }, [sku]);

  return null;
}
