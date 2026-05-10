import { NextResponse } from "next/server";
import { decimalToNumber } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { productImageSrc } from "@/lib/product-images";

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

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isVisible: true,
        OR: [
          { name: { contains: rawQuery, mode: "insensitive" } },
          { supplierName: { contains: rawQuery, mode: "insensitive" } },
          { vendor: { contains: rawQuery, mode: "insensitive" } },
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
