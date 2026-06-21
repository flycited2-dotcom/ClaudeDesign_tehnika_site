import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import {
  buildProductSearchTokens,
  decimalToNumber,
  productSearchTokenOr,
} from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { productImageSrc } from "@/lib/product-images";
import { normalRetailNameWhere } from "@/lib/retail-products";
import { normalizeSuggestionQuery } from "@/lib/search-suggestions";

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

const getCachedSuggestions = unstable_cache(
  async (query: string): Promise<SuggestProduct[]> => {
    const tokens = buildProductSearchTokens(query);
    if (tokens.length === 0) {
      return [];
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isVisible: true,
        AND: [
          ...tokens.map((token) => productSearchTokenOr(token)),
          normalRetailNameWhere(),
        ],
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

    return products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name ?? product.supplierName,
      vendor: product.vendor,
      price: decimalToNumber(product.retailPrice),
      image: productImageSrc(product.images[0]),
    }));
  },
  ["search-suggest"],
  { revalidate: 300, tags: ["products"] },
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q")?.trim() ?? "";
  const query = normalizeSuggestionQuery(rawQuery);
  if (!query || !process.env.DATABASE_URL) {
    return NextResponse.json({ products: [] satisfies SuggestProduct[] });
  }

  try {
    return NextResponse.json({ products: await getCachedSuggestions(query) });
  } catch (error) {
    console.error("[search/suggest]", error);
    return NextResponse.json({ products: [] satisfies SuggestProduct[] }, { status: 200 });
  }
}
