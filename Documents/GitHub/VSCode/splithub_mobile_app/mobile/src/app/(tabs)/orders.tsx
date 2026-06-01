import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';

import { listOrders } from '../../features/orders/orders-repository';
import type { Order, OrderStatus } from '../../features/orders/types';
import { useSession } from '../../features/session/session-context';
import { colors, formatPrice, spacing } from '../../lib/theme';

const statusLabels: Record<OrderStatus, string> = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  in_progress: 'В работе',
  shipped: 'Отгружен',
  completed: 'Выполнен',
  cancelled: 'Отменён',
};

export default function OrdersScreen() {
  const { user } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      setOrders((await listOrders()).orders);
    } catch {
      setError('Не удалось загрузить заказы');
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!user) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Заказы</Text>
        <Text style={styles.muted}>Войдите, чтобы видеть историю и статусы заказов.</Text>
        <Link href="/auth/login" style={styles.link}>Войти</Link>
        <Link href="/auth/register" style={styles.link}>Создать аккаунт</Link>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Мои заказы</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!orders.length && !error ? <Text style={styles.muted}>Заказов пока нет</Text> : null}
      {orders.map((order) => (
        <Pressable key={order.id} onPress={() => router.push(`/order/${order.id}`)} style={styles.card}>
          <View>
            <Text style={styles.orderNumber}>SH-{String(order.id).padStart(5, '0')}</Text>
            <Text style={styles.muted}>{new Date(order.created_at).toLocaleDateString('ru-RU')}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.price}>{formatPrice(order.total)}</Text>
            <Text style={styles.status}>{statusLabels[order.status]}</Text>
          </View>
        </Pressable>
      ))}
      <Pressable onPress={() => void refresh()} style={styles.refresh}>
        <Text style={styles.refreshText}>Обновить</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  muted: {
    color: colors.muted,
  },
  link: {
    color: colors.accentDark,
    fontWeight: '800',
  },
  error: {
    color: '#B91C1C',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  orderNumber: {
    color: colors.text,
    fontWeight: '900',
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  price: {
    color: colors.accentDark,
    fontWeight: '800',
  },
  status: {
    color: colors.success,
    fontSize: 12,
  },
  refresh: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  refreshText: {
    color: colors.accentDark,
    fontWeight: '800',
  },
});
