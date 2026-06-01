import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ProductCard } from '../../features/catalog/ProductCard';
import { useCatalog } from '../../features/catalog/catalog-context';
import { filterProducts } from '../../features/catalog/filter-products';
import { colors, spacing } from '../../lib/theme';

const categories = [
  { id: '', label: 'Все' },
  { id: 'inv', label: 'Инверторные' },
  { id: 'onoff', label: 'On/Off' },
  { id: 'truba', label: 'Труба' },
  { id: 'rashod', label: 'Расходники' },
  { id: 'pac_inv', label: 'Полупром. inverter' },
  { id: 'pac_onoff', label: 'Полупром. On/Off' },
  { id: 'multi', label: 'Мультисплит' },
];

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const { snapshot, loading, offline, error, refresh } = useCatalog();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');

  useEffect(() => {
    if (typeof params.category === 'string') {
      setGroup(params.category);
    }
  }, [params.category]);

  const products = useMemo(
    () => filterProducts(snapshot?.products ?? [], search, group),
    [snapshot, search, group],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>SplitHub</Text>
        <Text style={styles.subtitle}>Каталог климатической техники</Text>
      </View>
      {offline && snapshot ? (
        <Text style={styles.offline}>
          Офлайн-каталог. Последнее обновление: {new Date(snapshot.updated_at).toLocaleString('ru-RU')}
        </Text>
      ) : null}
      <TextInput
        onChangeText={setSearch}
        placeholder="Поиск по бренду или модели"
        style={styles.search}
        value={search}
      />
      <ScrollView
        contentContainerStyle={styles.categories}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => setGroup(category.id)}
            style={[styles.chip, group === category.id && styles.chipActive]}>
            <Text style={[styles.chipText, group === category.id && styles.chipTextActive]}>
              {category.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {loading && !snapshot ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
      {error && !snapshot ? (
        <Pressable onPress={() => void refresh()} style={styles.retry}>
          <Text style={styles.retryText}>{error}. Повторить</Text>
        </Pressable>
      ) : null}
      <FlatList
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        data={products}
        keyExtractor={(product) => product.id}
        numColumns={2}
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingTop: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  offline: {
    backgroundColor: '#FEF3C7',
    color: colors.warning,
    fontSize: 12,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  search: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categories: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chip: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  loader: {
    marginTop: spacing.xl,
  },
  retry: {
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  retryText: {
    color: colors.accentDark,
    fontWeight: '700',
  },
});
