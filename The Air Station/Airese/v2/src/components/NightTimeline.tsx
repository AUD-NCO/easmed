import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';
import { clockAt, type Clip, type NightDetails } from '../lib/nightDetails';
import { alpha, colors, loudnessRamp, motion, space, useReducedMotion } from '@ds/theme';
import { AppText } from '@ds/components/AppText';
import { RampFill } from '@ds/components/RampFill';

const SLEEP_H = 4;
const RING = 12;

/**
 * The night at a glance (PRD §9), drawn after the references:
 *   snoring   bars every 3 minutes (one bar per step), taller is louder, through the loudness ramp
 *             pinned to the plot (cyan at the base, red only at very loud), as in the snoring chart
 *   breathing Iris ticks along the top where breathing was interrupted (a different shape)
 *   asleep    a Dew line under the axis, with gaps where it sounded awake or restless
 * Faint hour lines; start and end times above. Bars grow in once (slow ease-out); Reduce Motion: drawn at once.
 * `full` is taller and adds clip rings you can tap to play. Colour is never the only cue: the legend
 * names each mark, and the sheet lists the same moments as text.
 */
export function NightTimeline({ details, full = false, clips = [], playing, onClip }: { details: NightDetails; full?: boolean; clips?: Clip[]; playing?: string | null; onClip?: (clip: Clip) => void }) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const H = full ? 160 : 112; // plot height
  const total = details.night.minutes;
  const x = (m: number) => (m / total) * width;
  const binW = width / details.bins.length;
  const grow = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced || width === 0) return grow.setValue(1);
    Animated.timing(grow, { toValue: 1, duration: motion.slow.duration, easing: motion.slow.easeOut, useNativeDriver: motion.useNativeDriver }).start();
  }, [reduced, width, grow]);

  const firstHour = (60 - (details.night.startMinutes % 60)) % 60;
  const hours = Array.from({ length: Math.ceil(total / 60) }, (_, i) => firstHour + i * 60).filter((m) => m > 0 && m < total);
  const asleep = asleepStretches(details);

  return (
    <View accessible accessibilityLabel={describe(details)}>
      <View style={styles.ends}>
        <AppText variant="small" color="textMuted">
          {clockAt(details, 0)}
        </AppText>
        <AppText variant="small" color="textMuted">
          {clockAt(details, total)}
        </AppText>
      </View>

      <View style={{ height: H }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <>
            {/* Grid: faint hour lines and the baseline (static) */}
            <Svg width={width} height={H} style={StyleSheet.absoluteFill}>
              {hours.map((m) => (
                <Line key={m} x1={x(m)} x2={x(m)} y1={0} y2={H} stroke={alpha(colors.mist, 0.08)} strokeWidth={1} />
              ))}
              <Line x1={0} x2={width} y1={H - 0.5} y2={H - 0.5} stroke={alpha(colors.mist, 0.25)} strokeWidth={1} />
            </Svg>

            {/* Marks: grow up from the baseline */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateY: grow.interpolate({ inputRange: [0, 1], outputRange: [H / 2, 0] }) }, { scaleY: grow.interpolate({ inputRange: [0, 1], outputRange: [0.001, 1] }) }] },
              ]}
            >
              <Svg width={width} height={H}>
                <Defs>
                  {/* One gradient for all bars, from the baseline (quiet) to the top of the scale (very loud) */}
                  <LinearGradient id="snore" gradientUnits="userSpaceOnUse" x1="0" y1={H} x2="0" y2={20}>
                    {loudnessRamp.map((c, i) => (
                      <Stop key={c} offset={i / (loudnessRamp.length - 1)} stopColor={c} />
                    ))}
                  </LinearGradient>
                </Defs>
                {details.bins.map((v, i) =>
                  v > 0 ? <Rect key={i} x={i * binW + 0.5} y={H - v * (H - 20)} width={Math.max(1.5, binW - 1)} height={v * (H - 20)} rx={Math.min(2, binW / 2)} fill="url(#snore)" /> : null,
                )}
                {details.breathingEvents.map((m, i) => (
                  <Rect key={`b${i}`} x={x(m) - 1} y={0} width={2} height={12} rx={1} fill={colors.dataBreathing} opacity={0.85} />
                ))}
              </Svg>
            </Animated.View>
          </>
        )}
      </View>

      {/* Asleep line */}
      <View style={{ height: SLEEP_H, marginTop: space.sm }}>
        {width > 0 && asleep.map((a, i) => <View key={i} style={[styles.asleep, { left: x(a.start), width: Math.max(2, x(a.end) - x(a.start) - 3) }]} />)}
      </View>

      {/* Clips (full view): tap to play */}
      {full && width > 0 && clips.length > 0 && (
        <View style={{ height: RING + space.md, marginTop: space.sm }}>
          {clips.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => onClip?.(c)}
              hitSlop={16}
              accessibilityRole="button"
              accessibilityLabel={`Play ${clockAt(details, c.at)} clip`}
              style={[styles.ring, { left: x(c.at) - RING / 2 }, playing === c.id && styles.ringOn]}
            />
          ))}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Key swatch={<View style={styles.keyRamp}><RampFill direction="right" to={1} /></View>} label="Snoring, quiet to loud" />
        {details.breathingEvents.length > 0 && <Key swatch={<View style={styles.keyTick} />} label="Breathing pause" />}
        <Key swatch={<View style={styles.keyLine} />} label="Asleep" />
        {full && clips.length > 0 && <Key swatch={<View style={[styles.ring, styles.keyRing]} />} label="Clip" />}
      </View>
    </View>
  );
}

function Key({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      {swatch}
      <AppText variant="small" color="textMuted">
        {label}
      </AppText>
    </View>
  );
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

function describe(d: NightDetails) {
  return `Timeline from ${clockAt(d, 0)} to ${clockAt(d, d.night.minutes)}: ${d.segments.length} snoring periods and ${d.breathingEvents.length} breathing interruptions.`;
}

const styles = StyleSheet.create({
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.sm },
  asleep: { position: 'absolute', height: SLEEP_H, borderRadius: SLEEP_H / 2, backgroundColor: colors.dataSleep },
  ring: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface },
  ringOn: { backgroundColor: colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.lg, rowGap: space.sm, marginTop: space.lg },
  keyRamp: { width: 24, height: 10, borderRadius: 5, overflow: 'hidden' },
  keyTick: { width: 2, height: 12, borderRadius: 1, backgroundColor: colors.dataBreathing },
  keyLine: { width: 14, height: SLEEP_H, borderRadius: SLEEP_H / 2, backgroundColor: colors.dataSleep },
  keyRing: { position: 'relative' },
});
