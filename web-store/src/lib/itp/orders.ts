import { itpRpc } from "@/lib/itp/client";
import type { ItpActiveProduct, ItpRpcRequest, ItpRpcResponse } from "@/lib/itp/types";

export type ItpOrder = {
  id: number;
  status: number;
  confirmed?: boolean;
  create_date?: string;
  logistic_center?: number;
  partner_comment?: string;
  sum?: number;
  sum_discount?: number;
  delivery_type?: number;
  delivery_address?: number;
  "list_addresses.address"?: string;
  without_reserve?: boolean;
};

export type ItpOrderItem = {
  id: number;
  doc_id: number;
  sku: number;
  qty: number;
  status?: number;
  client_rezerv?: number;
  price?: number;
  price_discount?: number;
};

export type ItpRpc = <T>(payload: Omit<ItpRpcRequest, "session">) => Promise<ItpRpcResponse<T>>;

type OrdersResponse = {
  orders: ItpOrder[];
  total: number;
};

type OrderItemsResponse = {
  order_items: ItpOrderItem[];
  total: number;
};

type ActiveProductsResponse = {
  products: ItpActiveProduct[];
  total: number;
};

function requireSuccess<T>(response: ItpRpcResponse<T>, fallback: string): T {
  if (!response.success || !response.data) {
    throw new Error(response.message || fallback);
  }
  return response.data;
}

export async function getItpActiveProduct(sku: number, rpc: ItpRpc = itpRpc): Promise<ItpActiveProduct | null> {
  const response = await rpc<ActiveProductsResponse>({
    request: {
      method: "get_active_products",
      model: "client_api",
      module: "platform",
    },
    filter: [{ property: "sku", operator: "=", value: sku }],
  });
  const data = requireSuccess(response, "I-T-P не вернул актуальный остаток товара.");
  return data.products.find((product) => product.sku === sku) ?? null;
}

async function readOrder(orderId: number, rpc: ItpRpc): Promise<ItpOrder | null> {
  const response = await rpc<OrdersResponse>({
    filter: [{ operator: "=", property: "id", value: orderId }],
    pager: { limit: 1, start: 0 },
    request: { method: "read", model: "orders", module: "platform" },
    sort: [{ direction: "DESC", property: "id" }],
  });
  const data = requireSuccess(response, "Не удалось прочитать заказ I-T-P.");
  return data.orders[0] ?? null;
}

async function readOrderItems(orderId: number, rpc: ItpRpc): Promise<ItpOrderItem[]> {
  const response = await rpc<OrderItemsResponse>({
    filter: [{ operator: "=", property: "doc_id", value: orderId }],
    pager: { limit: 5000, start: 0 },
    request: { method: "read", model: "order_items", module: "platform" },
  });
  return requireSuccess(response, "Не удалось прочитать позиции заказа I-T-P.").order_items;
}

function configuredPositiveInteger(name: string): number | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} должен быть положительным целым числом.`);
  }
  return parsed;
}

function configuredDelivery(withoutReserve = false) {
  const logisticCenter = configuredPositiveInteger("STOCK_ORDER_LOGISTIC_CENTER_ID");
  const deliveryAddress = configuredPositiveInteger("STOCK_ORDER_DELIVERY_ADDRESS_ID");
  return {
    logisticCenter,
    deliveryAddress,
    ...(deliveryAddress
      ? {
          delivery_type: 2,
          delivery_address: deliveryAddress,
        }
      : {}),
    ...(logisticCenter ? { logistic_center: logisticCenter } : {}),
    without_reserve: withoutReserve,
  };
}

async function ensureConfiguredDelivery(order: ItpOrder, rpc: ItpRpc, withoutReserve = false): Promise<ItpOrder> {
  const configured = configuredDelivery(withoutReserve);
  const matches =
    (!configured.logisticCenter || order.logistic_center === configured.logisticCenter) &&
    (!configured.deliveryAddress ||
      (order.delivery_type === 2 && order.delivery_address === configured.deliveryAddress)) &&
    Boolean(order.without_reserve) === withoutReserve;
  if (matches) return order;

  const response = await rpc<OrdersResponse>({
    data: [
      {
        id: order.id,
        ...("logistic_center" in configured ? { logistic_center: configured.logistic_center } : {}),
        ...("delivery_type" in configured
          ? {
              delivery_type: configured.delivery_type,
              delivery_address: configured.delivery_address,
            }
          : {}),
        without_reserve: withoutReserve,
      },
    ],
    request: { method: "update", model: "orders", module: "platform" },
  });
  requireSuccess(response, `Не удалось установить доставку для заказа I-T-P №${order.id}.`);
  const verified = await readOrder(order.id, rpc);
  if (!verified) throw new Error(`Не удалось проверить доставку заказа I-T-P №${order.id}.`);
  if (configured.logisticCenter && verified.logistic_center !== configured.logisticCenter) {
    throw new Error(`I-T-P не установил склад для заказа №${order.id}.`);
  }
  if (
    configured.deliveryAddress &&
    (verified.delivery_type !== 2 || verified.delivery_address !== configured.deliveryAddress)
  ) {
    throw new Error(`I-T-P не установил адрес доставки для заказа №${order.id}.`);
  }
  if (Boolean(verified.without_reserve) !== withoutReserve) {
    throw new Error(`I-T-P не установил режим резервирования заказа №${order.id}.`);
  }
  return verified;
}

export async function createOrUpdateTelegramItpOrder({
  sku,
  quantity,
  supplierPrice,
  existingOrderId,
  partnerComment = "Телеграм",
  onOrderResolved,
  rpc = itpRpc,
}: {
  sku: number;
  quantity: number;
  supplierPrice: number;
  existingOrderId?: number | null;
  partnerComment?: string;
  onOrderResolved?: (order: ItpOrder) => Promise<void>;
  rpc?: ItpRpc;
}) {
  const result = await createOrUpdateTelegramItpBatchOrder({
    lines: [{ sku, quantity, supplierPrice }], existingOrderId, partnerComment, onOrderResolved, rpc,
  });
  return { order: result.order, item: result.items[0], created: result.created, duplicatePrevented: result.duplicatePrevented };
}

export type ItpBatchOrderLine = { sku: number; quantity: number; supplierPrice?: number };

export async function getItpActiveProducts(skus: number[], rpc: ItpRpc = itpRpc): Promise<ItpActiveProduct[]> {
  if (!skus.length) return [];
  const response = await rpc<ActiveProductsResponse>({
    request: { method: "get_active_products", model: "client_api", module: "platform" },
    filter: [{ property: "sku", operator: "IN", value: [...new Set(skus)] }],
  });
  return requireSuccess(response, "I-T-P не вернул актуальные остатки.").products;
}

/** Full requested quantities, optionally without reservation. Availability is
 * advisory for file imports; the supplier must still accept every exact line. */
export async function createOrUpdateTelegramItpBatchOrder({
  lines,
  existingOrderId,
  partnerComment = "Телеграм: импорт файла",
  withoutReserve = false,
  onCreateStarted,
  onOrderResolved,
  rpc = itpRpc,
}: {
  lines: ItpBatchOrderLine[];
  existingOrderId?: number | null;
  partnerComment?: string;
  withoutReserve?: boolean;
  onCreateStarted?: () => Promise<void>;
  onOrderResolved?: (order: ItpOrder) => Promise<void>;
  rpc?: ItpRpc;
}) {
  if (!lines.length || lines.length > 500) throw new Error("Заказ должен содержать от 1 до 500 артикулов.");
  const skus = new Set<number>();
  for (const line of lines) {
    if (!Number.isSafeInteger(line.sku) || line.sku <= 0 || !Number.isSafeInteger(line.quantity) || line.quantity <= 0 || line.quantity > 10_000 || skus.has(line.sku)) {
      throw new Error("Некорректный SKU, количество или повтор артикула в заказе.");
    }
    if (line.supplierPrice !== undefined && (!Number.isFinite(line.supplierPrice) || line.supplierPrice <= 0)) throw new Error("Некорректная цена поставщика.");
    skus.add(line.sku);
  }
  const safeComment = partnerComment.replace(/[\r\n]+/g, " ").trim().slice(0, 80) || "Телеграм";
  let order = existingOrderId ? await readOrder(existingOrderId, rpc) : null;
  const created = !existingOrderId;

  if (existingOrderId && !order) {
    throw new Error(`Заказ I-T-P №${existingOrderId} не найден.`);
  }

  if (!order) {
    const delivery = configuredDelivery(withoutReserve);
    await onCreateStarted?.();
    const response = await rpc<OrdersResponse>({
      request: { method: "create", model: "orders", module: "platform" },
      data: [
        {
          partner_comment: safeComment,
          ...("logistic_center" in delivery ? { logistic_center: delivery.logistic_center } : {}),
          ...("delivery_type" in delivery
            ? {
                delivery_type: delivery.delivery_type,
                delivery_address: delivery.delivery_address,
              }
            : {}),
          without_reserve: withoutReserve,
        },
      ],
    });
    const data = requireSuccess(response, "I-T-P не создал заказ.");
    order = data.orders[0] ?? null;
    if (!order?.id) throw new Error("I-T-P вернул успешный ответ без номера заказа.");
  }

  await onOrderResolved?.(order);
  const existingItems = await readOrderItems(order.id, rpc);
  const changed = lines.filter((line) => {
    const existing = existingItems.filter((item) => item.sku === line.sku);
    return existing.length !== 1 || Number(existing[0].qty) !== line.quantity;
  });
  if (order.confirmed && changed.length) {
    throw new Error(`Заказ I-T-P №${order.id} уже подтверждён и не может быть изменён.`);
  }
  // Never change delivery/reservation on an already confirmed order.
  if (!order.confirmed) order = await ensureConfiguredDelivery(order, rpc, withoutReserve);

  if (changed.length) {
    const response = await rpc<OrderItemsResponse>({
      data: {
        doc_id: order.id,
        destroy: [],
        update: changed.map((line) => ({
            sku: line.sku,
            qty: line.quantity,
            ...(line.supplierPrice !== undefined ? { wish_price: line.supplierPrice } : {}),
            wish_price_comment: "Телеграм",
        })),
      },
      request: {
        method: "client_update",
        model: "order_items",
        module: "platform",
      },
    });
    requireSuccess(response, `I-T-P создал заказ №${order.id}, но не добавил все товары.`);
  }

  const verifiedItems = await readOrderItems(order.id, rpc);
  const incomplete = lines.filter((line) => {
    const items = verifiedItems.filter((item) => item.sku === line.sku);
    return items.length !== 1 || Number(items[0].qty) !== line.quantity;
  });
  if (incomplete.length) {
    throw new Error(`Заказ I-T-P №${order.id} заполнен не полностью. Проверьте SKU: ${incomplete.map((line) => line.sku).join(", ")}. Исходные количества не уменьшены.`);
  }

  return {
    order,
    items: lines.map((line) => verifiedItems.find((item) => item.sku === line.sku)!),
    created,
    duplicatePrevented: !created,
  };
}
