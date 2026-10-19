/**
 * Airese design tokens (kept minimal: add only when a screen needs it).
 * Source: docs/BRAND.md (Voice & Tone and Visual Language decks, Oct 2026).
 *  - Night-appropriate dark UI, with one warm light. Red only for form errors, never for sleep data.
 *  - Montserrat for titles and buttons; Inter for everything you read (body, small, caption, inputs).
 */
import { Platform, type TextStyle } from 'react-native';

/** Night palette, "Night, with one warm light" (docs/BRAND.md §4). */
const palette = {
  night: '#05070F', // deepest background
  midnight: '#0B1020', // app base colour
  deep: '#19294E', // cards, sheets (deck had #131B2E; updated by design, Oct 2026)
  mist: '#B3BDD3', // muted text (deck had #93A0BB; lightened to pass WCAG AAA 7:1 on Midnight and Deep)
  moon: '#EEF1F7', // text
  breath: '#9DB4FF', // accent: buttons, links
  lamp: '#F4B65F', // the one warm light; use sparingly
  // Data only (charts, data icons; never text, buttons or links). Added Oct 2026 for Recording Details.
  ember: '#FFAA5C', // snoring
  iris: '#B9A3FF', // breathing pauses
  dew: '#8EE3CF', // sleep and rest
  flare: '#FF5A4F', // the one red: loudest snoring in charts, and form-error marks (added Oct 2026; never UI chrome)
} as const;

/**
 * A palette colour at an opacity: alpha(colors.moon, 0.24). Use this for every see-through tint,
 * hairline and wash, so all colour still comes from the palette.
 */
export function alpha(hex: string, opacity: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
}

export const colors = {
  ...palette,
  // Roles: screens use these
  background: palette.midnight,
  surface: palette.deep, // cards, sheets, form groups
  divider: alpha(palette.mist, 0.18), // hairlines between form rows (Mist at 18%)
  text: palette.moon,
  textMuted: palette.mist,
  accent: palette.breath, // primary buttons, links
  onAccent: palette.midnight, // text on accent (white on Breath is too low-contrast)
  error: '#FFA49B', // form-error text: a light tint of Flare (7.5:1 on Deep, 10:1 on Midnight; AAA)
  errorMark: palette.flare, // form-error ring and icon (not text: 4.6:1 on Deep, past the 3:1 for marks)
  urgentAction: '#FF7F72', // the one care action on a repeated pattern (Book a call): Flare lightened; Midnight label 7.7:1 (AAA), 5.3:1 against the wine card
  brand: '#2E3A5A', // Airese navy (logo, decks). Role in the dark UI still open: see BRAND.md §5
  white: '#FFFFFF', // logo on the splash gradient
  scrim: alpha(palette.night, 0.7), // Night at 70%: dims the screen behind sheets

  // Data: one colour per kind of thing, the same everywhere (charts, data icons, legends, score rings).
  // Checked together on Deep and Midnight with the dataviz validator: colour-blind dE 12+, 3:1+ contrast.
  // Breath stays out of charts (it's the UI colour, and too close to Iris for colour-blind readers).
  // Marks and icons only, never text; every chart also labels or shapes its marks.
  dataSnoring: palette.ember,
  dataBreathing: palette.iris,
  dataSleep: palette.dew,
  // Soft tints of the same, for icon badges. Decorative: text on them uses Moon.
  tintSnoring: alpha(palette.ember, 0.14),
  tintBreathing: alpha(palette.iris, 0.14),
  tintSleep: alpha(palette.dew, 0.12),
  tintWarm: alpha(palette.lamp, 0.10), // Lamp wash, for the meaning card
  tintAccent: alpha(palette.breath, 0.16), // Breath wash: icon badges on profile tiles, the selected gender tile
} as const;

/** Gradient stops, top to bottom. */
export const gradients = {
  // Splash: night sky brightening to a clear blue (Figma "iPhone 16 & 17 Pro - 1").
  // Top stop is the app background on purpose: when the splash falls away, the top
  // colour is what's left, so it hands over seamlessly to the next screen.
  splash: [
    { offset: 0, color: palette.midnight },
    { offset: 0.5, color: '#1C3470' },
    { offset: 1, color: '#225ED8' },
  ],
  // Hero card (a night's takeaway): Deep lifting into the splash's mid blue. Moon text stays at 11:1+.
  hero: [
    { offset: 0, color: '#1C3470' },
    { offset: 1, color: palette.deep },
  ],
  // Hero card, unusual night: a subtle warm dusk over Deep (Lamp glow). Moon text 12:1.
  heroWatch: [
    { offset: 0, color: '#3D2E3C' },
    { offset: 1, color: palette.deep },
  ],
  // Hero card, repeated pattern: wine into plum (Flare glow). Moon text 11.4:1+.
  heroUrgent: [
    { offset: 0, color: '#5A1C24' },
    { offset: 1, color: '#2E1830' },
  ],
} as const;

export type ColorName = keyof typeof colors;

/**
 * Snoring loudness, one colour per level (the `Intensity` keys): cyan, yellow, orange, Flare red.
 * Charts and graphs only (fills, bars, legends), never text, buttons or UI chrome. The snoring chart
 * pins each colour to its level's decibels, so only truly loud snoring reaches red.
 */
export const loudness = { light: '#2EC9EA', moderate: '#FFD84A', loud: '#FF9A3C', veryLoud: palette.flare } as const;

/**
 * The loudness colours as one ramp, quiet to very loud. Every "how much, how loud" mark for snoring and
 * breathing pauses (rings, bars, scales, the timeline) runs through it and ends in the colour its value
 * reaches on its own scale, so a low value stays cyan and only near the top reaches red.
 */
export const loudnessRamp = [loudness.light, loudness.moderate, loudness.loud, loudness.veryLoud] as const;

/** The colour at `t` (0 to 1) along evenly spaced ramp stops, blended between the nearest two. */
export function rampColor(ramp: readonly string[], t: number) {
  const pos = Math.max(0, Math.min(1, t)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(pos));
  const k = pos - i;
  const ch = (h: string, j: number) => parseInt(h.slice(1 + j * 2, 3 + j * 2), 16);
  return `rgb(${[0, 1, 2].map((j) => Math.round(ch(ramp[i], j) + (ch(ramp[i + 1], j) - ch(ramp[i], j)) * k)).join(', ')})`;
}

/** Gradient stops for a mark that fills `to` (0 to 1) of its scale: the ramp up to the colour it reaches. */
export function rampStops(ramp: readonly string[], to: number) {
  const f = Math.max(0.001, Math.min(1, to));
  const inner = ramp.map((c, i) => ({ at: i / (ramp.length - 1), color: c })).filter((s) => s.at < f);
  return [...inner.map((s) => ({ offset: s.at / f, color: s.color })), { offset: 1, color: rampColor(ramp, f) }];
}

/**
 * A data kind's colour at a point on its scale. Snoring and breathing pauses (more is worse) take the
 * loudness ramp; sleep keeps Dew; rest (a mix of everything) is neutral Moon.
 */
export function dataInk(tone: 'snoring' | 'breathing' | 'sleep' | 'rest', fraction: number) {
  if (tone === 'snoring' || tone === 'breathing') return rampColor(loudnessRamp, Math.max(0.04, fraction));
  return tone === 'sleep' ? palette.dew : palette.moon;
}

/** 4-pt grid */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  gutter: 20, // screen edges: the one side inset for every screen (iOS standard)
} as const;

export const radius = {
  md: 12,
  lg: 16, // cards, form groups
  xl: 20, // banners
  card: 24, // data cards (Recording Details)
  pill: 999, // buttons
  sheet: 28, // bottom sheet corners
} as const;

/* One loaded font file per family and weight (see src/app/_layout.tsx).
   On web, plain "Montserrat" / "Inter" (Google Fonts) are the fallbacks used by the shared preview link. */
type Weight = '400' | '600';
type Family = 'Montserrat' | 'Inter';
const nativeFamily: Record<Family, Record<Weight, string>> = {
  Montserrat: { '400': 'Montserrat_400Regular', '600': 'Montserrat_600SemiBold' },
  Inter: { '400': 'Inter_400Regular', '600': 'Inter_600SemiBold' },
};
const font = (family: Family, w: Weight): TextStyle =>
  Platform.OS === 'web'
    ? { fontFamily: `${nativeFamily[family][w]}, ${family}, system-ui, sans-serif`, fontWeight: w }
    : { fontFamily: nativeFamily[family][w] };

/**
 * Type scale. Titles (title, headline, heading) and buttons in Montserrat; reading text in Inter.
 * Base 16; steps of about 1.25 (major third), rounded to whole sizes,
 * Reading text has line height of at least 1.5x (WCAG 1.4.8). Nothing smaller than 12: text is read half-asleep at 6 am.
 *   12 · 14 · 16 · 20 · 24 · 32
 */
export const type = {
  title: { ...font('Montserrat', '600'), fontSize: 32, lineHeight: 40 }, // rare: big single statements
  headline: { ...font('Montserrat', '600'), fontSize: 24, lineHeight: 32 }, // screen headline (onboarding)
  heading: { ...font('Montserrat', '600'), fontSize: 20, lineHeight: 28 }, // section and sheet titles
  body: { ...font('Inter', '400'), fontSize: 16, lineHeight: 24 }, // base: all reading text
  small: { ...font('Inter', '400'), fontSize: 14, lineHeight: 22 }, // secondary detail
  caption: { ...font('Inter', '400'), fontSize: 12, lineHeight: 18 }, // the minimum: credits, fine print
  button: { ...font('Montserrat', '400'), fontSize: 16, lineHeight: 20 }, // regular (Oct 2026: two weights only, regular and semibold)
  buttonSmall: { ...font('Montserrat', '400'), fontSize: 14, lineHeight: 18 }, // mini buttons in banners and cards
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
