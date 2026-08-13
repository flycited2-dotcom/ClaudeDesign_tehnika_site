import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  buildShortClientOfferCode,
  clientOfferExpiresAt,
  isShortClientOfferQuery,
  type ClientOffer,
} from "@/lib/b2b-assistant-offer";

const CREATE_ATTEMPTS = 8;

export type StoredClientOfferResult = {
  matched: boolean;
  offer: ClientOffer | null;
  reason?: "invalid" | "expired" | "forbidden";
};

export async function createShortClientOffer({
  sku,
  price,
  telegramUserId,
  now = new Date(),
}: {
  sku: number;
  price: number;
  telegramUserId: number;
  now?: Date;
}): Promise<{ code: string; offer: ClientOffer }> {
  const priceCents = Math.round(price * 100);
  if (
    !Number.isSafeInteger(sku) ||
    sku <= 0 ||
    !Number.isSafeInteger(priceCents) ||
    priceCents <= 0 ||
    !Number.isSafeInteger(telegramUserId) ||
    telegramUserId <= 0
  ) {
    throw new Error("Некорректные данные клиентского предложения.");
  }

  const expiresAt = clientOfferExpiresAt(now);
  await prisma.telegramClientOffer.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => undefined);
  for (let attempt = 0; attempt < CREATE_ATTEMPTS; attempt += 1) {
    const code = buildShortClientOfferCode((max) => randomInt(max));
    try {
      await prisma.telegramClientOffer.create({
        data: {
          code,
          sku,
          priceCents,
          telegramUserId: String(telegramUserId),
          expiresAt,
        },
      });
      return {
        code,
        offer: { sku, priceCents, expiresAt: Math.floor(expiresAt.getTime() / 1000) },
      };
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    }
  }
  throw new Error("Не удалось создать уникальный короткий код предложения.");
}

export async function resolveShortClientOffer(
  rawQuery: string,
  telegramUserId: number,
  now = new Date(),
): Promise<StoredClientOfferResult> {
  const code = rawQuery.trim().toUpperCase();
  if (!isShortClientOfferQuery(code)) return { matched: false, offer: null };

  const stored = await prisma.telegramClientOffer.findUnique({ where: { code } });
  // A six-character product model may look like a code. If no record exists,
  // let the normal catalog search handle the text.
  if (!stored) return { matched: false, offer: null, reason: "invalid" };
  if (stored.telegramUserId !== String(telegramUserId)) {
    return { matched: true, offer: null, reason: "forbidden" };
  }
  if (stored.expiresAt.getTime() < now.getTime()) {
    await prisma.telegramClientOffer.delete({ where: { code } }).catch(() => undefined);
    return { matched: true, offer: null, reason: "expired" };
  }

  return {
    matched: true,
    offer: {
      sku: stored.sku,
      priceCents: stored.priceCents,
      expiresAt: Math.floor(stored.expiresAt.getTime() / 1000),
    },
  };
}
