import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { buildShortClientOfferCode } from "@/lib/b2b-assistant-offer";
import { prisma } from "@/lib/db";

const PAGINATION_CALLBACK_PREFIX = "b2ba:p:";
const SESSION_TTL_MINUTES = 60;
const CREATE_ATTEMPTS = 8;

export function buildSearchPageCallback(code: string, offset: number): string {
  const normalizedCode = code.trim().toUpperCase();
  if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(normalizedCode)) {
    throw new Error("Некорректный код поисковой сессии.");
  }
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100_000) {
    throw new Error("Некорректное смещение страницы.");
  }
  return `${PAGINATION_CALLBACK_PREFIX}${normalizedCode}:${offset.toString(36)}`;
}

export function parseSearchPageCallback(value: string | undefined): { code: string; offset: number } | null {
  if (!value?.startsWith(PAGINATION_CALLBACK_PREFIX)) return null;
  const [rawCode, rawOffset] = value.slice(PAGINATION_CALLBACK_PREFIX.length).split(":");
  const code = rawCode?.trim().toUpperCase() ?? "";
  const offset = /^[0-9a-z]+$/i.test(rawOffset || "") ? Number.parseInt(rawOffset, 36) : Number.NaN;
  if (
    !/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(code) ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > 100_000
  ) {
    return null;
  }
  return { code, offset };
}

export async function createSearchSession({
  query,
  telegramUserId,
  now = new Date(),
}: {
  query: string;
  telegramUserId: number;
  now?: Date;
}): Promise<string> {
  const normalizedQuery = query.replace(/\s+/g, " ").trim().slice(0, 500);
  if (normalizedQuery.length < 2 || !Number.isSafeInteger(telegramUserId) || telegramUserId <= 0) {
    throw new Error("Некорректные данные поисковой сессии.");
  }
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MINUTES * 60_000);
  await prisma.telegramSearchSession.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => undefined);

  for (let attempt = 0; attempt < CREATE_ATTEMPTS; attempt += 1) {
    const code = buildShortClientOfferCode((max) => randomInt(max));
    try {
      await prisma.telegramSearchSession.create({
        data: { code, query: normalizedQuery, telegramUserId: String(telegramUserId), expiresAt },
      });
      return code;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    }
  }
  throw new Error("Не удалось создать поисковую сессию.");
}

export async function resolveSearchSession(
  code: string,
  telegramUserId: number,
  now = new Date(),
): Promise<{ query: string | null; reason?: "invalid" | "expired" | "forbidden" }> {
  const stored = await prisma.telegramSearchSession.findUnique({ where: { code: code.toUpperCase() } });
  if (!stored) return { query: null, reason: "invalid" };
  if (stored.telegramUserId !== String(telegramUserId)) return { query: null, reason: "forbidden" };
  if (stored.expiresAt.getTime() < now.getTime()) {
    await prisma.telegramSearchSession.delete({ where: { code: stored.code } }).catch(() => undefined);
    return { query: null, reason: "expired" };
  }
  return { query: stored.query };
}
