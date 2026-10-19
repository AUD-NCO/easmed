/** A time of day on a 12-hour clock. */
export type ClockTime = { hour: number; minute: number; period: 'AM' | 'PM' }; // hour 1–12

const DAY = 24 * 60;

/** A clock time from minutes since midnight. */
export function fromMinutes(minutes: number): ClockTime {
  const m = ((minutes % DAY) + DAY) % DAY;
  const h24 = Math.floor(m / 60);
  return { hour: h24 % 12 || 12, minute: m % 60, period: h24 < 12 ? 'AM' : 'PM' };
}

/** Recording runs until you stop it; this is the safety net if you forget (battery, storage). */
export const MAX_RECORDING_MINUTES = 8 * 60;

/** Whole minutes since `from`. */
export const minutesSince = (from: Date, now = new Date()) => Math.max(0, Math.floor((now.getTime() - from.getTime()) / 60_000));

/** "6 hr 30 min", "8 hr", "45 min" (BRAND.md: plain durations). */
export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ') || '0 min';
}

/** "6:20 am" */
export const formatClock = (t: ClockTime) => `${t.hour}:${String(t.minute).padStart(2, '0')} ${t.period.toLowerCase()}`;
