import { useEffect } from 'react';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { CartProvider } from '../features/cart/cart-context';
import { CatalogProvider } from '../features/catalog/catalog-context';
import { notificationTarget } from '../features/notifications/notification-router';
import { SessionProvider } from '../features/session/session-context';

function NotificationNavigation() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const target = notificationTarget(response.notification.request.content.data ?? {});
      if (/^https?:\/\//.test(target)) {
        void Linking.openURL(target);
      } else {
        router.push(target as never);
      }
    });
    return () => subscription.remove();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <CatalogProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <NotificationNavigation />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </CartProvider>
      </CatalogProvider>
    </SessionProvider>
  );
}
