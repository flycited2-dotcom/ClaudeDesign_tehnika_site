import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createOrUpdateTelegramItpOrder } from "@/lib/itp/orders";

type StockOrderResult = Awaited<ReturnType<typeof createOrUpdateTelegramItpOrder>>;

const globalForOrders = globalThis as typeof globalThis & {
  stockOrderInFlight?: Map<string, Promise<StockOrderResult>>;
};

const inFlight = globalForOrders.stockOrderInFlight ?? new Map<string, Promise<StockOrderResult>>();
globalForOrders.stockOrderInFlight = inFlight;

function errorText(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 1000);
}

async function runIdempotentOrder({
  nonce,
  sku,
  quantity,
  supplierPrice,
}: {
  nonce: string;
  sku: number;
  quantity: number;
  supplierPrice: number;
}): Promise<StockOrderResult> {
  let attempt = await prisma.supplierOrderAttempt.findUnique({ where: { nonce } });

  if (attempt && (attempt.sku !== sku || attempt.quantity !== quantity)) {
    throw new Error("Эта ссылка уже использована с другим количеством. Откройте свежую карточку товара.");
  }

  if (attempt && !attempt.supplierOrderId && attempt.status === "creating") {
    throw new Error("Этот заказ уже обрабатывается. Подождите несколько секунд и проверьте кабинет B2B.");
  }

  if (!attempt) {
    try {
      attempt = await prisma.supplierOrderAttempt.create({
        data: { nonce, sku, quantity, status: "creating" },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      attempt = await prisma.supplierOrderAttempt.findUnique({ where: { nonce } });
      if (!attempt?.supplierOrderId) {
        throw new Error("Этот заказ уже обрабатывается. Подождите несколько секунд и проверьте кабинет B2B.");
      }
    }
  } else if (!attempt.supplierOrderId) {
    attempt = await prisma.supplierOrderAttempt.update({
      where: { nonce },
      data: { status: "creating", error: null },
    });
  }

  try {
    const result = await createOrUpdateTelegramItpOrder({
      sku,
      quantity,
      supplierPrice,
      existingOrderId: attempt.supplierOrderId,
      partnerComment: "Телеграм",
      onOrderResolved: async (order) => {
        await prisma.supplierOrderAttempt.update({
          where: { nonce },
          data: {
            supplierOrderId: order.id,
            status: "order_created",
            error: null,
          },
        });
      },
    });
    await prisma.supplierOrderAttempt.update({
      where: { nonce },
      data: { status: "completed", error: null },
    });
    return result;
  } catch (error) {
    await prisma.supplierOrderAttempt
      .update({
        where: { nonce },
        data: { status: "failed", error: errorText(error) },
      })
      .catch(() => undefined);
    throw error;
  }
}

export async function createIdempotentTelegramStockOrder(input: {
  nonce: string;
  sku: number;
  quantity: number;
  supplierPrice: number;
}): Promise<StockOrderResult> {
  if (!/^[0-9a-f]{8,32}$/i.test(input.nonce)) throw new Error("Некорректный идентификатор заказа.");
  const current = inFlight.get(input.nonce);
  if (current) return current;

  const promise = runIdempotentOrder(input).finally(() => {
    inFlight.delete(input.nonce);
  });
  inFlight.set(input.nonce, promise);
  return promise;
}
