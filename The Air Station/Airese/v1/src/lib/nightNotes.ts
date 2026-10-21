import { useSyncExternalStore } from 'react';
import type { IconName } from '@ds/components/Icon';
import { recall, remember } from './session';

/**
 * Night Notes: things that may affect a night's sleep and snoring. Two parts: Before sleeping (from
 * Recording, for tonight) and sleep remedies (from the night's report).
 * Kept in memory for the prototype. Engineering: store with each night's recording, on device.
 */
export type NoteOption = { id: string; label: string; icon: IconName };
export type NoteGroup = { title: string; options: NoteOption[] };

const o = (id: string, label: string, icon: IconName): NoteOption => ({ id, label, icon });

/** Before sleeping: what happened today that may change tonight. */
export const BEFORE_SLEEP: NoteOption[] = [
  o('alcohol', 'Alcohol', 'wine_bar'),
  o('caffeine', 'Caffeine', 'coffee'),
  o('ate-late', 'Ate late', 'dinner_dining'),
  o('worked-out', 'Worked out', 'fitness_center'),
  o('smoking', 'Smoking', 'smoking_rooms'),
  o('sedatives', 'Sedative', 'pill'),
  o('blocked-nose', 'Blocked nose', 'nose'),
  o('sick', 'Sick', 'sick'),
  o('exhausted', 'Exhaustion', 'face_sleepy'),
];

/** Sleep remedies, grouped by what they're for. */
export const REMEDY_GROUPS: NoteGroup[] = [
  {
    title: 'Sleep position',
    options: [o('side-sleeping', 'Side sleeping', 'hotel'), o('wedge-pillow', 'Wedge pillow', 'change_history'), o('positional-therapy', 'Positional therapy', 'airline_seat_flat_angled'), o('anti-snore-pillow', 'Anti snore pillow', 'bed')],
  },
  {
    title: 'Nose',
    options: [o('nasal-strip', 'Nasal strip', 'healing'), o('nasal-dilator', 'Nasal dilator', 'airwave'), o('nasal-spray', 'Nasal spray', 'sanitizer'), o('neti-pot', 'Neti pot', 'kettle'), o('allergy-relief', 'Allergy relief', 'allergies')],
  },
  {
    title: 'Mouth & throat',
    options: [o('mouthpiece', 'Mouthpiece', 'dentistry'), o('tongue-retainer', 'Tongue retainer', 'face_tongue'), o('mouth-tape', 'Mouth tape', 'mouth'), o('throat-spray', 'Throat spray', 'inhaler'), o('chin-strap', 'Chin strap', 'head')],
  },
  { title: 'Room', options: [o('air-purifier', 'Air purifier', 'air_purifier'), o('humidifier', 'Humidifier', 'humidity_high')] },
];

const ALL = [...BEFORE_SLEEP, ...REMEDY_GROUPS.flatMap((g) => g.options)];
const BY_ID = new Map(ALL.map((x) => [x.id, x]));
export const labelOf = (id: string) => BY_ID.get(id)?.label ?? id;
export const isRemedy = (id: string) => REMEDY_GROUPS.some((g) => g.options.some((x) => x.id === id));

/** In the order they appear on the screen, for summaries ("Alcohol · Blocked nose · Nasal strip"). */
const ORDER = ALL.map((x) => x.id);
export const ordered = (ids: string[]) => [...ids].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
export const summarize = (ids: string[]) => ordered(ids).map(labelOf).join(' · ');

/**
 * Tonight: Before sleeping, added from Recording. Each night: its notes (Before sleeping and remedies,
 * added from its report), how the person rated it (1 to 5, straight after stopping), and whether
 * Night Notes were added from the report (the report nudges until they are).
 */
export type NightEntry = { notes: string[]; rating?: number; added?: boolean };
type State = { tonight: string[]; nights: Record<string, NightEntry> };
const known = (ids: string[]) => ids.filter((id) => BY_ID.has(id));
const saved = recall<Partial<State>>('nightNotes', {});
let state: State = { tonight: known(saved.tonight ?? []), nights: saved.nights ?? {} };
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  remember('nightNotes', state);
  listeners.forEach((l) => l());
};
const EMPTY: NightEntry = { notes: [] };
const setNight = (id: string, next: Partial<NightEntry>) => set({ nights: { ...state.nights, [id]: { ...EMPTY, ...state.nights[id], ...next } } });

export function useNightNotes(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export const nightEntry = (s: State, id: string) => s.nights[id] ?? EMPTY;

/** Recording: tonight's Before sleeping. */
export const saveTonight = (ids: string[]) => set({ tonight: ordered(ids) });

/** Recording stopped: tonight's notes go with the night just recorded, and the next night starts empty. */
export function finishNight(nightId: string) {
  setNight(nightId, { notes: state.tonight });
  set({ tonight: [] });
}

/** Straight after stopping: how the night felt, 1 to 5. */
export const rateNight = (nightId: string, rating: number) => setNight(nightId, { rating });

/** From the night's report: its Night Notes. Stops the report's nudge. */
export const saveNight = (nightId: string, ids: string[]) => setNight(nightId, { notes: ordered(ids), added: true });

/** Erase everything. */
export const resetNightNotes = () => set({ tonight: [], nights: {} });
