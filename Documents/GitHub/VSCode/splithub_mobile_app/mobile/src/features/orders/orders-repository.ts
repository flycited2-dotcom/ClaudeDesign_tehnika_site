import { api } from '../../lib/api';
import type { Order } from './types';

export const orderDetailsQuery = (id: number) => ({ id: String(id) });

export const listOrders = () => api<{ orders: Order[] }>('orders');

export const loadOrder = (id: number) =>
  api<{ order: Order }>('order', {}, orderDetailsQuery(id));

export const repeatOrder = (id: number) =>
  api<{ items: { id: string; qty: number }[] }>('repeat_order', {
    method: 'POST',
    body: JSON.stringify({ order_id: id }),
  });

export const cancelOrder = (id: number, reason: string) =>
  api('cancel_order', {
    method: 'POST',
    body: JSON.stringify({ order_id: id, reason }),
  });
