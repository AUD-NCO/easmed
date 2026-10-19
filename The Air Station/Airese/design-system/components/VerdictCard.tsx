import React, { useEffect, useId, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors, motion, radius, space, useReducedMotion, type ColorName } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { type IconName } from './Icon';
import { HeroBackground } from './InsightCard';

export type Mood = 'calm' | 'watch' | 'urgent';

/**
 * The night's next step, by mood: its colour wherever it shows (this card, and the page's sticky footer
 * once the card has scrolled away), so the two always match. Midnight label on each.
 */
export const VERDICT_ACTION = {
  calm: 'accent', // Breath
  watch: 'lamp', // Lamp: the one warm light, for the action (Midnight on Lamp, 10:1)
  urgent: 'urgentAction', // coral: the one care action on a repeated pattern (BRAND §4); Midnight on it, 7.7:1
} as const satisfies Record<Mood, ColorName>;

/** The trend line's colour by mood. All UI colours from the palette (BRAND §4). */
const LINE: Record<Mood, ColorName> = { calm: 'accent', watch: 'lamp', urgent: 'flare' };

/**
 * The night's verdict, at the top of Recording Details: headline, a sentence or two, and the one
 * next step, over the card's mood colours (blue, warm dusk, wine into plum).
 * Behind the words, the night's context as a graph across the whole card, drawn from real data:
 * the last seven nights of snoring with tonight at the right edge. The shape is the data's; how high
 * it reaches follows the verdict (which the words already state), so the card's urgency reads at a
 * glance: a steady week is a low, nearly flat line, an unusual night climbs to mid-card. A repeated
 * pattern is drawn, not plotted (PATTERN_SHAPE): a steady climb across the whole card.
 * The graph is decorative for screen readers: the words say the same thing.
 * Arrives with the card: rises into place (slow ease-out); Reduce Motion: fades in.
 */
export function VerdictCard({
  mood,
  title,
  body,
  values,
  action,
}: {
  mood: Mood;
  title: string;
  body: string;
  /** Oldest first; the last value is tonight. */
  values: number[];
  action: { label: string; icon?: IconName; onPress: () => void };
}) {
  const [textBottom, setTextBottom] = useState(0); // where the words end: behind them the graph stays within the contrast budget
  return (
    <View style={styles.card}>
      <HeroBackground mood={mood} />
      {textBottom > 0 && <TrendBackdrop values={values} mood={mood} color={colors[LINE[mood]]} textBottom={textBottom} />}
      <View onLayout={(e) => setTextBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
        <AppText variant="heading" color="text" accessibilityRole="header">
          {title}
        </AppText>
        <AppText color="text" style={{ marginTop: space.sm }}>
          {body}
        </AppText>
      </View>
      <Button label={action.label} icon={action.icon} color={VERDICT_ACTION[mood]} onPress={action.onPress} style={styles.button} />
    </View>
  );
}

/**
 * Repeated pattern: not a plot but a picture of one, as if zoomed out over many nights: a long,
 * steady climb from bottom left to top right with small natural wobbles. The words carry the facts
 * ("5 of the last 7 nights"); this only shows the shape of a pattern building up.
 */
const PATTERN_SHAPE = [0.02, 0.1, 0.07, 0.2, 0.27, 0.24, 0.38, 0.47, 0.44, 0.58, 0.66, 0.63, 0.77, 0.85, 0.83, 0.96, 1];

/** How high the graph may reach, by mood: [lowest point, highest point]. */
/** As % down the card: calm runs high behind the title (a light field under the words), watch climbs, urgent fills the card. */
const BAND: Record<Mood, [number, number]> = { calm: [30, 16], watch: [78, 24], urgent: [104, -2] };

/**
 * Readability budget (WCAG 2.2 AAA, 1.4.6): behind the words, everything together (card gradient, the
 * glow at its brightest, the fill, the line, the shine) must keep Moon body text at 7:1 or more.
 * Worked out per mood against each card's brightest point: fill 4%, line 6 to 14% behind the words
 * (≥ 7.2:1). Below the words (behind the button, no text) the graph can be fully seen.
 */
const INK: Record<Mood, { fill: [number, number]; line: [number, number]; shine: number }> = {
  //            behind words, below words
  calm: { fill: [0.04, 0.22], line: [0.06, 0.5], shine: 0.08 },
  watch: { fill: [0.04, 0.2], line: [0.07, 0.5], shine: 0.08 },
  urgent: { fill: [0.04, 0.22], line: [0.14, 0.55], shine: 0.14 },
};

/**
 * Area graph under the words, to the card's edges (drawn in points, measured on layout).
 * The values' own range is mapped into the mood's band, so the shape is true and the height is the verdict's.
 * On load, the shine draws it: the line and its fill grow from left to right with the shine at the tip
 * (glint preset, after the card's stagger). Then, after a long rest, the shine glides along the finished
 * line now and then. Reduce Motion: the graph is simply there, no shine.
 * Width can't use the native driver, so both run on the JS driver (one small view each).
 */
function TrendBackdrop({ values, mood, color, textBottom }: { values: number[]; mood: Mood; color: string; textBottom: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduced = useReducedMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const draw = useRef(new Animated.Value(0)).current; // 0 → 1: the line drawn from left to right
  const pass = useRef(new Animated.Value(0)).current; // 0 → 1: a later shine along the finished line
  const measured = size.w > 0;
  useEffect(() => {
    if (!measured) return;
    if (reduced) return draw.setValue(1);
    const { duration, rest, easing } = motion.glint;
    const run = Animated.sequence([
      Animated.timing(draw, { toValue: 1, duration, delay: motion.stagger, easing, useNativeDriver: false }),
      Animated.loop(
        Animated.sequence([
          Animated.delay(rest),
          Animated.timing(pass, { toValue: 1, duration, easing, useNativeDriver: false }),
          Animated.timing(pass, { toValue: 0, duration: 0, useNativeDriver: false }),
        ]),
      ),
    ]);
    run.start();
    return () => run.stop();
  }, [measured, reduced, draw, pass]);

  const series = mood === 'urgent' ? PATTERN_SHAPE : values;
  const { w, h } = size;
  const [low, high] = BAND[mood];
  const min = Math.min(...series);
  const span = Math.max(...series) - min || 1;
  const pts = series.map((v, i) => ({ x: (i / Math.max(1, series.length - 1)) * w, y: ((low - ((v - min) / span) * (low - high)) / 100) * h }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const ink = INK[mood];
  const edge = h ? Math.min(1, textBottom / h) : 1; // where the words end, as a fraction of the card

  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={StyleSheet.absoluteFill}
    >
      {w > 0 && series.length > 1 && (
        <>
          {/* Revealed from the left as it's drawn */}
          <Animated.View style={{ width: draw.interpolate({ inputRange: [0, 1], outputRange: [0, w] }), height: h, overflow: 'hidden' }}>
          <Svg width={w} height={h}>
            <Defs>
              {(['fill', 'line'] as const).map((k) => (
                <LinearGradient key={k} id={`${k}${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={h}>
                  <Stop offset="0" stopColor={color} stopOpacity={ink[k][0]} />
                  <Stop offset={edge} stopColor={color} stopOpacity={ink[k][0]} />
                  <Stop offset={Math.min(1, edge + RAMP / h)} stopColor={color} stopOpacity={ink[k][1]} />
                  <Stop offset="1" stopColor={color} stopOpacity={ink[k][1]} />
                </LinearGradient>
              ))}
            </Defs>
            <Path d={area} fill={`url(#fill${id})`} />
            <Path d={line} stroke={`url(#line${id})`} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" fill="none" />
          </Svg>
          </Animated.View>
          {!reduced && (
            <>
              <Glint t={draw} points={pts} color={color} dimAbove={textBottom} dim={ink.shine} />
              <Glint t={pass} points={pts} color={color} dimAbove={textBottom} dim={ink.shine} />
            </>
          )}
        </>
      )}
    </Animated.View>
  );
}

const GLINT = 6; // the shine's core, in points; a soft halo around it
const RAMP = 48; // points over which the graph strengthens once past the words (a soft fade, no visible step)

/**
 * The shine: a tiny Moon dot with a halo in the line's colour, at position `t` (0 → 1) along the polyline
 * (straight between the points, so it stays on the line). Fades in at the start and out at the end,
 * so it's only seen while moving. Behind the words (above `dimAbove`) it dims to the readability budget.
 */
function Glint({ t, points, color, dimAbove, dim }: { t: Animated.Value; points: { x: number; y: number }[]; color: string; dimAbove: number; dim: number }) {
  // Distance along the line at each point, as a fraction of the whole: the dot moves at an even pace.
  const lengths = points.map((p, i) => (i ? Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) : 0));
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  const at = lengths.map((_, i) => lengths.slice(0, i + 1).reduce((a, b) => a + b, 0) / total);

  return (
    <Animated.View
      style={[
        styles.glint,
        {
          shadowColor: color,
          opacity: t.interpolate({ inputRange: at, outputRange: points.map((p, i) => (i === 0 || i === points.length - 1 ? 0 : p.y < dimAbove + RAMP ? dim : 1)) }),
          transform: [
            { translateX: t.interpolate({ inputRange: at, outputRange: points.map((p) => p.x - GLINT * 1.5) }) },
            { translateY: t.interpolate({ inputRange: at, outputRange: points.map((p) => p.y - GLINT * 1.5) }) },
          ],
        },
      ]}
    >
      <View style={[styles.halo, { backgroundColor: color }]} />
      <View style={styles.core} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: radius.xl, padding: space.xl },
  glint: { position: 'absolute', left: 0, top: 0, width: GLINT * 3, height: GLINT * 3, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  halo: { position: 'absolute', width: GLINT * 3, height: GLINT * 3, borderRadius: GLINT * 1.5, opacity: 0.35 },
  core: { width: GLINT, height: GLINT, borderRadius: GLINT / 2, backgroundColor: colors.text },
  button: { marginTop: space.xl },
});
