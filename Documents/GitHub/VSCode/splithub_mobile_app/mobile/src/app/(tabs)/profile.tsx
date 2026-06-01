import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { useSession } from '../../features/session/session-context';
import { colors, spacing } from '../../lib/theme';

export default function ProfileScreen() {
  const { user, loading, logout } = useSession();

  if (loading) {
    return <View style={styles.screen}><Text>Загрузка профиля...</Text></View>;
  }

  if (!user) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Профиль</Text>
        <Text style={styles.muted}>Войдите с теми же данными, которые используете на сайте.</Text>
        <Link href="/auth/login" style={styles.primaryLink}>Войти</Link>
        <Link href="/auth/register" style={styles.secondaryLink}>Создать аккаунт</Link>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{user.name}</Text>
      <Text style={styles.muted}>{user.phone}</Text>
      {user.telegram ? <Text style={styles.muted}>Telegram: {user.telegram}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Уведомления</Text>
        <Text style={styles.muted}>Настройки push-уведомлений будут доступны после регистрации устройства.</Text>
      </View>
      <Pressable onPress={() => void Linking.openURL('https://t.me/Byttehnikaopt')} style={styles.outline}>
        <Text style={styles.outlineText}>Написать менеджеру в Telegram</Text>
      </Pressable>
      <Pressable onPress={() => void logout()} style={styles.logout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
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
  primaryLink: {
    color: colors.accentDark,
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryLink: {
    color: colors.text,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  outline: {
    borderColor: colors.accent,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
  },
  outlineText: {
    color: colors.accentDark,
    fontWeight: '800',
    textAlign: 'center',
  },
  logout: {
    padding: spacing.md,
  },
  logoutText: {
    color: '#B91C1C',
    fontWeight: '700',
    textAlign: 'center',
  },
});
