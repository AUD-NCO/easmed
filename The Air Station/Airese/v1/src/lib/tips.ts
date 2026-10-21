import type { IconName } from '@ds/components/Icon';

/**
 * Home banner: one message at a time, the most useful one for right now. Four messages, in priority:
 *
 *   P0  Microphone off     → Turn on microphone   (nothing can be recorded without it)
 *   P0  Last night stopped early → See what was saved (the morning after; lib/recordingIssues)
 *   P1  Notifications off  → Turn on notifications
 *   P2  Keep it charging   (no action; always there underneath)
 *
 * Copy follows design-system/docs/BRAND.md: plain, factual, calm, useful. Never a warning.
 */
export type HomeMessageId = 'microphone' | 'stopped' | 'notifications' | 'charging';
export type HomeMessage = { id: HomeMessageId; icon: IconName; text: string; cta?: string };

type Situation = {
  micOn: boolean;
  notificationsOn: boolean;
  /** Last night's recording stopped early, at this time ("2:14 am"). */
  stoppedAt?: string;
};

export function homeMessage(s: Situation): HomeMessage {
  if (!s.micOn) return { id: 'microphone', icon: 'mic', text: 'Airese needs your microphone to record your night.', cta: 'Turn on microphone' };
  if (s.stoppedAt) return { id: 'stopped', icon: 'history', text: `Last night’s recording stopped at ${s.stoppedAt}. Everything up to then is saved.`, cta: 'See what was saved' };
  if (!s.notificationsOn) return { id: 'notifications', icon: 'notifications', text: 'Turn on notifications for a bedtime reminder.', cta: 'Turn on notifications' };
  return { id: 'charging', icon: 'battery_charging_full', text: 'Keep your phone on charge while you record.' };
}
