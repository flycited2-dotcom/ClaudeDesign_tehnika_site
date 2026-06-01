import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { useCatalog } from '../../features/catalog/catalog-context';
import { colors, formatPrice, spacing } from '../../lib/theme';

const imageBaseUrl = 'https://splithub.ru/assets/img/products/';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { snapshot } = useCatalog();
  const product = snapshot?.products.find((item) => item.id === id);

  if (!product) {
    return (
      <View style={styles.empty}>
        <Text>Товар не найден</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: product.model }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: `${imageBaseUrl}${product.photo}` }} style={styles.image} />
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.title}>{product.model}</Text>
        <Text style={styles.description}>{product.descShort}</Text>
        <Text style={styles.stock}>{product.stockLabel}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        {product.benefits.length ? (
          <View style={styles.benefits}>
            {product.benefits.map((benefit) => (
              <Text key={benefit} style={styles.benefit}>
                • {benefit}
              </Text>
            ))}
          </View>
        ) : null}
        <Pressable
          onPress={() => Alert.alert('Корзина', 'Добавление в корзину будет доступно на следующем шаге.')}
          style={styles.button}>
          <Text style={styles.buttonText}>Добавить в корзину</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    backgroundColor: colors.background,
    gap: spacing.md,
    padding: spacing.lg,
  },
  image: {
    backgroundColor: colors.card,
    borderRadius: 18,
    height: 280,
    resizeMode: 'contain',
    width: '100%',
  },
  brand: {
    color: colors.muted,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  description: {
    color: colors.muted,
  },
  stock: {
    color: colors.success,
    fontWeight: '700',
  },
  price: {
    color: colors.accentDark,
    fontSize: 26,
    fontWeight: '900',
  },
  benefits: {
    backgroundColor: colors.card,
    borderRadius: 14,
    gap: spacing.xs,
    padding: spacing.md,
  },
  benefit: {
    color: colors.text,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
