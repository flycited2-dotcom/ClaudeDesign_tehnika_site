import { z } from "zod";
import { quoteCart } from "@/lib/orders";

export const dynamic = "force-dynamic";

const schema = z.object({
  items: z.array(
    z.object({
      sku: z.number().int().positive(),
      quantity: z.number().int().positive(),
    }),
  ),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json({ error: "Некорректная корзина." }, { status: 400 });
  }

  try {
    const quote = await quoteCart(parsed.data.items);
    return Response.json(quote);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Не удалось пересчитать корзину." },
      { status: 400 },
    );
  }
}
