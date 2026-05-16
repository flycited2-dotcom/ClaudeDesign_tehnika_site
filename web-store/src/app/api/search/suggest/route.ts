import { NextResponse } from "next/server";
import {
  buildProductSearchTokens,
  decimalToNumber,
  productSearchTokenOr,
} from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { productImageSrc } from "@/lib/product-images";
import { normalRetailNameWhere } from "@/lib/retail-products";

export const dynamic = "force-dynamic";

const MAX_SUGGEST = 6;

type SuggestProduct = {
  id: string;
  slug: string;
  name: string;
  vendor: string | null;
  price: number;
  image: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q")?.trim() ?? "";
  if (rawQuery.length < 2) {
    return NextResponse.json({ products: [] satisfies SuggestProduct[] });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ products: [] satisfies SuggestProduct[] });
  }

  // Token-based search: every word in any of the searchable fields. Lets
  // "indesit стиральная" match "Стиральная машина Indesit IWSB..." regardless
  // of word order. Shared with /search and /catalog?q=... via @/lib/catalog.
  const tokens = buildProductSearchTokens(rawQuery);
  if (tokens.length === 0) {
    return NextResponse.json({ products: [] satisfies SuggestProduct[] });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isVisible: true,
        // Hide degraded items ("поврежденный товар", "уценка", "б/у" etc).
        ...normalRetailNameWhere(),
        AND: tokens.map((token) => productSearchTokenOr(token)),
      },
      select: {
        id: true,
        slug: true,
        name: true,
        supplierName: true,
        vendor: true,
        retailPrice: true,
        images: {
          where: { deleted: false },
          orderBy: { priority: "asc" },
          take: 1,
          select: { id: true },
        },
      },
      orderBy: [{ hasImage: "desc" }, { isAvailable: "desc" }, { updatedAt: "desc" }],
      take: MAX_SUGGEST,
    });

    const payload: SuggestProduct[] = products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name ?? product.supplierName,
      vendor: product.vendor,
      price: decimalToNumber(product.retailPrice),
      image: productImageSrc(product.images[0]),
    }));

    return NextResponse.json({ products: payload });
  } catch (error) {
    console.error("[search/suggest]", error);
    return NextResponse.json({ products: [] satisfies SuggestProduct[] }, { status: 200 });
  }
}
