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
    // Only expose what the cart UI needs. The internal quote carries
    // supplierPrice and productId — never leak the supplier cost to clients.
    return Response.json({
      items: quote.items.map((item) => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        multiplicity: item.multiplicity,
      })),
      total: quote.total,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Не удалось пересчитать корзину." },
      { status: 400 },
    );
  }
}
