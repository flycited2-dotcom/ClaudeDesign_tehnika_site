import { NextResponse } from "next/server";
import {
  buildVkShareUrl,
  getVkShareProduct,
} from "@/lib/vk-share-products";

type Context = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: Context) {
  const { slug } = await params;
  const product = getVkShareProduct(slug);

  if (!product) {
    return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
  }

  return NextResponse.redirect(buildVkShareUrl(product), 307);
}
