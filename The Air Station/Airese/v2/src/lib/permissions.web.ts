/**
 * Browser preview only: browsers can't show the iOS / Android permission prompts,
 * so we show a simulated iOS alert (see SystemAlertHost) with the same wording.
 * The real app uses permissions.ts.
 */
import { showSystemAlert } from '@ds/components/SystemAlertHost';

export function requestMicrophone(): Promise<boolean> {
  return showSystemAlert({
    title: '“Airese” Would Like to Access the Microphone',
    message: 'Airese listens all night for snoring and breathing. Your recordings stay on your phone unless you choose to share them.',
  });
}

export function requestNotifications(): Promise<boolean> {
  return showSystemAlert({
    title: '“Airese” Would Like to Send You Notifications',
    message: 'Notifications may include alerts, sounds and icon badges. These can be configured in Settings.',
  });
}

export type PermissionStatus = 'granted' | 'ask' | 'blocked';

// The browser has no app permissions to read (null: keep what the prototype recorded) or Settings to open.
export const microphoneStatus = async (): Promise<PermissionStatus | null> => null;
export const notificationsStatus = async (): Promise<PermissionStatus | null> => null;
export const openAppSettings = async () => {};
