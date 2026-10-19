import { useSyncExternalStore } from 'react';
import { recall, remember } from './session';

/**
 * Night Notes: things that may affect tonight's sleep and snoring, added before recording.
 * Kept in memory for the prototype. Engineering: store with each night's recording, on device.
 */
export type NoteOption = { id: string; label: string };
export type NoteGroup = { title: string; subtitle?: string; options: NoteOption[] };

const o = (id: string, label: string): NoteOption => ({ id, label });

/** The check-in, as natural questions. */
export const NOTE_GROUPS: NoteGroup[] = [
  { title: 'How are you feeling?', options: [o('blocked-nose', 'Blocked nose'), o('sick', 'Sick'), o('exhausted', 'Exhausted'), o('dehydrated', 'Dehydrated'), o('period', 'Period')] },
  {
    title: 'Anything before bed?',
    options: [o('alcohol', 'Alcohol'), o('caffeine', 'Caffeine'), o('ate-late', 'Ate late'), o('worked-out', 'Worked out'), o('smoking', 'Smoking'), o('sedatives', 'Sedatives')],
  },
  { title: 'Sleeping somewhere different?', options: [o('not-my-bed', 'Not my bed')] },
];

/** Remedies, grouped by what they're for (opened from "Add remedy"). */
export const REMEDY_GROUPS: NoteGroup[] = [
  { title: 'Sleep position', options: [o('side-sleeping', 'Side sleeping'), o('wedge-pillow', 'Wedge pillow'), o('positional-therapy', 'Positional therapy'), o('anti-snore-pillow', 'Anti snore pillow')] },
  { title: 'Nose', options: [o('nasal-strip', 'Nasal strip'), o('nasal-dilator', 'Nasal dilator'), o('nasal-spray', 'Nasal spray'), o('neti-pot', 'Neti pot'), o('allergy-relief', 'Allergy relief')] },
  { title: 'Mouth & throat', options: [o('mouthpiece', 'Mouthpiece'), o('tongue-retainer', 'Tongue retainer'), o('mouth-tape', 'Mouth tape'), o('throat-spray', 'Throat spray'), o('chin-strap', 'Chin strap')] },
  { title: 'Room', options: [o('air-purifier', 'Air purifier'), o('humidifier', 'Humidifier')] },
];

const LABELS = new Map([...NOTE_GROUPS, ...REMEDY_GROUPS].flatMap((g) => g.options.map((x) => [x.id, x.label] as const)));
export const labelOf = (id: string) => LABELS.get(id) ?? id;
export const isRemedy = (id: string) => REMEDY_GROUPS.some((g) => g.options.some((x) => x.id === id));

/** In the order they appear on the screen, for summaries ("Alcohol · Blocked nose · Nasal strip"). */
const ORDER = [...NOTE_GROUPS, ...REMEDY_GROUPS].flatMap((g) => g.options.map((x) => x.id));
export const ordered = (ids: string[]) => [...ids].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
export const summarize = (ids: string[]) => ordered(ids).map(labelOf).join(' · ');

type State = { tonight: string[]; lastNight: string[] | null; nightsRecorded: number };
let state: State = recall('nightNotes', { tonight: [], lastNight: null, nightsRecorded: 0 });
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  remember('nightNotes', state);
  listeners.forEach((l) => l());
};

export function useNightNotes(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export const saveTonight = (ids: string[]) => set({ tonight: ordered(ids) });

/** Profile → Clear Night Notes preferences: tonight's choices and the "same as last night" memory. */
export const clearNightNotes = () => set({ tonight: [], lastNight: null });

/** Delete account: everything, including the count of nights recorded. */
export const resetNightNotes = () => set({ tonight: [], lastNight: null, nightsRecorded: 0 });

/** A night was recorded: tonight's notes become last night's, and tomorrow starts empty. */
export const finishNight = () => set({ lastNight: state.tonight.length ? state.tonight : state.lastNight, tonight: [], nightsRecorded: state.nightsRecorded + 1 });

/** Home nudges (caution icon) once at least one night is recorded and tonight has no notes. */
export const needsNotes = (s: State) => s.nightsRecorded > 0 && s.tonight.length === 0;

// Prototype only: the demo menu's "Home · after first night" state.
export const demoAfterFirstNight = () => set({ nightsRecorded: 1, tonight: [], lastNight: ['blocked-nose', 'alcohol', 'nasal-strip'] });
