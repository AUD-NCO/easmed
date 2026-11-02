import { breathingPerHour, type NightDetails } from './nightDetails';

/**
 * Where tonight sits on a simple scale, for the score cards in "All details".
 * Compared with guide ranges and the user's own usual, never with other people (design-system/docs/BRAND.md).
 *
 * PLACEHOLDER RANGES for the prototype: Clinical must confirm every range and word before release.
 * Words stay calm: no "bad", no alarm. The scale is drawn in the data's colour, lighter to stronger.
 */
export type Zone = { upTo: number; word: string };
export type Benchmark = {
  key: 'sound' | 'rest' | 'snoring' | 'breathing' | 'sleep' | 'loudness';
  name: string;
  tone: 'snoring' | 'breathing' | 'sleep' | 'rest';
  value: number;
  display: string; // tonight, as shown
  min: number;
  max: number;
  zones: Zone[]; // in order along the scale
  higherIsBetter: boolean;
  usual?: number;
  guide: string; // the range in words
  explain: string;
};

export function zoneOf(b: Benchmark) {
  return b.zones.find((z) => b.value <= z.upTo) ?? b.zones[b.zones.length - 1];
}

export type Tier = 'ordinary' | 'moderate' | 'severe';
const TIERS: Tier[] = ['ordinary', 'moderate', 'severe'];

/**
 * The night's tier: the higher of its Snore Score band and its breathing pauses band (low, moderate,
 * high → ordinary, moderate, severe). No adding up: two moderates are still moderate.
 * The bands are the zones below (Snore Score 0–35, 36–70, 71–100; pauses under 5, 5–14.9, 15+ an hour):
 * provisional, to be confirmed by Engineering and tuned with real data.
 */
export function classify(d: NightDetails): Tier {
  const marks = benchmarks(d);
  const band = (key: Benchmark['key']) => {
    const b = marks.find((m) => m.key === key)!;
    return b.zones.indexOf(zoneOf(b));
  };
  return TIERS[Math.max(band('sound'), band('breathing'))];
}

export function benchmarks(d: NightDetails): Benchmark[] {
  const hours = d.sleepMinutes / 60;
  const snoringPct = Math.round((d.snoringMinutes / d.night.minutes) * 100);
  const perHour = breathingPerHour(d);
  return [
    {
      key: 'sound',
      name: 'Snore Score',
      tone: 'snoring',
      value: d.soundScore,
      display: String(d.soundScore),
      min: 0,
      max: 100,
      zones: [
        // Provisional bands agreed with the team (Nov 2026): 0–35, 36–70, 71–100. To be tuned with real data.
        { upTo: 35, word: 'Low' },
        { upTo: 70, word: 'Moderate' },
        { upTo: 100, word: 'High' },
      ],
      higherIsBetter: false,
      guide: '35 or under is a quiet night',
      explain: 'How loud your snoring was and how much of the night it filled, out of 100. Lower is quieter.',
    },
    {
      key: 'rest',
      name: 'Rest Score',
      tone: 'rest',
      value: d.restScore,
      display: String(d.restScore),
      min: 0,
      max: 100,
      zones: [
        { upTo: 59, word: 'Low' },
        { upTo: 79, word: 'Fair' },
        { upTo: 100, word: 'Good' },
      ],
      higherIsBetter: true,
      guide: '80 or more is a well-settled night',
      explain: 'How settled your night sounded: how long you slept, and how often snoring or waking broke it up.',
    },
    {
      key: 'snoring',
      name: 'Snoring',
      tone: 'snoring',
      value: snoringPct,
      display: `${snoringPct}%`,
      min: 0,
      max: 40,
      zones: [
        { upTo: 10, word: 'Light' },
        { upTo: 25, word: 'Moderate' },
        { upTo: 40, word: 'High' },
      ],
      higherIsBetter: false,
      usual: d.baseline ? Math.round((d.baseline.snoringMinutes / d.night.minutes) * 100) : undefined,
      guide: 'Under 10% of the night is light',
      explain: 'How much of the recording Airese heard snoring.',
    },
    {
      key: 'breathing',
      name: 'Breathing pauses',
      tone: 'breathing',
      value: perHour,
      display: `${perHour} an hour`,
      min: 0,
      max: 30,
      zones: [
        { upTo: 4.9, word: 'Rarely' },
        { upTo: 14.9, word: 'Sometimes' },
        { upTo: 30, word: 'Often' },
      ],
      higherIsBetter: false,
      usual: d.baseline ? Math.round((d.baseline.breathingEvents / hours) * 10) / 10 : undefined,
      guide: 'Fewer than 5 an hour is rare',
      explain: 'Moments when your breathing sounded paused or uneven while you snored, per hour of sleep. A count, not a diagnosis.',
    },
    {
      key: 'sleep',
      name: 'Sleep',
      tone: 'sleep',
      value: Math.round(hours * 10) / 10,
      display: `${Math.floor(hours)} hr ${Math.round((hours % 1) * 60)} min`,
      min: 4,
      max: 11,
      zones: [
        { upTo: 6.99, word: 'Short' },
        { upTo: 9, word: 'In range' },
        { upTo: 11, word: 'Long' },
      ],
      higherIsBetter: true,
      guide: '7 to 9 hours suits most adults',
      explain: 'Recording time minus the stretches where you sounded awake or restless. An estimate from sound alone.',
    },
    {
      key: 'loudness',
      name: 'Snoring loudness',
      tone: 'snoring',
      value: d.averageDb,
      display: `${d.averageDb} dB`,
      min: 30,
      max: 70,
      zones: [
        { upTo: 45, word: 'Quiet' },
        { upTo: 55, word: 'Medium' },
        { upTo: 70, word: 'Loud' },
      ],
      higherIsBetter: false,
      usual: d.baseline?.averageDb,
      guide: 'About 40 dB is a quiet room; 60 dB is conversation',
      explain: 'The average loudness of your snoring, from your phone’s microphone. Phones differ, so compare nights rather than reading the number alone.',
    },
  ];
}
