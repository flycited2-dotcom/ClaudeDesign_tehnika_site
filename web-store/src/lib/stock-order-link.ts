import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DEFAULT_LINK_TTL_MINUTES = 60;

export type StockOrderLinkToken = {
  sku: number;
  expiresAt: number;
  nonce: string;
  signature: string;
};

function linkSecret(): string {
  const secret = process.env.STOCK_ORDER_LINK_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("STOCK_ORDER_LINK_SECRET должен содержать не менее 32 символов.");
  }
  return secret;
}

function payload({ sku, expiresAt, nonce }: Omit<StockOrderLinkToken, "signature">): string {
  return `${sku}.${expiresAt}.${nonce}`;
}

function sign(unsigned: Omit<StockOrderLinkToken, "signature">): string {
  return createHmac("sha256", linkSecret()).update(payload(unsigned)).digest("base64url");
}

function linkTtlMinutes(): number {
  const raw = process.env.STOCK_ORDER_LINK_TTL_MINUTES;
  const minutes = raw ? Number(raw) : DEFAULT_LINK_TTL_MINUTES;
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error("STOCK_ORDER_LINK_TTL_MINUTES должен быть положительным числом.");
  }
  return minutes;
}

export function createStockOrderLinkToken(sku: number, now = new Date()): StockOrderLinkToken {
  if (!Number.isSafeInteger(sku) || sku <= 0) throw new Error("Некорректный SKU для ссылки заказа.");
  const unsigned = {
    sku,
    expiresAt: Math.floor((now.getTime() + linkTtlMinutes() * 60_000) / 1000),
    nonce: randomBytes(8).toString("hex"),
  };
  return { ...unsigned, signature: sign(unsigned) };
}

export function buildStockOrderLink({ sku, siteUrl, now }: { sku: number; siteUrl: string; now?: Date }): string {
  const token = createStockOrderLinkToken(sku, now);
  const url = new URL(`/stock-order/${sku}`, siteUrl);
  url.searchParams.set("expires", String(token.expiresAt));
  url.searchParams.set("nonce", token.nonce);
  url.searchParams.set("sig", token.signature);
  return url.toString();
}

export function verifyStockOrderLinkToken(
  token: StockOrderLinkToken,
  now = new Date(),
): { valid: boolean; reason?: "invalid" | "expired" } {
  if (
    !Number.isSafeInteger(token.sku) ||
    token.sku <= 0 ||
    !Number.isSafeInteger(token.expiresAt) ||
    token.expiresAt <= 0 ||
    !/^[0-9a-f]{16}$/i.test(token.nonce) ||
    !/^[A-Za-z0-9_-]{43}$/.test(token.signature)
  ) {
    return { valid: false, reason: "invalid" };
  }
  if (token.expiresAt < Math.floor(now.getTime() / 1000)) return { valid: false, reason: "expired" };

  const expected = Buffer.from(sign({ sku: token.sku, expiresAt: token.expiresAt, nonce: token.nonce }), "utf8");
  const provided = Buffer.from(token.signature, "utf8");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return { valid: false, reason: "invalid" };
  }
  return { valid: true };
}
