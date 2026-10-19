import { useSyncExternalStore } from 'react';
import { recall, remember } from './session';
import { microphoneStatus, notificationsStatus, requestMicrophone, requestNotifications, type PermissionStatus } from './permissions';

/**
 * Where the microphone and notification permissions stand, shared across screens
 * (Home shows a tip and asks again in context while one is off).
 * Starts at "ask"; updated after each prompt, and read back from the system on refresh
 * (on device: Home calls refresh on open and on return to the app, e.g. from Settings).
 */
export type PermissionKind = 'microphone' | 'notifications';

let state: Record<PermissionKind, PermissionStatus> = recall('permissions', { microphone: 'ask', notifications: 'ask' });
const listeners = new Set<() => void>();

export function setPermissionStatus(kind: PermissionKind, status: PermissionStatus) {
  if (state[kind] === status) return;
  state = { ...state, [kind]: status };
  remember('permissions', state);
  listeners.forEach((l) => l());
}

export function usePermissionStatus(kind: PermissionKind): PermissionStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state[kind],
  );
}

/** Reads both from the system (no prompts). In the browser preview, keeps what was recorded. */
export async function refreshPermissions() {
  const [mic, notes] = await Promise.all([microphoneStatus().catch(() => null), notificationsStatus().catch(() => null)]);
  if (mic) setPermissionStatus('microphone', mic);
  if (notes) setPermissionStatus('notifications', notes);
}

/** Shows the system prompt for one permission and records the answer. */
export async function askPermission(kind: PermissionKind): Promise<PermissionStatus> {
  const granted = await (kind === 'microphone' ? requestMicrophone() : requestNotifications()).catch(() => false);
  // On device, read back the real state (Android can still ask again after one no; iOS can't).
  const actual = await (kind === 'microphone' ? microphoneStatus() : notificationsStatus()).catch(() => null);
  const status: PermissionStatus = actual ?? (granted ? 'granted' : 'blocked');
  setPermissionStatus(kind, status);
  return status;
}
