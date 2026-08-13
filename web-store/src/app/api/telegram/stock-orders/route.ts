import { timingSafeEqual } from "node:crypto";
import { processStockOrderUpdate, type TelegramUpdate } from "@/lib/stock-order-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secretsMatch(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}

export async function POST(request: Request) {
  if (process.env.STOCK_ORDER_BOT_ENABLED !== "true") {
    return Response.json({ ok: false, error: "disabled" }, { status: 503 });
  }

  const expectedSecret = process.env.STOCK_ORDER_TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("STOCK_ORDER_TELEGRAM_WEBHOOK_SECRET is not configured");
    return Response.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const providedSecret = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!secretsMatch(providedSecret, expectedSecret)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!Number.isSafeInteger(update?.update_id)) {
    return Response.json({ ok: false, error: "invalid_update" }, { status: 400 });
  }

  await processStockOrderUpdate(update);
  return Response.json({ ok: true });
}
