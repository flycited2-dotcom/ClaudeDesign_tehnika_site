import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { useCart } from '../../features/cart/cart-context';
import { useCatalog } from '../../features/catalog/catalog-context';
import { cancelOrder, loadOrder, repeatOrder } from '../../features/orders/orders-repository';
import type { Order } from '../../features/orders/types';
import { colors, formatPrice, spacing } from '../../lib/theme';

export default function OrderDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = Number(params.id);
  const { snapshot } = useCatalog();
  const { replaceItems } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      setOrder((await loadOrder(orderId)).order);
    } catch {
      setError('Не удалось загрузить заказ');
    }
  }, [orderId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function repeat() {
    if (!order) return;
    const result = await repeatOrder(order.id);
    const products = new Map((snapshot?.products ?? []).map((product) => [product.id, product]));
    const items = result.items.flatMap(({ id, qty }) => {
      const product = products.get(id);
      return product ? [{ id, qty, name: product.model, price: product.price }] : [];
    });
    if (items.length !== result.items.length) {
      Alert.alert('Каталог изменился', 'Некоторые товары больше недоступны и не добавлены в корзину.');
    }
    replaceItems(items);
    router.push('/cart');
  }

  async function cancel() {
    if (!order || !reason.trim()) {
      setError('Укажите причину отмены');
      return;
    }
    try {
      await cancelOrder(order.id, reason.trim());
      setReason('');
      await refresh();
    } catch {
      setError('Заказ уже нельзя отменить');
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: order ? `SH-${String(order.id).padStart(5, '0')}` : 'Заказ' }} />
      <ScrollView contentContainerStyle={styles.screen}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {order ? (
          <>
            <Text style={styles.title}>Заказ SH-{String(order.id).padStart(5, '0')}</Text>
            <Text style={styles.muted}>Статус: {order.status}</Text>
            <Text style={styles.total}>Итого: {formatPrice(order.total)}</Text>
            {order.items?.map((item) => (
              <View key={`${item.product_id}-${item.product_name}`} style={styles.card}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text>{item.qty} × {formatPrice(item.price)}</Text>
              </View>
            ))}
            <Pressable onPress={() => void repeat()} style={styles.primary}>
              <Text style={styles.primaryText}>Повторить заказ</Text>
            </Pressable>
            {order.status === 'new' ? (
              <View style={styles.cancelBox}>
                <TextInput
                  onChangeText={setReason}
                  placeholder="Причина отмены"
                  style={styles.input}
                  value={reason}
                />
                <Pressable onPress={() => void cancel()} style={styles.danger}>
                  <Text style={styles.dangerText}>Отменить заказ</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  error: {
    color: '#B91C1C',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  muted: {
    color: colors.muted,
  },
  total: {
    color: colors.accentDark,
    fontSize: 20,
    fontWeight: '900',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    gap: spacing.xs,
    padding: spacing.md,
  },
  itemName: {
    color: colors.text,
    fontWeight: '700',
  },
  primary: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: spacing.md,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cancelBox: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
  },
  danger: {
    alignItems: 'center',
    borderColor: '#DC2626',
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
  },
  dangerText: {
    color: '#B91C1C',
    fontWeight: '800',
  },
});
