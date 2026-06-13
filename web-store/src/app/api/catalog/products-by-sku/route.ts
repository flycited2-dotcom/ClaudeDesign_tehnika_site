import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_SKU_COUNT = 32;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("sku") ?? "";
    const skus = raw
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value) && value > 0)
      .slice(0, MAX_SKU_COUNT);
    if (!skus.length || !process.env.DATABASE_URL) {
      return NextResponse.json({ products: [] });
    }

    const rows = await prisma.product.findMany({
      where: {
        sku: { in: skus },
        isActive: true,
        isVisible: true,
      },
      include: {
        images: {
          where: { deleted: false },
          orderBy: { priority: "asc" },
          take: 1,
        },
        attributes: {
          where: { source: { in: ["manual", "name"] } },
          orderBy: [{ key: "asc" }, { value: "asc" }],
        },
      },
    });

    // Public endpoint (favorites/compare): strip internal pricing fields so the
    // supplier cost and manual price never reach the client. The product card
    // renders from retailPrice/rrp only.
    const products = rows.map((row) => {
      const sanitized: Record<string, unknown> = { ...row };
      delete sanitized.supplierPrice;
      delete sanitized.manualPrice;
      return sanitized;
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[products-by-sku]", error);
    return NextResponse.json({ products: [] }, { status: 200 });
  }
}
