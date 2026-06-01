import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { CartProvider } from '../features/cart/cart-context';
import { CatalogProvider } from '../features/catalog/catalog-context';
import { SessionProvider } from '../features/session/session-context';

export default function RootLayout() {
  return (
    <SessionProvider>
      <CatalogProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </CartProvider>
      </CatalogProvider>
    </SessionProvider>
  );
}
