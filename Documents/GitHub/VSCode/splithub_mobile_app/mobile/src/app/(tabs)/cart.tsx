import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { useCart } from '../../features/cart/cart-context';
import { colors, formatPrice, spacing } from '../../lib/theme';

export default function CartScreen() {
  const { items, total, setQty, checkout, checkoutError, checkingOut } = useCart();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Корзина</Text>
      {!items.length ? <Text style={styles.empty}>Корзина пока пуста</Text> : null}
      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
          </View>
          <View style={styles.qty}>
            <Pressable onPress={() => setQty(item.id, item.qty - 1)} style={styles.qtyButton}>
              <Text style={styles.qtyText}>−</Text>
            </Pressable>
            <Text style={styles.qtyValue}>{item.qty}</Text>
            <Pressable onPress={() => setQty(item.id, item.qty + 1)} style={styles.qtyButton}>
              <Text style={styles.qtyText}>+</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {items.length ? (
        <>
          <Text style={styles.total}>Итого: {formatPrice(total)}</Text>
          <Text style={styles.note}>Оформление заказа требует подключения к интернету.</Text>
          {checkoutError ? <Text style={styles.error}>{checkoutError.message}</Text> : null}
          {checkoutError?.code === 'AUTH_REQUIRED' ? (
            <Link href="/auth/login" style={styles.loginLink}>
              Войти в аккаунт
            </Link>
          ) : null}
          <Pressable
            disabled={checkingOut}
            onPress={() =>
              void checkout().then((result) => {
                if (result) Alert.alert('Заказ создан', `Номер заказа: SH-${result.order_id}`);
              })
            }
            style={[styles.checkout, checkingOut && styles.checkoutDisabled]}>
            <Text style={styles.checkoutText}>{checkingOut ? 'Отправка...' : 'Оформить заказ'}</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
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
  empty: {
    color: colors.muted,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  itemInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  itemTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  price: {
    color: colors.accentDark,
    fontWeight: '800',
  },
  qty: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  qtyButton: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  qtyText: {
    color: colors.accentDark,
    fontSize: 18,
    fontWeight: '900',
  },
  qtyValue: {
    minWidth: 20,
    textAlign: 'center',
  },
  total: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  note: {
    color: colors.muted,
    fontSize: 12,
  },
  error: {
    color: '#B91C1C',
  },
  loginLink: {
    color: colors.accentDark,
    fontWeight: '800',
  },
  checkout: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: spacing.md,
  },
  checkoutDisabled: {
    opacity: 0.6,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
