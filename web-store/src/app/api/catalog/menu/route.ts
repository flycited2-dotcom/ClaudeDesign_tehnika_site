import { NextResponse } from "next/server";
import { getCatalogMenuLevel } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parent = searchParams.get("parent")?.trim() || "root";
    const categories = await getCatalogMenuLevel(parent);
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[catalog/menu]", error);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}
