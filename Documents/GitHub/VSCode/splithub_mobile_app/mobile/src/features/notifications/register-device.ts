import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from '../../lib/api';

export type NotificationPreferences = {
  order_status_enabled: boolean;
  promotions_enabled: boolean;
  manager_messages_enabled: boolean;
};

function deviceBody(expoToken: string, preferences: NotificationPreferences) {
  return {
    expo_token: expoToken,
    platform: Platform.OS,
    ...preferences,
  };
}

export async function registerDevice(preferences: NotificationPreferences) {
  if (!Device.isDevice) return null;
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('EAS_PROJECT_ID_REQUIRED');
  const expoToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await api('register_device', {
    method: 'POST',
    body: JSON.stringify(deviceBody(expoToken, preferences)),
  });
  return expoToken;
}

export async function updateNotificationPreferences(
  expoToken: string,
  preferences: NotificationPreferences,
) {
  await api('notification_preferences', {
    method: 'POST',
    body: JSON.stringify(deviceBody(expoToken, preferences)),
  });
}

export async function removeDevice(expoToken: string) {
  await api('remove_device', {
    method: 'POST',
    body: JSON.stringify({ expo_token: expoToken }),
  });
}
