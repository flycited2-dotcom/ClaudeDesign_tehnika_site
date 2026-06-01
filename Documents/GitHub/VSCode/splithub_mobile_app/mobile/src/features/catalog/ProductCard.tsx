import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { colors, formatPrice, spacing } from '../../lib/theme';
import type { Product } from './types';

const imageBaseUrl = 'https://splithub.ru/assets/img/products/';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={{ pathname: '/product/[id]', params: { id: product.id } }} asChild>
      <Pressable style={styles.card}>
        <Image source={{ uri: `${imageBaseUrl}${product.photo}` }} style={styles.image} />
        <Text numberOfLines={1} style={styles.brand}>
          {product.brand}
        </Text>
        <Text numberOfLines={2} style={styles.model}>
          {product.model}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={[styles.stock, product.stock !== 'in_stock' && styles.stockMuted]}>
            {product.stockLabel}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 242,
    padding: spacing.sm,
  },
  image: {
    backgroundColor: colors.background,
    borderRadius: 10,
    height: 110,
    marginBottom: spacing.sm,
    resizeMode: 'contain',
    width: '100%',
  },
  brand: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  model: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  footer: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  price: {
    color: colors.accentDark,
    fontSize: 16,
    fontWeight: '800',
  },
  stock: {
    color: colors.success,
    fontSize: 11,
  },
  stockMuted: {
    color: colors.muted,
  },
});
