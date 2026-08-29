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

function configuredDelivery() {
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
    without_reserve: false,
  };
}

async function ensureConfiguredDelivery(order: ItpOrder, rpc: ItpRpc): Promise<ItpOrder> {
  const configured = configuredDelivery();
  const matches =
    (!configured.logisticCenter || order.logistic_center === configured.logisticCenter) &&
    (!configured.deliveryAddress ||
      (order.delivery_type === 2 && order.delivery_address === configured.deliveryAddress)) &&
    order.without_reserve !== true;
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
        without_reserve: false,
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
  if (verified.without_reserve === true) {
    throw new Error(`I-T-P создал заказ №${order.id} без резервирования.`);
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
  const safeComment = partnerComment.replace(/[\r\n]+/g, " ").trim().slice(0, 80) || "Телеграм";
  let order = existingOrderId ? await readOrder(existingOrderId, rpc) : null;
  const created = !existingOrderId;

  if (existingOrderId && !order) {
    throw new Error(`Заказ I-T-P №${existingOrderId} не найден.`);
  }

  if (!order) {
    const delivery = configuredDelivery();
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
          without_reserve: false,
        },
      ],
    });
    const data = requireSuccess(response, "I-T-P не создал заказ.");
    order = data.orders[0] ?? null;
    if (!order?.id) throw new Error("I-T-P вернул успешный ответ без номера заказа.");
  }

  await onOrderResolved?.(order);
  order = await ensureConfiguredDelivery(order, rpc);

  const existingItems = await readOrderItems(order.id, rpc);
  const existingItem = existingItems.find((item) => item.sku === sku);

  if (order.confirmed && (!existingItem || Number(existingItem.qty) !== quantity)) {
    throw new Error(`Заказ I-T-P №${order.id} уже подтверждён и не может быть изменён.`);
  }

  if (!existingItem || Number(existingItem.qty) !== quantity) {
    const response = await rpc<OrderItemsResponse>({
      data: {
        doc_id: order.id,
        destroy: [],
        update: [
          {
            sku,
            qty: quantity,
            wish_price: supplierPrice,
            wish_price_comment: "Телеграм",
          },
        ],
      },
      request: {
        method: "client_update",
        model: "order_items",
        module: "platform",
      },
    });
    requireSuccess(response, `I-T-P создал заказ №${order.id}, но не добавил товар.`);
  }

  const verifiedItems = await readOrderItems(order.id, rpc);
  const verifiedItem = verifiedItems.find((item) => item.sku === sku);
  if (!verifiedItem || Number(verifiedItem.qty) !== quantity) {
    throw new Error(`В заказе I-T-P №${order.id} не удалось подтвердить позицию SKU ${sku}.`);
  }

  return {
    order,
    item: verifiedItem,
    created,
    duplicatePrevented: !created,
  };
}
