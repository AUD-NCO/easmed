import { formatClock, fromMinutes } from './time';
import { sampleNights, type Night } from './recordings';

/**
 * Recording Details: what one night held. Shape follows the PRD (§17), trimmed to what the
 * prototype shows. Prototype: sample data, generated from the night's id so a night always
 * looks the same. Engineering: fill from on-device analysis; every insight needs a confidence
 * threshold (§18) and must never turn a low-confidence output into a health statement.
 */

/** How the page should read (PRD §14–16, §11). */
export type NightState =
  | 'processing' // analysis not finished: no cards yet
  | 'poor' // couldn't hear clearly: no scores
  | 'stopped' // recording stopped early: what was saved, and what it can still tell (lib/recordingIssues)
  | 'steady' // ordinary night
  | 'unusual' // one night out of the ordinary
  | 'pattern'; // the same thing on many recent nights (ladder: pattern → suggest → act)

export type Intensity = 'light' | 'moderate' | 'loud' | 'veryLoud';
export type ClipType = 'Loud snoring' | 'Repeated snoring' | 'Light snoring' | 'Interrupted breathing';

/** Minutes are from the start of the recording. */
export type SnoreSegment = { start: number; end: number; intensity: Intensity };
/** A stretch inside a clip worth pointing at, as fractions of the clip (0–1). */
export type ClipMark = { kind: 'pause' | 'breath'; from: number; to: number };
export type Clip = { id: string; at: number; seconds: number; type: ClipType; peaks: number[]; marks?: ClipMark[] };

export type NightDetails = {
  night: Night;
  state: NightState;
  snoringMinutes: number;
  segments: SnoreSegment[];
  breathingEvents: number[]; // minute offsets
  sleepMinutes: number;
  awakenings: number;
  clips: Clip[]; // in time order
  featured: Clip[]; // the few that best explain the night (not just the loudest)
  averageDb: number;
  peakDb: number;
  intensityShare: Record<Intensity, number>; // % of snoring time
  restScore: number;
  soundScore: number; // 0–100: loudness part + snoring part
  soundParts: { loudness: number; snoring: number }; // each 0–50
  baseline: { snoringMinutes: number; breathingEvents: number; averageDb: number };
  patternNights?: { of: number; seen: number }; // e.g. 5 of the last 7
  awake: { start: number; end: number }[]; // stretches that sounded awake or restless
  recent: { day: string; snoringMinutes: number; tonight: boolean }[]; // last 7 nights, oldest first
  bins: number[]; // snoring loudness in 3-minute steps across the night, 0 (none) to 1 (very loud)
  envelope: number[]; // sound level in dB every SAMPLE_SECONDS across the night (the interactive chart)
  coughs: number[]; // minute offsets
  movements: number[]; // minute offsets
  hourly: { label: string; minutes: number }[]; // snoring minutes in each hour of the recording
};

export const BIN_MINUTES = 3;
export const SAMPLE_SECONDS = 20;
export const SAMPLES_PER_MINUTE = 60 / SAMPLE_SECONDS;
const SEGMENT_DB: Record<Intensity, number> = { light: 47, moderate: 53, loud: 60, veryLoud: 67 };

// Small, seeded random so each night is stable.
function seeded(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INTENSITIES: Intensity[] = ['light', 'moderate', 'loud', 'veryLoud'];

export function nightDetails(night: Night, state: NightState): NightDetails {
  const rand = seeded(night.id + state);
  const between = (a: number, b: number) => a + rand() * (b - a);
  const heavy = state === 'pattern' || state === 'unusual';

  // Snoring: stretches laid out through the night with quiet gaps between. A repeated-pattern night
  // snores for long stretches most of the night; an ordinary one in a few short bursts.
  const shape = state === 'pattern' ? { count: 14, len: [12, 30], gap: [3, 14] } : heavy ? { count: 10, len: [8, 22], gap: [8, 30] } : { count: 6, len: [3, 9], gap: [20, 60] };
  const segments: SnoreSegment[] = [];
  let at = between(15, 40);
  for (let i = 0; i < shape.count; i++) {
    const start = Math.round(at);
    const end = Math.min(night.minutes - 10, Math.round(at + between(shape.len[0], shape.len[1])));
    if (end - start < 3) break;
    const level = Math.min(3, Math.floor(rand() * (heavy ? 4 : 2.6)));
    segments.push({ start, end, intensity: INTENSITIES[level] });
    at = end + between(shape.gap[0], shape.gap[1]);
  }
  const snoringMinutes = segments.reduce((sum, s) => sum + (s.end - s.start), 0);

  // Breathing interruptions: only while snoring (longer stretches hold more). Counts give a realistic rate an hour.
  const breathingCount = state === 'pattern' ? 118 : state === 'unusual' ? 52 : 11;
  const breathingEvents = Array.from({ length: breathingCount }, () => {
    let r = rand() * snoringMinutes;
    const s = segments.find((seg) => (r -= seg.end - seg.start) < 0) ?? segments[segments.length - 1];
    return Math.round(between(s.start + 1, s.end - 1));
  }).sort((a, b) => a - b);

  // Clips: up to 8 snoring periods (spread through the night) plus breathing pauses; 12 in all.
  // A breathing clip shows the pause (near silence) and the louder breath after it.
  const clips: Clip[] = [];
  const peaks = () => Array.from({ length: 18 }, () => 0.25 + rand() * 0.75);
  const PAUSE: ClipMark = { kind: 'pause', from: 0.3, to: 0.56 };
  const BREATH: ClipMark = { kind: 'breath', from: 0.6, to: 0.78 };
  const pausePeaks = () =>
    peaks().map((p, i, all) => {
      const f = (i + 0.5) / all.length;
      return f >= PAUSE.from && f < PAUSE.to ? 0.06 : f >= BREATH.from && f < BREATH.to ? 0.9 + rand() * 0.1 : p;
    });
  const keep = Math.min(8, segments.length);
  const sampled = Array.from({ length: keep }, (_, k) => segments[Math.floor((k * segments.length) / keep)]);
  sampled.forEach((s, i) =>
    clips.push({
      id: `c${i}`,
      at: Math.round(between(s.start, s.end)),
      seconds: Math.round(between(14, 40)),
      type: s.intensity === 'light' ? 'Light snoring' : s.intensity === 'moderate' ? 'Repeated snoring' : 'Loud snoring',
      peaks: peaks(),
    }),
  );
  const gap = Math.max(1, Math.floor(breathingEvents.length / (12 - clips.length)));
  for (let i = Math.floor(gap / 2); clips.length < 12 && i < breathingEvents.length; i += gap)
    clips.push({ id: `b${i}`, at: breathingEvents[i], seconds: Math.round(between(12, 24)), type: 'Interrupted breathing', peaks: pausePeaks(), marks: [PAUSE, BREATH] });
  clips.sort((a, b) => a.at - b.at);

  const share = INTENSITIES.map((k) => segments.filter((s) => s.intensity === k).reduce((n, s) => n + s.end - s.start, 0));
  const total = share.reduce((a, b) => a + b, 0) || 1;
  const intensityShare = Object.fromEntries(INTENSITIES.map((k, i) => [k, Math.round((share[i] / total) * 100)])) as Record<Intensity, number>;

  const awakenings = Math.round(between(1, heavy ? 5 : 3));
  const awake = Array.from({ length: awakenings }, () => {
    const start = Math.round(between(10, night.minutes - 30));
    return { start, end: start + Math.round(between(5, 14)) };
  }).sort((a, b) => a.start - b.start);
  const baselineSnoring = state === 'steady' ? Math.round(snoringMinutes * between(1.3, 1.7)) : Math.round(snoringMinutes * between(0.45, 0.65));
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const recent = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(night.date.getFullYear(), night.date.getMonth(), night.date.getDate() - (6 - i));
    const tonight = i === 6;
    // Earlier nights sit around the usual; in a pattern most of them run high too.
    const level = state === 'pattern' && i % 3 !== 0 ? between(1.4, 1.9) : between(0.7, 1.3);
    return { day: DAYS[date.getDay()], snoringMinutes: tonight ? snoringMinutes : Math.round(baselineSnoring * level), tonight };
  });
  // Fine-grained loudness for the timeline: each snoring period, with a little natural variation.
  const LEVEL_VALUE: Record<Intensity, number> = { light: 0.35, moderate: 0.55, loud: 0.78, veryLoud: 0.95 };
  const bins = Array.from({ length: Math.ceil(night.minutes / BIN_MINUTES) }, (_, i) => {
    const m = i * BIN_MINUTES + BIN_MINUTES / 2;
    const s = segments.find((seg) => m >= seg.start && m < seg.end);
    return s ? Math.min(1, Math.max(0.15, LEVEL_VALUE[s.intensity] + (rand() - 0.5) * 0.3)) : 0;
  });
  const hourly = Array.from({ length: Math.ceil(night.minutes / 60) }, (_, h) => ({
    label: formatClock(fromMinutes(night.startMinutes + h * 60)).replace(/:\d\d/, ''),
    minutes: segments.reduce((n, seg) => n + Math.max(0, Math.min(seg.end, (h + 1) * 60) - Math.max(seg.start, h * 60)), 0),
  }));

  // The recent average is exactly the average of the earlier bars, so chart and numbers agree.
  // Fine-grained sound level: quiet room between snoring; inside it, a level that drifts and
  // flickers breath by breath; a breathing pause drops to near silence, then a louder breath.
  const envelope = Array.from({ length: night.minutes * SAMPLES_PER_MINUTE }, (_, i) => {
    const m = i / SAMPLES_PER_MINUTE;
    const s = segments.find((seg) => m >= seg.start && m < seg.end);
    if (!s) return 31 + rand() * 2.5;
    const edge = Math.min(1, (m - s.start) / 1.5, (s.end - m) / 1.5); // fade in and out over ~1.5 min
    const level = SEGMENT_DB[s.intensity] + 5 * Math.sin(i / 9 + s.start) + (rand() - 0.5) * 9;
    return 33 + (level - 33) * Math.max(0.2, edge);
  });
  for (const e of breathingEvents) {
    const i = Math.round(e * SAMPLES_PER_MINUTE);
    if (envelope[i] == null || envelope[i] < 40) continue; // only shows where there was snoring
    envelope[i] = 33 + rand() * 3;
    if (i + 1 < envelope.length) envelope[i + 1] = Math.min(84, envelope[i + 1] + 8 + rand() * 6); // the breath after
  }
  const snoringSamples = envelope.filter((db) => db >= 42);
  const averageDb = Math.round(snoringSamples.reduce((a, b) => a + b, 0) / Math.max(1, snoringSamples.length));
  const peakDb = Math.round(Math.max(...envelope));
  const coughs = Array.from({ length: Math.round(between(1, 5)) }, () => Math.round(between(10, night.minutes - 10))).sort((a, b) => a - b);
  const movements = [...awake.map((w) => w.start), ...Array.from({ length: Math.round(between(3, 7)) }, () => Math.round(between(5, night.minutes - 5)))].sort((a, b) => a - b);

  // Featured: at most 3 moments to hear: the two loudest snoring episodes and a breathing pause
  // (the clearest proof), in time order. No pause that night: just the two snoring episodes.
  const levelAt = (c: Clip) => envelope[Math.min(envelope.length - 1, c.at * SAMPLES_PER_MINUTE)] ?? 0;
  const snoringClips = clips.filter((c) => c.type !== 'Interrupted breathing');
  const pauseClips = clips.filter((c) => c.type === 'Interrupted breathing');
  const loudest = [...snoringClips].sort((a, b) => levelAt(b) - levelAt(a)).slice(0, 2);
  const pause = pauseClips[Math.floor(pauseClips.length / 2)];
  const featured = [...loudest, ...(pause ? [pause] : [])].sort((a, b) => a.at - b.at);

  const earlier = recent.filter((r) => !r.tonight);
  const usualSnoring = Math.round(earlier.reduce((n, r) => n + r.snoringMinutes, 0) / earlier.length);
  const soundParts = soundScoreParts(averageDb, snoringMinutes / night.minutes);
  return {
    night,
    state,
    snoringMinutes,
    segments,
    breathingEvents,
    sleepMinutes: night.minutes - Math.round(between(12, 30)),
    awakenings,
    awake,
    recent,
    bins,
    envelope,
    coughs,
    movements,
    hourly,
    clips,
    featured,
    averageDb,
    peakDb,
    intensityShare,
    restScore: Math.round(between(heavy ? 55 : 72, heavy ? 68 : 86)),
    soundScore: soundParts.loudness + soundParts.snoring,
    soundParts,
    baseline: {
      snoringMinutes: usualSnoring,
      breathingEvents: state === 'steady' ? breathingCount + 4 : state === 'unusual' ? Math.round(breathingCount * 0.4) : Math.round(breathingCount * 0.9),
      averageDb: Math.round(between(44, 50)),
    },
    patternNights: state === 'pattern' ? { of: 7, seen: 5 } : undefined,
  };
}

/**
 * Sound Score, 0–100, from two halves: how loud the snoring was (35 dB scores 0, 65 dB or more 50)
 * and how much of the night it filled (none scores 0, 40% or more 50). Lower is quieter.
 * PLACEHOLDER formula for the prototype: Engineering and Clinical to define the real one.
 */
export function soundScoreParts(averageDb: number, snoringShare: number) {
  const clamp = (n: number) => Math.round(Math.max(0, Math.min(50, n)));
  return { loudness: clamp(((averageDb - 35) / 30) * 50), snoring: clamp((snoringShare / 0.4) * 50) };
}

/** Breathing interruptions per hour of sleep, to one decimal. */
export const breathingPerHour = (d: NightDetails) => Math.round((d.breathingEvents.length / (d.sleepMinutes / 60)) * 10) / 10;

/** Sound level in dB at a minute of the night (from the envelope). */
export const dbAt = (d: NightDetails, minute: number) => Math.round(d.envelope[Math.min(d.envelope.length - 1, Math.max(0, Math.round(minute * SAMPLES_PER_MINUTE)))]);

/** Minutes of snoring louder than a conversation (60 dB). */
export const loudMinutes = (d: NightDetails) => Math.round(d.envelope.filter((db) => db >= 60).length / SAMPLES_PER_MINUTE);

// ---------- Plain-language helpers ----------

export const clockAt = (d: NightDetails, minute: number) => formatClock(fromMinutes(d.night.startMinutes + minute));

/** "2 and 4 am": the two-hour window that held the most snoring. */
export function busiestWindow(d: NightDetails) {
  let best = 0;
  let bestStart = 0;
  for (let start = 0; start + 120 <= d.night.minutes; start += 15) {
    const sum = d.segments.reduce((n, s) => n + Math.max(0, Math.min(s.end, start + 120) - Math.max(s.start, start)), 0);
    if (sum > best) {
      best = sum;
      bestStart = start;
    }
  }
  // Round the window's start to the nearest hour on the clock, then name the two-hour span.
  const startClock = Math.round((d.night.startMinutes + bestStart) / 60) * 60;
  const a = fromMinutes(startClock);
  const b = fromMinutes(startClock + 120);
  const p = (t: typeof a) => t.period.toLowerCase();
  return p(a) === p(b) ? `${a.hour} and ${b.hour} ${p(b)}` : `${a.hour} ${p(a)} and ${b.hour} ${p(b)}`;
}

export type Trend = 'less' | 'same' | 'more';
export const trend = (value: number, usual: number): Trend => (value < usual * 0.8 ? 'less' : value > usual * 1.2 ? 'more' : 'same');
export const trendWords: Record<Trend, string> = { less: 'Less than usual', same: 'About usual', more: 'More than usual' };

// A repeated pattern names itself plainly; the headline varies from night to night so it isn't tuned out.
const PATTERN_HEADLINES = ['Time to get this checked', 'This keeps happening', 'Not just one night', 'Your breathing needs a look'];

/** Headline and one short, general line under it (PRD §5): no numbers, two lines at most. Plain, factual, calm. */
export function summary(d: NightDetails): { headline: string; body: string } {
  switch (d.state) {
    case 'unusual':
      return { headline: 'More snoring than usual', body: 'You snored more than you usually do. Something small may help tonight.' };
    case 'pattern':
      return { headline: PATTERN_HEADLINES[d.night.date.getDate() % PATTERN_HEADLINES.length], body: 'Your breathing has paused often on several recent nights.' };
    default:
      return { headline: 'A steadier night', body: 'Your breathing was steadier than on your recent nights.' };
  }
}


/** Plain explanations for L2 sheets. Exact definitions to come from Product, Engineering and Clinical. */
export const EXPLAIN = {
  breathing: { title: 'Breathing pauses', body: 'Moments when your breathing sounded like it paused or became uneven, counted per hour of sleep. Airese counts them; it doesn’t diagnose anything.' },
  privacy: { title: 'Private by default', body: 'Your recordings stay on your phone. You choose if and when to share anything.' },
  snoring: { title: 'Snoring', body: 'The total time Airese heard snoring, and how much of the recording that was.' },
  loudness: { title: 'Sound levels', body: 'How loud the snoring was, measured by your phone’s microphone. Phones differ, so compare nights rather than reading the numbers on their own.' },
  sleep: { title: 'Estimated sleep', body: 'Recording time minus the stretches where you sounded awake or restless. An estimate from sound alone.' },
};
export type ExplainKey = keyof typeof EXPLAIN;

/** What to call a clip on screen: what was heard, plainly. */
export const CLIP_LABEL: Record<ClipType, string> = { 'Loud snoring': 'Loud snoring', 'Repeated snoring': 'Steady snoring', 'Light snoring': 'Light snoring', 'Interrupted breathing': 'Breathing pause' };

export const INTENSITY_LABEL: Record<Intensity, string> = { light: 'Light', moderate: 'Moderate', loud: 'Loud', veryLoud: 'Very loud' };


/**
 * Prototype: what each sample night shows, for the Reports calendar and the report on show.
 * Mostly ordinary nights, with the odd unusual night
 * and a repeated pattern in the most recent week.
 */
export function sampleState(night: Night, all: Night[]): NightState {
  const i = all.findIndex((n) => n.id === night.id);
  if (i === 1 || i === 3) return 'pattern';
  if (i === 4 || i === 6) return 'unusual'; // 4: one in the current month, so the calendar shows every kind
  return 'steady';
}

const STATES: NightState[] = ['processing', 'poor', 'steady', 'unusual', 'pattern'];

/** The state to show: a demo override (?state=…) if valid, else the sample night's own. */
export function nightState(night: Night, override?: string): NightState {
  if (override?.startsWith('stopped-')) return 'stopped';
  if (override === 'option-2') return 'pattern'; // the repeated-pattern night, laid out as Option 2 (NightScreen)
  if (override && (STATES as string[]).includes(override)) return override as NightState;
  return sampleState(night, sampleNights());
}

/** The night minus the awake stretches. */
export function asleepStretches(d: NightDetails) {
  const out: { start: number; end: number }[] = [];
  let at = 0;
  for (const w of d.awake) {
    if (w.start > at) out.push({ start: at, end: w.start });
    at = Math.max(at, w.end);
  }
  if (at < d.night.minutes) out.push({ start: at, end: d.night.minutes });
  return out;
}

/** Compact duration for big numbers: "7h 36m", "36m". One size, no small units. */
export function shortDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
