/**
 * System permission requests (iOS and Android).
 * Each shows the operating system's own Allow / Don't Allow prompt and resolves
 * to true if the user allowed it. Callers move on either way.
 *
 * Browser preview: see permissions.web.ts (simulated prompt).
 */
import { Linking, Platform } from 'react-native';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';

/** Microphone, for overnight recording. iOS prompt text lives in app.json (expo-audio plugin). */
export async function requestMicrophone(): Promise<boolean> {
  const { granted } = await requestRecordingPermissionsAsync();
  return granted;
}

/**
 * Where a permission stands now, without prompting:
 *   granted  allowed
 *   ask      not allowed yet, and the system prompt can still be shown
 *   blocked  the user said no; only Settings can turn it on (iOS asks only once)
 */
export type PermissionStatus = 'granted' | 'ask' | 'blocked';

const toStatus = (r: { granted: boolean; canAskAgain: boolean }): PermissionStatus => (r.granted ? 'granted' : r.canAskAgain ? 'ask' : 'blocked');

export async function microphoneStatus(): Promise<PermissionStatus | null> {
  return toStatus(await getRecordingPermissionsAsync());
}

/** Notifications: the bedtime reminder and the "recording stopped" message (two a day). */
export async function requestNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Android 13+ only shows the prompt once a channel exists.
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  // On iOS, read ios.status rather than the root status (per Expo docs).
  return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function notificationsStatus(): Promise<PermissionStatus | null> {
  const result = await Notifications.getPermissionsAsync();
  if (result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return toStatus(result);
}

/**
 * Opens Airese's page in the system Settings app. After one "Don't Allow", iOS never shows the
 * prompt again, so this is the only way back.
 */
export function openAppSettings(): Promise<void> {
  return Linking.openSettings();
}
