import { useSyncExternalStore } from 'react';
import { recall, remember } from './session';
import { formatClock, formatDuration, fromMinutes } from './time';

/**
 * Past nights, for the Reports tab (its calendar, and the report on show).
 *
 * Prototype: sample data, made relative to today so the list always looks current.
 * Engineering: read real recordings from the device.
 */
export type Night = { id: string; date: Date; startMinutes: number; minutes: number };

/** A night's recording, by the date it started. */
const SAMPLE: { daysAgo: number; start: number; minutes: number }[] = [
  { daysAgo: 1, start: 23 * 60 + 5, minutes: 480 },
  { daysAgo: 2, start: 22 * 60 + 40, minutes: 460 },
  { daysAgo: 3, start: 23 * 60 + 30, minutes: 415 },
  { daysAgo: 5, start: 23 * 60 + 10, minutes: 480 },
  { daysAgo: 6, start: 22 * 60 + 55, minutes: 452 },
  { daysAgo: 9, start: 23 * 60 + 45, minutes: 390 },
  { daysAgo: 12, start: 23 * 60, minutes: 480 },
  { daysAgo: 16, start: 22 * 60 + 30, minutes: 470 },
  { daysAgo: 21, start: 23 * 60 + 15, minutes: 445 },
  { daysAgo: 27, start: 23 * 60 + 20, minutes: 480 },
  { daysAgo: 34, start: 22 * 60 + 50, minutes: 425 },
  { daysAgo: 40, start: 23 * 60 + 5, minutes: 480 },
];

export function sampleNights(today = new Date()): Night[] {
  return SAMPLE.map(({ daysAgo, start, minutes }) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
    const id = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { id, date, startMinutes: start, minutes };
  });
}

/**
 * The nights recorded. Profile → Delete all recordings empties it for the rest of the session.
 * Engineering: delete the audio clips and analysis from the device, not just the list.
 */
let deleted: boolean = recall('recordingsDeleted', false);
const listeners = new Set<() => void>();

export function deleteAllRecordings() {
  deleted = true;
  remember('recordingsDeleted', true);
  listeners.forEach((l) => l());
}

/** Delete account starts over: the sample nights come back for the next demo run. */
export function restoreSampleRecordings() {
  deleted = false;
  remember('recordingsDeleted', false);
  listeners.forEach((l) => l());
}

const EMPTY: Night[] = [];
let cache: { day: string; nights: Night[] } | null = null;
function current(): Night[] {
  if (deleted) return EMPTY;
  const day = new Date().toDateString();
  if (cache?.day !== day) cache = { day, nights: sampleNights() };
  return cache.nights;
}

/**
 * Straight after a recording stops, Reports shows "Looking through your night", then the report.
 * Every other visit shows the report directly. Prototype: a fixed wait.
 * Engineering: true while the night's analysis is still running.
 */
const ANALYSING_MS = 6000;
let analysing = false;
let analysingTimer: ReturnType<typeof setTimeout> | undefined;
const analysingListeners = new Set<() => void>();

export function startAnalysing() {
  clearTimeout(analysingTimer);
  analysing = true;
  analysingListeners.forEach((l) => l());
  analysingTimer = setTimeout(() => {
    analysing = false;
    analysingListeners.forEach((l) => l());
  }, ANALYSING_MS);
}

export function useAnalysing(): boolean {
  return useSyncExternalStore(
    (l) => {
      analysingListeners.add(l);
      return () => analysingListeners.delete(l);
    },
    () => analysing,
  );
}

export function useNights(): Night[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    current,
  );
}


// Spelled out here rather than via toLocaleDateString, which differs by device ("Sept", no comma).
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Tue, 27 Jan" */
export const formatNightDate = (d: Date) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()].slice(0, 3)}`;

/** "8 hr of recording" */
export const formatRecorded = (minutes: number) => `${formatDuration(minutes)} of recording`;

/** "11:05 pm to 7:05 am" */
export const formatSpan = (n: Night) => `${formatClock(fromMinutes(n.startMinutes))} to ${formatClock(fromMinutes(n.startMinutes + n.minutes))}`;
