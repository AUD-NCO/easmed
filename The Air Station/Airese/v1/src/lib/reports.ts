import { nightDetails, nightState, type NightState } from './nightDetails';
import type { Night } from './recordings';

/**
 * Reports tab: what the calendar needs to know about each night.
 * Prototype: computed from the sample nights. Engineering: read each night's stored Sound Score.
 */

/** "2026-10-07": a night by the date it started (the same as a Night's id). */
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** A recorded night on the calendar: its Sound Score (0–100), or null when Airese couldn't hear clearly. */
export type CalendarNight = { night: Night; state: NightState; score: number | null };

export function calendarNights(nights: Night[]): Map<string, CalendarNight> {
  const map = new Map<string, CalendarNight>();
  for (const night of nights) {
    const state = nightState(night);
    map.set(night.id, { night, state, score: state === 'poor' ? null : nightDetails(night, state).soundScore });
  }
  return map;
}

/**
 * Missed nights: how many of the last `days` nights (last night and before) have no recording.
 * From MISSED_NIGHTS_NUDGE missed in the last 14, the calendar suggests a bedtime reminder.
 * Only once there's a first recording to miss from. Product to confirm the threshold.
 */
export const RECENT_DAYS = 14;
export const MISSED_NIGHTS_NUDGE = 4;

export function recordedOfRecent(nights: Night[], today = new Date(), days = RECENT_DAYS) {
  const recorded = new Set(nights.map((n) => n.id));
  let count = 0;
  for (let i = 1; i <= days; i++) {
    if (recorded.has(dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)))) count++;
  }
  return { recorded: count, days, missed: days - count };
}
