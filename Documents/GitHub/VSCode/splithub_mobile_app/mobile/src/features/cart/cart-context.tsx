import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import { api } from '../../lib/api';
import { cartStorage } from '../../lib/storage';
import type { Product } from '../catalog/types';
import { cartReducer, type CartItem } from './cart-reducer';

type CheckoutError = {
  code: string;
  message: string;
};

type CartContextValue = {
  items: CartItem[];
  total: number;
  checkoutError: CheckoutError | null;
  checkingOut: boolean;
  addProduct: (product: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  replaceItems: (items: CartItem[]) => void;
  checkout: () => Promise<{ order_id: number; total: number } | null>;
};

const CartContext = createContext<CartContextValue | null>(null);

function errorMessage(code: string) {
  if (code === 'CATALOG_CHANGED') return 'Цена или наличие изменились. Проверьте корзину перед повторной отправкой.';
  if (code === 'PRODUCT_UNAVAILABLE') return 'Один из товаров больше недоступен. Обновите корзину.';
  if (code === 'AUTH_REQUIRED') return 'Войдите в аккаунт, чтобы оформить заказ.';
  return 'Не удалось оформить заказ. Проверьте подключение и повторите попытку.';
}

export function CartProvider({ children }: PropsWithChildren) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [checkoutError, setCheckoutError] = useState<CheckoutError | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    void cartStorage.read<CartItem[]>().then((stored) => {
      if (stored) {
        dispatch({ type: 'replace', items: stored });
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) {
      void cartStorage.write(items);
    }
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      total: items.reduce((sum, item) => sum + item.price * item.qty, 0),
      checkoutError,
      checkingOut,
      addProduct: (product, qty = 1) => {
        setCheckoutError(null);
        dispatch({ type: 'add', item: { id: product.id, name: product.model, price: product.price, qty } });
      },
      setQty: (id, qty) => dispatch({ type: 'setQty', id, qty }),
      replaceItems: (nextItems) => dispatch({ type: 'replace', items: nextItems }),
      checkout: async () => {
        setCheckoutError(null);
        setCheckingOut(true);
        try {
          const result = await api<{ order_id: number; total: number }>('create_order', {
            method: 'POST',
            body: JSON.stringify({ items }),
          });
          dispatch({ type: 'clear' });
          return result;
        } catch (error) {
          const code = String((error as { data?: { code?: string } }).data?.code ?? 'REQUEST_FAILED');
          setCheckoutError({ code, message: errorMessage(code) });
          return null;
        } finally {
          setCheckingOut(false);
        }
      },
    }),
    [checkoutError, checkingOut, items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return value;
}
