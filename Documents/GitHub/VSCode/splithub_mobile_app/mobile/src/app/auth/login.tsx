import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router, Stack } from 'expo-router';

import { apiErrorCode, sessionErrorMessage } from '../../features/session/session-errors';
import { useSession } from '../../features/session/session-context';
import { colors, spacing } from '../../lib/theme';

export default function LoginScreen() {
  const { login } = useSession();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      await login(phone, password);
      router.replace('/profile');
    } catch (failure) {
      setError(sessionErrorMessage(apiErrorCode(failure)));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Вход' }} />
      <View style={styles.screen}>
        <Text style={styles.title}>Вход в SplitHub</Text>
        <TextInput
          autoComplete="tel"
          keyboardType="phone-pad"
          onChangeText={setPhone}
          placeholder="Телефон"
          style={styles.input}
          value={phone}
        />
        <TextInput
          onChangeText={setPassword}
          placeholder="Пароль"
          secureTextEntry
          style={styles.input}
          value={password}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable disabled={submitting} onPress={() => void submit()} style={styles.button}>
          <Text style={styles.buttonText}>{submitting ? 'Вход...' : 'Войти'}</Text>
        </Pressable>
        <Link href="/auth/register" style={styles.link}>
          Создать аккаунт
        </Link>
      </View>
    </>
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
    fontSize: 26,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
  },
  error: {
    color: '#B91C1C',
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: spacing.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  link: {
    color: colors.accentDark,
    fontWeight: '700',
  },
});
