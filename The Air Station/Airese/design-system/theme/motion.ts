/**
 * Airese motion. Two presets, one feel: like settling down for the night.
 * Every animation uses one of these presets; don't hand-tune per screen.
 *
 *   slow: elegant and smooth. Soft start, long gentle settle.
 *   fast: the same character, a little snappier, for quick feedback and getting out of the way.
 *
 * Each preset has a duration and three curves:
 *   easeOut   arriving (comes in, settles into place)
 *   easeIn    leaving (drifts off, gathering pace)
 *   easeInOut moving between two resting states
 *
 * Overlap steps rather than chaining them (use `stagger`), so motion flows.
 * Nothing snaps, bounces or overshoots. Swipes and scrolls follow the finger.
 */
import { Easing, Platform } from 'react-native';

export const motion = {
  slow: {
    duration: 1200,
    easeOut: Easing.bezier(0.3, 0, 0.2, 1),
    easeIn: Easing.bezier(0.47, 0, 0.745, 0.715),
    easeInOut: Easing.bezier(0.37, 0, 0.63, 1),
  },
  fast: {
    duration: 500,
    easeOut: Easing.bezier(0.2, 0, 0, 1),
    easeIn: Easing.bezier(0.4, 0, 0.8, 0.4),
    easeInOut: Easing.bezier(0.45, 0, 0.2, 1),
  },
  /** Looping background life: one full in-and-out of a "breath". */
  ambient: { duration: 9000, easing: Easing.inOut(Easing.sin) },
  /** A light that runs once around the record dial to invite a press, then rests before the next lap. */
  attention: { duration: 1800, rest: 3000, easing: Easing.bezier(0.37, 0, 0.63, 1) },
  /** A tiny shine gliding once along a graph's line (the verdict card), then a long rest. Quiet, occasional. */
  glint: { duration: 2400, rest: 7000, easing: Easing.bezier(0.37, 0, 0.63, 1) },
  /** Offset before a follow-on element, so things arrive in sequence, not all at once. */
  stagger: 350,
  /** The native driver isn't available on web (browser preview only). */
  useNativeDriver: Platform.OS !== 'web',
} as const;
