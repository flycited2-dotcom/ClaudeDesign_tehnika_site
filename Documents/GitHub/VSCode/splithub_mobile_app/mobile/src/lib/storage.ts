import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CatalogSnapshot } from '../features/catalog/types';

const CATALOG_KEY = 'splithub.catalog-cache';
const CART_KEY = 'splithub.cart';

export const catalogStorage = {
  read: async () => {
    const raw = await AsyncStorage.getItem(CATALOG_KEY);
    return raw ? (JSON.parse(raw) as CatalogSnapshot) : null;
  },
  write: (snapshot: CatalogSnapshot) =>
    AsyncStorage.setItem(CATALOG_KEY, JSON.stringify(snapshot)),
};

export const cartStorage = {
  read: async <T>() => {
    const raw = await AsyncStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  write: (items: unknown) => AsyncStorage.setItem(CART_KEY, JSON.stringify(items)),
};
