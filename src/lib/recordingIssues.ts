import type { ImageSourcePropType } from 'react-native';
import { recall, remember } from './session';
import { formatClock, fromMinutes } from './time';
import { shortDuration } from './nightDetails';
import type { Night } from './recordings';

/**
 * When recording goes wrong. One template for every case (ProblemScreen, laid out like the
 * permission screens): image, problem, reason, how to solve, one button. A few words each.
 *
 *   At bedtime (tapping record)  not enough space · couldn't start         → Try again
 *   During the night (back in Airese)  paused: another app closed it       → Carry on recording
 *   The next morning (Reports)  couldn't hear clearly                      → Record tonight
 *                               stopped early (phone, app closed, space)   → See what was saved
 *
 * Prototype: the demo nav sets which problem happens.
 * Engineering: free space from expo-file-system before starting; recorder errors on start;
 * AppState and audio interruptions for stops; the thresholds below to be confirmed.
 */

/** Space a night of recording needs. Placeholder: Engineering to confirm. */
export const NIGHT_NEEDS_MB = 200;
/** Shortest stretch that can be read on its own (scores). Placeholder: Engineering and Clinical to set. */
export const MIN_READABLE_MINUTES = 120;

export type ProblemCopy = { art: ImageSourcePropType; title: string; reason: string; fix: string };

const ART = {
  space: require('../../assets/problems/space.png'),
  start: require('../../assets/problems/start.png'),
  faint: require('../../assets/problems/faint.png'),
  stopped: require('../../assets/problems/stopped.png'),
  appClosed: require('../../assets/problems/app-closed.png'),
};

// ---------- At bedtime ----------

export type StartProblem = 'space' | 'start';

export const START_COPY: Record<StartProblem, ProblemCopy> = {
  space: {
    art: ART.space,
    title: 'Not enough space to record',
    reason: `We need at least ${NIGHT_NEEDS_MB} MB of space.`,
    fix: 'Clear files you don’t need.',
  },
  start: {
    art: ART.start,
    title: 'Oops! Couldn’t start recording',
    reason: 'Something went wrong somewhere.',
    fix: 'Close the app and try again.',
  },
};

/** Prototype: the problem the next tap on record runs into (set by the demo nav). */
export function setDemoStartProblem(p: StartProblem | null) {
  remember('demoStartProblem', p);
}

/**
 * Checked before recording starts: the problem, or null to go ahead. `retry`: from Try again.
 * Prototype: "not enough space" clears on Try again (as if space was made); "couldn't start" keeps failing.
 */
export function checkCanRecord(retry = false): StartProblem | null {
  const p = recall<StartProblem | null>('demoStartProblem', null);
  if (retry && p === 'space') {
    setDemoStartProblem(null);
    return null;
  }
  return p;
}

// ---------- During the night ----------

/** Back in Airese after another app closed it. */
export const pausedCopy = (at: Date): ProblemCopy => ({
  art: ART.appClosed,
  title: `Recording paused at ${formatClock(fromMinutes(at.getHours() * 60 + at.getMinutes()))}`,
  reason: 'Another app closed Airese.',
  fix: 'Keep Airese open. Just lock your phone.',
});

// ---------- The next morning ----------

export const POOR_COPY: ProblemCopy = {
  art: ART.faint,
  title: 'Couldn’t hear clearly',
  reason: 'The sound was too faint last night.',
  fix: 'Put your phone closer to the bed.',
};

export type StopCause = 'phone' | 'app-closed' | 'space';
export type Stop = { cause: StopCause; savedMinutes: number };

const STOP_WHY: Record<StopCause, { art: ImageSourcePropType; reason: string; fix: string }> = {
  phone: { art: ART.stopped, reason: 'Your phone interrupted it.', fix: 'Keep it charging, with Do Not Disturb on.' },
  'app-closed': { art: ART.appClosed, reason: 'Another app closed Airese.', fix: 'Keep Airese open. Just lock your phone.' },
  space: { art: ART.space, reason: 'Your phone ran out of space.', fix: 'Clear files you don’t need.' },
};

/** When it stopped: "2:14 am". */
export const stopTime = (night: Night, stop: Stop) => formatClock(fromMinutes(night.startMinutes + stop.savedMinutes));

export function stopCopy(night: Night, stop: Stop): ProblemCopy {
  const why = STOP_WHY[stop.cause];
  return { art: why.art, title: `Recording stopped at ${stopTime(night, stop)}`, reason: `${why.reason} ${shortDuration(stop.savedMinutes)} saved.`, fix: why.fix };
}

/** Prototype: the demo nav's stopped nights, on the latest night (?state=stopped-…). */
const DEMO_STOPS: Record<string, Stop> = {
  'stopped-phone': { cause: 'phone', savedMinutes: 189 }, // 3h 9m: enough for scores
  'stopped-app': { cause: 'app-closed', savedMinutes: 145 },
  'stopped-space': { cause: 'space', savedMinutes: 95 }, // too short for scores: clips only
};
export const demoStop = (state?: string): Stop | undefined => (state ? DEMO_STOPS[state] : undefined);

/** Prototype: last night stopped early, for Home's banner (reachable at /home?state=after-stopped-night). */
export const setDemoLastNightStopped = (state: string | null) => remember('demoLastNightStopped', state);
export const demoLastNightStopped = () => recall<string | null>('demoLastNightStopped', null);
