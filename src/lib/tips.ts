import type { IconName } from '../components/Icon';

/**
 * Home banner: one message at a time, the most useful one for right now. Five messages, in priority:
 *
 *   P0  Microphone off     → Turn on microphone   (nothing can be recorded without it)
 *   P0  Last night stopped early → See what was saved (the morning after; lib/recordingIssues)
 *   P1  Notifications off  → Turn on notifications
 *   P2  Keep it charging   → Got it               (until dismissed)
 *   P3  Night Notes        → Add / Edit Night Notes (always there underneath: Home's way into Night Notes)
 *
 * Copy follows docs/BRAND.md: plain, factual, calm, useful. Never a warning.
 * Engineering: P2 could also hide while the phone is already on charge (expo-battery), and come back
 * each evening rather than once per install.
 */
export type HomeMessageId = 'microphone' | 'stopped' | 'notifications' | 'charging' | 'notes';
export type HomeMessage = { id: HomeMessageId; icon: IconName; text: string; cta: string };

type Situation = {
  micOn: boolean;
  notificationsOn: boolean;
  chargingDismissed: boolean;
  /** Tonight's Night Notes, summarised ("Blocked nose · Alcohol"), or empty when none yet. */
  notesTonight: string;
  /** Last night's recording stopped early, at this time ("2:14 am"). */
  stoppedAt?: string;
};

export function homeMessage(s: Situation): HomeMessage {
  if (!s.micOn) return { id: 'microphone', icon: 'mic', text: 'Airese needs your microphone to record your night.', cta: 'Turn on microphone' };
  if (s.stoppedAt) return { id: 'stopped', icon: 'history', text: `Last night’s recording stopped at ${s.stoppedAt}. Everything up to then is saved.`, cta: 'See what was saved' };
  if (!s.notificationsOn) return { id: 'notifications', icon: 'notifications', text: 'Turn on notifications for a bedtime reminder.', cta: 'Turn on notifications' };
  if (!s.chargingDismissed) return { id: 'charging', icon: 'battery_charging_full', text: 'Keep your phone on charge while you record. A night of listening uses more battery.', cta: 'Got it' };
  if (s.notesTonight) return { id: 'notes', icon: 'edit_note', text: `Tonight’s Night Notes: ${s.notesTonight}`, cta: 'Edit Night Notes' };
  return { id: 'notes', icon: 'edit_note', text: 'Add Night Notes before you sleep, so you can track your progress over time.', cta: 'Add Night Notes' };
}
