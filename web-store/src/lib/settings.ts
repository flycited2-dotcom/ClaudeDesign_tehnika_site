import { prisma } from "@/lib/db";

export type StoreSettings = {
  markupPercent: number;
  minMarkupRub: number;
  priceMode: "formula" | "rrp" | "not_below_rrp" | "manual";
  orderCreateEnabled: boolean;
  telegramChatId: string;
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany();
  const settings = new Map(rows.map((row) => [row.key, row.value]));

  return {
    markupPercent: Number(settings.get("ITP_DEFAULT_MARKUP_PERCENT") ?? process.env.ITP_DEFAULT_MARKUP_PERCENT ?? 25),
    minMarkupRub: Number(settings.get("ITP_MIN_PRICE_MARKUP_RUB") ?? process.env.ITP_MIN_PRICE_MARKUP_RUB ?? 300),
    priceMode: (settings.get("PRICE_MODE") as StoreSettings["priceMode"]) ?? "formula",
    orderCreateEnabled:
      (settings.get("ITP_ORDER_CREATE_ENABLED") ?? process.env.ITP_ORDER_CREATE_ENABLED ?? "false") === "true",
    telegramChatId: settings.get("TELEGRAM_MANAGER_CHAT_ID") ?? process.env.TELEGRAM_MANAGER_CHAT_ID ?? "",
  };
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
