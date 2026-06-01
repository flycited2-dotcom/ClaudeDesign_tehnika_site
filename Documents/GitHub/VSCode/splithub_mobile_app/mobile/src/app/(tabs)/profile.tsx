import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { useSession } from '../../features/session/session-context';
import {
  type NotificationPreferences,
  registerDevice,
  removeDevice,
  updateNotificationPreferences,
} from '../../features/notifications/register-device';
import { colors, spacing } from '../../lib/theme';

const defaultPreferences: NotificationPreferences = {
  order_status_enabled: true,
  promotions_enabled: true,
  manager_messages_enabled: true,
};

export default function ProfileScreen() {
  const { user, loading, logout } = useSession();
  const [expoToken, setExpoToken] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState('');
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  useEffect(() => {
    if (!user) return;
    void registerDevice(defaultPreferences)
      .then((token) => {
        setExpoToken(token);
        if (token) setNotificationStatus('Устройство зарегистрировано для push-уведомлений');
      })
      .catch(() => setNotificationStatus('Push-уведомления станут доступны после настройки EAS project ID'));
  }, [user]);

  function setPreference(key: keyof NotificationPreferences, enabled: boolean) {
    const next = { ...preferences, [key]: enabled };
    setPreferences(next);
    if (expoToken) {
      void updateNotificationPreferences(expoToken, next).catch(() =>
        setNotificationStatus('Не удалось сохранить настройки уведомлений'),
      );
    }
  }

  async function logoutAndRemoveDevice() {
    try {
      if (expoToken) await removeDevice(expoToken);
    } finally {
      await logout();
    }
  }

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
        <View style={styles.preference}>
          <Text style={styles.preferenceLabel}>Статусы заказов</Text>
          <Switch
            onValueChange={(enabled) => setPreference('order_status_enabled', enabled)}
            value={preferences.order_status_enabled}
          />
        </View>
        <View style={styles.preference}>
          <Text style={styles.preferenceLabel}>Промо и акции</Text>
          <Switch
            onValueChange={(enabled) => setPreference('promotions_enabled', enabled)}
            value={preferences.promotions_enabled}
          />
        </View>
        <View style={styles.preference}>
          <Text style={styles.preferenceLabel}>Сообщения менеджера</Text>
          <Switch
            onValueChange={(enabled) => setPreference('manager_messages_enabled', enabled)}
            value={preferences.manager_messages_enabled}
          />
        </View>
        {notificationStatus ? <Text style={styles.muted}>{notificationStatus}</Text> : null}
      </View>
      <Pressable onPress={() => void Linking.openURL('https://t.me/Byttehnikaopt')} style={styles.outline}>
        <Text style={styles.outlineText}>Написать менеджеру в Telegram</Text>
      </Pressable>
      <Pressable onPress={() => void Linking.openURL('tel:+79785991369')} style={styles.outline}>
        <Text style={styles.outlineText}>Позвонить менеджеру</Text>
      </Pressable>
      <Pressable onPress={() => void Linking.openURL('https://splithub.ru/')} style={styles.outline}>
        <Text style={styles.outlineText}>Открыть прайс-лист</Text>
      </Pressable>
      <Pressable onPress={() => void logoutAndRemoveDevice()} style={styles.logout}>
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
  preference: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  preferenceLabel: {
    color: colors.text,
    flex: 1,
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
