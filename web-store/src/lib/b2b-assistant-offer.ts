import { createHmac, timingSafeEqual } from "node:crypto";

const OFFER_PREFIX = "offer_";
const MARKUP_CALLBACK_PREFIX = "b2ba:m:";
const CUSTOM_MARKUP_CALLBACK_PREFIX = "b2ba:u:";
const DEFAULT_OFFER_TTL_MINUTES = 24 * 60;

export type ClientOffer = {
  sku: number;
  priceCents: number;
  expiresAt: number;
};

function toBase36(value: number): string {
  return Math.trunc(value).toString(36);
}

function fromBase36(value: string): number {
  if (!/^[0-9a-z]+$/i.test(value)) return Number.NaN;
  return Number.parseInt(value, 36);
}

function configuredSecret(): string {
  const secret = process.env.B2B_ASSISTANT_OFFER_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("B2B_ASSISTANT_OFFER_SECRET должен содержать не менее 32 символов.");
  }
  return secret;
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url").slice(0, 22);
}

function offerTtlMinutes(): number {
  const raw = process.env.B2B_ASSISTANT_OFFER_TTL_MINUTES;
  const value = raw ? Number(raw) : DEFAULT_OFFER_TTL_MINUTES;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("B2B_ASSISTANT_OFFER_TTL_MINUTES должен быть положительным числом.");
  }
  return value;
}

export function calculateClientPrice(
  supplierPrice: number,
  markupPercent: number,
  roundingStep = 100,
): number {
  if (!Number.isFinite(supplierPrice) || supplierPrice <= 0) return 0;
  if (!Number.isFinite(markupPercent) || markupPercent < 0 || markupPercent > 1_000) return 0;
  if (!Number.isFinite(roundingStep) || roundingStep <= 0) return 0;

  return Math.ceil((supplierPrice * (1 + markupPercent / 100)) / roundingStep) * roundingStep;
}

export function buildMarkupCallback(sku: number, markupPercent: number): string {
  if (!Number.isSafeInteger(sku) || sku <= 0) throw new Error("Некорректный SKU.");
  const basisPoints = Math.round(markupPercent * 100);
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0 || basisPoints > 100_000) {
    throw new Error("Некорректная наценка.");
  }
  return `${MARKUP_CALLBACK_PREFIX}${toBase36(sku)}:${toBase36(basisPoints)}`;
}

export function parseMarkupCallback(value: string | undefined): { sku: number; markupPercent: number } | null {
  if (!value?.startsWith(MARKUP_CALLBACK_PREFIX)) return null;
  const [encodedSku, encodedBasisPoints] = value.slice(MARKUP_CALLBACK_PREFIX.length).split(":");
  const sku = fromBase36(encodedSku || "");
  const basisPoints = fromBase36(encodedBasisPoints || "");
  if (
    !Number.isSafeInteger(sku) ||
    sku <= 0 ||
    !Number.isSafeInteger(basisPoints) ||
    basisPoints < 0 ||
    basisPoints > 100_000
  ) {
    return null;
  }
  return { sku, markupPercent: basisPoints / 100 };
}

export function buildCustomMarkupCallback(sku: number): string {
  if (!Number.isSafeInteger(sku) || sku <= 0) throw new Error("Некорректный SKU.");
  return `${CUSTOM_MARKUP_CALLBACK_PREFIX}${toBase36(sku)}`;
}

export function parseCustomMarkupCallback(value: string | undefined): number | null {
  if (!value?.startsWith(CUSTOM_MARKUP_CALLBACK_PREFIX)) return null;
  const sku = fromBase36(value.slice(CUSTOM_MARKUP_CALLBACK_PREFIX.length));
  return Number.isSafeInteger(sku) && sku > 0 ? sku : null;
}

export function parseCustomMarkupPercent(value: string | undefined): number | null {
  const normalized = value?.trim().replace(",", ".") ?? "";
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const markupPercent = Number(normalized);
  return Number.isFinite(markupPercent) && markupPercent >= 0 && markupPercent <= 1_000
    ? markupPercent
    : null;
}

export function createClientOfferQuery({
  sku,
  price,
  now = new Date(),
  secret = configuredSecret(),
}: {
  sku: number;
  price: number;
  now?: Date;
  secret?: string;
}): string {
  const priceCents = Math.round(price * 100);
  if (!Number.isSafeInteger(sku) || sku <= 0 || !Number.isSafeInteger(priceCents) || priceCents <= 0) {
    throw new Error("Некорректные данные клиентского предложения.");
  }
  const expiresAt = Math.floor((now.getTime() + offerTtlMinutes() * 60_000) / 1000);
  const payload = [toBase36(sku), toBase36(priceCents), toBase36(expiresAt)].join(".");
  return `${OFFER_PREFIX}${payload}.${signature(payload, secret)}`;
}

export function parseClientOfferQuery(
  query: string,
  { now = new Date(), secret = configuredSecret() }: { now?: Date; secret?: string } = {},
): { offer: ClientOffer | null; reason?: "invalid" | "expired" } {
  if (!query.startsWith(OFFER_PREFIX)) return { offer: null, reason: "invalid" };
  const parts = query.slice(OFFER_PREFIX.length).split(".");
  if (parts.length !== 4) return { offer: null, reason: "invalid" };

  const [encodedSku, encodedPrice, encodedExpiry, providedSignature] = parts;
  const payload = [encodedSku, encodedPrice, encodedExpiry].join(".");
  const expected = Buffer.from(signature(payload, secret), "utf8");
  const provided = Buffer.from(providedSignature, "utf8");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return { offer: null, reason: "invalid" };
  }

  const sku = fromBase36(encodedSku);
  const priceCents = fromBase36(encodedPrice);
  const expiresAt = fromBase36(encodedExpiry);
  if (
    !Number.isSafeInteger(sku) ||
    sku <= 0 ||
    !Number.isSafeInteger(priceCents) ||
    priceCents <= 0 ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= 0
  ) {
    return { offer: null, reason: "invalid" };
  }
  if (expiresAt < Math.floor(now.getTime() / 1000)) return { offer: null, reason: "expired" };

  return { offer: { sku, priceCents, expiresAt } };
}
