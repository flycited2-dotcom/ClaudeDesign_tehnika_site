export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'in_progress'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type OrderItem = {
  product_id: string;
  product_name: string;
  price: number;
  qty: number;
};

export type Order = {
  id: number;
  total: number;
  status: OrderStatus;
  comment: string;
  created_at: string;
  items?: OrderItem[];
};
