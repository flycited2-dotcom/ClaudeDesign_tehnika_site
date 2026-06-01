export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

export type CartAction =
  | { type: 'add'; item: CartItem }
  | { type: 'setQty'; id: string; qty: number }
  | { type: 'replace'; items: CartItem[] }
  | { type: 'clear' };

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  if (action.type === 'clear') {
    return [];
  }
  if (action.type === 'replace') {
    return action.items;
  }
  if (action.type === 'setQty') {
    return state
      .map((item) => (item.id === action.id ? { ...item, qty: action.qty } : item))
      .filter((item) => item.qty > 0);
  }
  const found = state.find((item) => item.id === action.item.id);
  return found
    ? state.map((item) =>
        item.id === action.item.id ? { ...item, qty: item.qty + action.item.qty } : item,
      )
    : [...state, { ...action.item }];
}
