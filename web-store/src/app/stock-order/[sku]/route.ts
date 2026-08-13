import { prisma } from "@/lib/db";
import { getItpActiveProduct } from "@/lib/itp/orders";
import { activeProductIsAvailable, compactStockProductName, supplierQtyLabel } from "@/lib/stock-monitor";
import { verifyStockOrderLinkToken, type StockOrderLinkToken } from "@/lib/stock-order-link";
import { createIdempotentTelegramStockOrder } from "@/lib/stock-order-service";
import { stockOrderTelegramChatUrl } from "@/lib/telegram-chat-link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ sku: string }> };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatRub(value: number): string {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value)} ₽`;
}

function telegramReturnButton(): string {
  const chatUrl = stockOrderTelegramChatUrl();
  return chatUrl
    ? `<a class="button secondary" href="${escapeHtml(chatUrl)}">Вернуться в чат остатков</a>`
    : "";
}

function htmlPage(title: string, content: string, status = 200): Response {
  return new Response(
    `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root{color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#eef3fb;color:#17223b}
    *{box-sizing:border-box}body{margin:0;padding:20px;min-height:100vh;display:grid;place-items:center}
    main{width:min(520px,100%);background:#fff;border:1px solid #dbe4f3;border-radius:24px;padding:24px;box-shadow:0 18px 50px #203b6c1c}
    h1{font-size:24px;line-height:1.2;margin:0 0 10px}.muted{color:#66738d}.product{font-size:19px;font-weight:750;line-height:1.35;margin:20px 0 8px}
    .grid{display:grid;grid-template-columns:1fr auto;gap:10px 16px;margin:18px 0;padding:16px;border-radius:16px;background:#f5f8fd}.grid b{text-align:right}
    label{display:block;font-weight:700;margin:18px 0 8px}input{width:100%;height:56px;border:2px solid #ccd8eb;border-radius:14px;padding:0 16px;font-size:22px;font-weight:700;outline:none}
    input:focus{border-color:#3478f6;box-shadow:0 0 0 4px #3478f61c}button,.button{display:flex;width:100%;height:56px;margin-top:14px;border:0;border-radius:14px;align-items:center;justify-content:center;background:#2575ed;color:#fff;font-size:17px;font-weight:800;text-decoration:none;cursor:pointer}
    button:disabled{opacity:.65}.secondary{background:#edf3fc;color:#31527e}.warning{margin-top:16px;padding:13px 14px;background:#fff6db;border-radius:13px;color:#6e5713;font-size:14px;line-height:1.4}.success{font-size:56px;text-align:center}.error{font-size:48px;text-align:center}.center{text-align:center}
  </style>
</head>
<body><main>${content}</main></body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}

function errorPage(message: string, status = 400): Response {
  return htmlPage(
    "Заказ B2B не создан",
    `<div class="error">⚠️</div><h1 class="center">Заказ не создан</h1><p class="muted center">${escapeHtml(message)}</p>${telegramReturnButton()}`,
    status,
  );
}

function parseSku(value: string): number | null {
  const sku = Number(value);
  return Number.isSafeInteger(sku) && sku > 0 ? sku : null;
}

function tokenFromValues({
  sku,
  expires,
  nonce,
  signature,
}: {
  sku: number;
  expires: string | null;
  nonce: string | null;
  signature: string | null;
}): StockOrderLinkToken {
  return {
    sku,
    expiresAt: Number(expires),
    nonce: nonce ?? "",
    signature: signature ?? "",
  };
}

function tokenError(token: StockOrderLinkToken): string | null {
  const verified = verifyStockOrderLinkToken(token);
  if (verified.valid) return null;
  return verified.reason === "expired"
    ? "Ссылка устарела. Откройте самую свежую карточку товара в Telegram."
    : "Ссылка повреждена или не прошла проверку безопасности.";
}

export async function GET(request: Request, { params }: RouteParams) {
  const { sku: rawSku } = await params;
  const sku = parseSku(rawSku);
  if (!sku) return errorPage("Некорректный SKU товара.");
  const url = new URL(request.url);
  const token = tokenFromValues({
    sku,
    expires: url.searchParams.get("expires"),
    nonce: url.searchParams.get("nonce"),
    signature: url.searchParams.get("sig"),
  });
  const error = tokenError(token);
  if (error) return errorPage(error, 403);

  const product = await prisma.product.findUnique({
    where: { sku },
    select: {
      name: true,
      supplierName: true,
      part: true,
      supplierPrice: true,
      multiplicity: true,
      stockStatus: true,
    },
  });
  if (!product) return errorPage("Товар не найден в локальном каталоге.", 404);
  const name = compactStockProductName(product.name || product.supplierName, product.part);
  const price = product.supplierPrice ? Number(product.supplierPrice) : null;
  const multiplicity = Math.max(1, product.multiplicity || 1);
  const deliveryAddress = process.env.STOCK_ORDER_DELIVERY_ADDRESS_LABEL;

  return htmlPage(
    `Заказать ${name}`,
    `<h1>🛒 Заказ в B2B</h1>
     <p class="muted">Перед отправкой проверьте товар и укажите количество.</p>
     <div class="product">${escapeHtml(name)}</div>
     <div class="grid">
       <span>SKU</span><b>${sku}</b>
       ${product.part ? `<span>Артикул</span><b>${escapeHtml(product.part)}</b>` : ""}
       <span>Цена в карточке</span><b>${price ? escapeHtml(formatRub(price)) : "уточняется"}</b>
       <span>Кратность</span><b>${multiplicity} шт.</b>
       ${deliveryAddress ? `<span>Доставка</span><b>${escapeHtml(deliveryAddress)}</b>` : ""}
       <span>Склад</span><b>Крым</b>
     </div>
     <form method="post" action="/stock-order/${sku}" onsubmit="const b=this.querySelector('button');b.disabled=true;b.textContent='Создаю заказ…'">
       <input type="hidden" name="expires" value="${token.expiresAt}">
       <input type="hidden" name="nonce" value="${escapeHtml(token.nonce)}">
       <input type="hidden" name="sig" value="${escapeHtml(token.signature)}">
       <label for="quantity">Количество, шт.</label>
       <input id="quantity" name="quantity" type="number" inputmode="numeric" min="${multiplicity}" step="${multiplicity}" value="${multiplicity}" required autofocus>
       <button type="submit">Заказать в B2B</button>
     </form>
     <div class="warning">Заказ будет создан у поставщика, но останется <b>не подтверждённым на отгрузку</b>. Повторная отправка этой формы не создаст дубль.</div>`,
  );
}

function exactAvailableQuantity(product: { real_qty?: number; nearest_logistic_center_real_qty?: number }): number | null {
  const values = [product.real_qty, product.nearest_logistic_center_real_qty].filter(
    (value): value is number => Number.isFinite(value) && Number(value) > 0,
  );
  return values.length > 0 ? Math.max(...values) : null;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { sku: rawSku } = await params;
  const sku = parseSku(rawSku);
  if (!sku) return errorPage("Некорректный SKU товара.");
  const form = await request.formData();
  const token = tokenFromValues({
    sku,
    expires: String(form.get("expires") ?? ""),
    nonce: String(form.get("nonce") ?? ""),
    signature: String(form.get("sig") ?? ""),
  });
  const error = tokenError(token);
  if (error) return errorPage(error, 403);

  const quantity = Number(form.get("quantity"));
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 10_000) {
    return errorPage("Количество должно быть целым числом от 1 до 10 000.");
  }

  try {
    const active = await getItpActiveProduct(sku);
    if (!active || !activeProductIsAvailable(active)) {
      return errorPage("Товар уже закончился у поставщика. Заказ не создан.", 409);
    }
    const multiplicity = Math.max(1, Number(active.multiplicity) || 1);
    if (quantity % multiplicity !== 0) {
      return errorPage(`Товар заказывается с кратностью ${multiplicity}. Укажите количество, кратное ${multiplicity}.`);
    }
    const exact = exactAvailableQuantity(active);
    if (exact !== null && quantity > exact) {
      return errorPage(`Запрошено ${quantity} шт., а актуальный остаток — ${exact} шт.`);
    }
    if (!Number.isFinite(active.price) || active.price <= 0) {
      return errorPage("Поставщик вернул некорректную цену. Заказ не создан.", 502);
    }

    const result = await createIdempotentTelegramStockOrder({
      sku,
      quantity,
      supplierPrice: active.price,
      nonce: token.nonce,
    });
    const product = await prisma.product.findUnique({
      where: { sku },
      select: { name: true, supplierName: true, part: true },
    });
    const name = compactStockProductName(product?.name || product?.supplierName || `Товар SKU ${sku}`, product?.part);
    const stockLabel = exact !== null ? `${exact} шт.` : supplierQtyLabel(active.qty);

    return htmlPage(
      `Заказ №${result.order.id} создан`,
      `<div class="success">✅</div>
       <h1 class="center">Заказ создан</h1>
       <p class="muted center">Заказ B2B №${result.order.id}</p>
       <div class="product">${escapeHtml(name)}</div>
       <div class="grid">
         <span>SKU</span><b>${sku}</b>
         <span>Количество</span><b>${quantity} шт.</b>
         <span>Цена</span><b>${escapeHtml(formatRub(active.price))}</b>
         <span>Сумма</span><b>${escapeHtml(formatRub(active.price * quantity))}</b>
         <span>Остаток до заказа</span><b>${escapeHtml(stockLabel)}</b>
         <span>Доставка</span><b>${escapeHtml(process.env.STOCK_ORDER_DELIVERY_ADDRESS_LABEL || "адрес из карточки клиента")}</b>
         <span>Склад</span><b>Крым</b>
       </div>
       <div class="warning">Заказ создан, но <b>не подтверждён на отгрузку</b>. Проверьте его в кабинете поставщика.</div>
       <a class="button" href="${escapeHtml(process.env.STOCK_MONITOR_B2B_URL ?? process.env.ITP_API_BASE_URL ?? "https://b2b.i-t-p.pro")}">Открыть кабинет B2B</a>
       ${telegramReturnButton()}`,
    );
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Неизвестная ошибка I-T-P.";
    return errorPage(message, 502);
  }
}
