import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createOrUpdateTelegramItpBatchOrder } from "@/lib/itp/orders";
import { MAX_IMPORT_BYTES, parsePurchaseFile, type PurchaseSheet, type ResolvedPurchaseLine } from "@/lib/purchase-import";
import { purchaseAvailability, purchaseReportCsv, resolvePurchaseSheet } from "@/lib/purchase-import-service";
import { escapeTelegramHtml } from "@/lib/telegram";

export type PurchaseDocument = { file_id: string; file_name?: string; file_size?: number };
type ImportMessage = { message_id: number; chat: { id: number; type?: string }; from?: { id: number; is_bot?: boolean }; document?: PurchaseDocument };
type ImportCallback = { id: string; from: { id: number }; data?: string; message?: ImportMessage };
type ImportUpdate = { update_id: number; message?: ImportMessage; callback_query?: ImportCallback };
export type PurchaseImportTransport = {
  botKey: "stock" | "b2b";
  token: () => string;
  allowed: (userId: number, chatId: number) => boolean;
  send: (chatId: number, text: string, options?: Record<string, unknown>) => Promise<unknown>;
  answer: (callbackId: string, text: string) => Promise<unknown>;
};

type StoredImport = NonNullable<Awaited<ReturnType<typeof prisma.telegramPurchaseImport.findUnique>>>;
const asJson = (value: unknown) => value as Prisma.InputJsonValue;

async function telegramRequest<T>(token: string, method: string, body: FormData | Record<string, unknown>): Promise<T> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      ...(body instanceof FormData ? { body } : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await response.json() as { ok: boolean; result?: T };
    if (!response.ok || !data.ok || data.result === undefined) throw new Error("telegram_error");
    return data.result;
  } catch {
    // Fetch errors can contain the token-bearing request URL.
    throw new Error(`Telegram: не удалось выполнить ${method}.`);
  }
}

export async function downloadPurchaseDocument(document: PurchaseDocument, token: string): Promise<Buffer> {
  if (!document.file_name || !/\.(xlsx|csv)$/i.test(document.file_name)) throw new Error("Пришлите Excel .xlsx или CSV в UTF-8.");
  if (document.file_size && document.file_size > MAX_IMPORT_BYTES) throw new Error("Размер файла должен быть не более 5 МБ.");
  const file = await telegramRequest<{ file_path?: string; file_size?: number }>(token, "getFile", { file_id: document.file_id });
  if (!file.file_path || !/^[\w/.-]+$/.test(file.file_path) || file.file_path.split("/").includes("..")) throw new Error("Telegram не вернул путь файла.");
  if (file.file_size && file.file_size > MAX_IMPORT_BYTES) throw new Error("Размер файла должен быть не более 5 МБ.");
  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`, { signal: AbortSignal.timeout(30_000) });
  } catch {
    throw new Error("Не удалось скачать файл из Telegram.");
  }
  if (!response.ok || !response.body) throw new Error("Не удалось скачать файл из Telegram.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_IMPORT_BYTES) {
        await reader.cancel();
        throw new Error("Размер файла должен быть не более 5 МБ.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

function keyboard(rows: Array<Array<{ text: string; callback_data: string }>>) {
  return { reply_markup: { inline_keyboard: rows } };
}

async function sendSheetChoice(record: StoredImport, transport: PurchaseImportTransport): Promise<void> {
  const sheets = record.sheets as unknown as PurchaseSheet[];
  await transport.send(Number(record.chatId), [
    `<b>${escapeTelegramHtml(record.fileName)}</b>`,
    "Выберите один лист для заказа. Листы никогда не суммируются между собой.",
    ...sheets.map((sheet, index) => `${index + 1}. ${escapeTelegramHtml(sheet.name)}: ${sheet.rows.length} строк${sheet.errors.length ? `, ошибок: ${sheet.errors.length}` : ""}`),
  ].join("\n"), keyboard(sheets.map((sheet, index) => [{
    text: `${index + 1}. ${sheet.name}`.slice(0, 60), callback_data: `buy:s:${record.id}:${index}`,
  }])));
}

async function sendReport(record: StoredImport, lines: ResolvedPurchaseLine[], transport: PurchaseImportTransport): Promise<void> {
  const availability = await purchaseAvailability(lines);
  const report = purchaseReportCsv(lines, availability.products, availability.error);
  const form = new FormData();
  form.set("chat_id", record.chatId);
  form.set("document", new Blob([new Uint8Array(report)], { type: "text/csv;charset=utf-8" }), "proverka-zakaza.csv");
  await telegramRequest(transport.token(), "sendDocument", form);
  await transport.send(Number(record.chatId), [
    `<b>Заказ из файла: ${lines.length} артикулов</b>`,
    `Всего: ${lines.reduce((sum, line) => sum + line.quantity, 0)} шт.`,
    `Лист: ${escapeTelegramHtml((record.sheets as unknown as PurchaseSheet[])[record.selectedSheet!].name)}`,
    availability.error || "Текущие цены и остатки — в приложенном отчёте. Пустое точное количество означает, что API его не сообщил.",
    "Все позиции будут переданы в полном количестве, независимо от остатка и кратности. Если B2B отклонит позицию, я сообщу об этом.",
    "Заказ создаётся без резервирования и подтверждения отгрузки. Доработать его можно в портале B2B.",
  ].join("\n"), keyboard([[{ text: "Создать весь заказ B2B", callback_data: `buy:c:${record.id}:${record.selectedSheet}` }]]));
}

async function chooseSheet(record: StoredImport, index: number, transport: PurchaseImportTransport): Promise<void> {
  const sheets = record.sheets as unknown as PurchaseSheet[];
  if (!Number.isInteger(index) || !sheets[index]) throw new Error("Лист не найден.");
  const claimed = await prisma.telegramPurchaseImport.updateMany({
    where: { id: record.id, status: { in: ["uploaded", "ready"] }, supplierOrderId: null, updatedAt: record.updatedAt },
    data: { status: "checking" },
  });
  if (!claimed.count) throw new Error("Этот импорт уже обрабатывается или заказ создан.");
  try {
    const lines = await resolvePurchaseSheet(sheets[index]);
    const ready = await prisma.telegramPurchaseImport.update({
      where: { id: record.id }, data: { selectedSheet: index, lines: asJson(lines), status: "ready", error: null },
    });
    await sendReport(ready, lines, transport);
  } catch (error) {
    await prisma.telegramPurchaseImport.updateMany({ where: { id: record.id, status: "checking" }, data: { status: "uploaded" } });
    throw error;
  }
}

async function createPurchaseOrder(record: StoredImport, transport: PurchaseImportTransport): Promise<void> {
  const chatId = Number(record.chatId);
  if (record.status === "completed") {
    await transport.send(chatId, `Заказ B2B <b>№${record.supplierOrderId}</b> уже создан. Повторный заказ не создавался.`);
    return;
  }
  if (["creating", "uncertain"].includes(record.status)) {
    await transport.send(chatId, "Создание уже начато, но результат ещё не подтверждён. Проверьте портал B2B перед повторной загрузкой файла: автоматически создавать второй заказ я не буду.");
    return;
  }
  const claimed = await prisma.telegramPurchaseImport.updateMany({
    where: { id: record.id, status: { in: ["ready", "failed", "order_created"] }, selectedSheet: record.selectedSheet, updatedAt: record.updatedAt },
    data: { status: "creating", error: null },
  });
  if (!claimed.count) throw new Error("Импорт уже обрабатывается. Сначала выберите лист и получите отчёт.");
  const lines = record.lines as unknown as ResolvedPurchaseLine[];
  let orderId = record.supplierOrderId;
  let createRequested = false;
  try {
    if (!Array.isArray(lines) || !lines.length) throw new Error("Не выбран список товаров.");
    const availability = await purchaseAvailability(lines);
    const activeBySku = new Map(availability.products.map((product) => [product.sku, product]));
    const result = await createOrUpdateTelegramItpBatchOrder({
      lines: lines.map((line) => {
        const price = activeBySku.get(line.sku)?.price;
        return { sku: line.sku, quantity: line.quantity, ...(price && Number.isFinite(price) && price > 0 ? { supplierPrice: price } : {}) };
      }),
      existingOrderId: orderId,
      withoutReserve: true,
      partnerComment: `Телеграм: ${record.fileName}`,
      onCreateStarted: async () => { createRequested = true; },
      onOrderResolved: async (order) => {
        orderId = order.id;
        // Keep the processing lock until the entire external operation ends.
        await prisma.telegramPurchaseImport.update({ where: { id: record.id }, data: { supplierOrderId: order.id } });
      },
    });
    await prisma.telegramPurchaseImport.update({ where: { id: record.id }, data: { status: "completed", supplierOrderId: result.order.id } });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Ошибка поставщика.";
    await prisma.telegramPurchaseImport.update({
      where: { id: record.id },
      data: { status: orderId ? "order_created" : createRequested ? "uncertain" : "failed", supplierOrderId: orderId, error: text.slice(0, 2000) },
    });
    await transport.send(chatId, [
      orderId ? `<b>Заказ B2B №${orderId} создан, заполнение не завершено.</b>` : "<b>Полный заказ не подтверждён.</b>",
      escapeTelegramHtml(text.slice(0, 1800)),
      orderId ? "Исходные количества сохранены. Проверьте заказ в портале или повторите заполнение этого же заказа." : createRequested ? "Ответ о создании потерян. Проверьте портал B2B. Новый заказ автоматически не создаётся." : "Можно повторить попытку этой же кнопкой.",
    ].join("\n"), orderId || !createRequested ? keyboard([[{ text: orderId ? "Повторить заполнение этого заказа" : "Повторить", callback_data: `buy:c:${record.id}:${record.selectedSheet}` }]]) : undefined);
    return;
  }
  // A Telegram delivery failure must not turn a completed supplier order into
  // a failed attempt. A later click just returns its persisted order number.
  await transport.send(chatId, `<b>Заказ B2B №${orderId} заполнен.</b>\nАртикулов: ${lines.length}, единиц: ${lines.reduce((sum, line) => sum + line.quantity, 0)}. Все количества проверены по ответу B2B.\nБез резервирования и подтверждения отгрузки. Завершите оформление в портале B2B.`);
}

/** Called before ordinary text/single-product handlers in both existing bots. */
export async function processPurchaseImport(update: ImportUpdate, transport: PurchaseImportTransport): Promise<boolean> {
  const query = update.callback_query;
  const isCallback = Boolean(query?.data?.startsWith("buy:"));
  const message = query?.message ?? update.message;
  if (!isCallback && !update.message?.document) return false;
  const user = query?.from ?? message?.from;
  if (!message || !user || ("is_bot" in user && user.is_bot) || !transport.allowed(user.id, message.chat.id)) {
    if (query) await transport.answer(query.id, "У вас нет доступа к этому импорту.");
    return true;
  }
  try {
    if (isCallback && query) {
      await transport.answer(query.id, "Обрабатываю…");
      const match = query.data?.match(/^buy:([sc]):([0-9a-f]{12}):(\d{1,2})$/);
      if (!match) throw new Error("Некорректная кнопка импорта.");
      const record = await prisma.telegramPurchaseImport.findUnique({ where: { id: match[2] } });
      if (!record || record.botKey !== transport.botKey || record.telegramUserId !== String(user.id) || record.chatId !== String(message.chat.id)) throw new Error("Этот импорт недоступен.");
      if (match[1] === "c" && record.selectedSheet !== Number(match[3])) throw new Error("Выбран другой лист. Используйте кнопку под его отчётом.");
      // Completed/uncertain order IDs remain recoverable after expiry; expiry
      // only prevents starting a new external operation from an old button.
      if (match[1] === "c" && ["completed", "creating", "uncertain"].includes(record.status)) {
        await createPurchaseOrder(record, transport);
      } else {
        if (record.expiresAt.getTime() < Date.now()) throw new Error("Импорт устарел. Проверьте прежний заказ в B2B перед повторной загрузкой файла.");
        if (match[1] === "s") await chooseSheet(record, Number(match[3]), transport);
        else await createPurchaseOrder(record, transport);
      }
      return true;
    }
    const document = update.message!.document!;
    const sourceKey = `${transport.botKey}:${update.update_id}`;
    let record = await prisma.telegramPurchaseImport.findUnique({ where: { sourceKey } });
    if (!record) {
      const bytes = await downloadPurchaseDocument(document, transport.token());
      let sheets: PurchaseSheet[];
      try { sheets = await parsePurchaseFile(bytes, document.file_name!); }
      catch (error) { throw new Error(`Не удалось прочитать таблицу. ${error instanceof Error ? error.message.slice(0, 700) : "Проверьте формат файла."}`); }
      record = await prisma.telegramPurchaseImport.upsert({
        where: { sourceKey }, update: {},
        create: {
          id: randomBytes(6).toString("hex"), sourceKey, botKey: transport.botKey,
          telegramUserId: String(user.id), chatId: String(message.chat.id),
          fileName: document.file_name!.slice(0, 250), sheets: asJson(sheets),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }
    if (record.telegramUserId !== String(user.id) || record.chatId !== String(message.chat.id) || record.botKey !== transport.botKey) throw new Error("Этот импорт недоступен.");
    // Redelivered Telegram updates reuse the same import, even after restart.
    if (record.status === "uploaded") {
      const sheets = record.sheets as unknown as PurchaseSheet[];
      if (sheets.length === 1) await chooseSheet(record, 0, transport);
      else await sendSheetChoice(record, transport);
    } else if (record.status === "ready") {
      await sendReport(record, record.lines as unknown as ResolvedPurchaseLine[], transport);
    } else {
      await transport.send(message.chat.id, record.supplierOrderId ? `Этот файл уже обрабатывался. Заказ B2B <b>№${record.supplierOrderId}</b>. Проверьте его в портале.` : "Этот файл уже обрабатывается. Новый заказ не создан.");
    }
  } catch (error) {
    await transport.send(message.chat.id, escapeTelegramHtml(error instanceof Error ? error.message.slice(0, 3000) : "Не удалось обработать импорт."));
  }
  return true;
}
