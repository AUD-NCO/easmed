import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { INTENSITY_LABEL, SAMPLES_PER_MINUTE, clockAt, dbAt, type Clip, type Intensity, type NightDetails } from '../lib/nightDetails';
import { alpha, colors, loudness, motion, radius, space, useReducedMotion } from '@ds/theme';
import { AppText } from '@ds/components/AppText';
import { Icon } from '@ds/components/Icon';

const DB_MIN = 30;
const DB_MAX = 90;
const GRID = [40, 60, 80];
const LANE = 18; // event markers above the plot
const MIN_SPAN = 2; // closest zoom, in minutes
const STEP = 2; // zoom factor per button press

// The fill: one spiky shape with a vertical gradient through the `loudness` ramp. Each colour is pinned
// to its level's typical decibels (as in nightDetails), so the quiet floor stays cyan and only very loud
// peaks reach red. Same colours and names as LoudnessBars.
const LEVEL_DB: Record<Intensity, number> = { light: 47, moderate: 54, loud: 61, veryLoud: 68 };
const LEVELS = (['light', 'moderate', 'loud', 'veryLoud'] as const).map((k) => ({ key: k, label: INTENSITY_LABEL[k], color: loudness[k], db: LEVEL_DB[k] }));
const TOP_DB = LEVELS[LEVELS.length - 1].db;

type Event = { at: number; kind: 'pause' | 'cough' | 'movement' };
const EVENT_LABEL: Record<Event['kind'], string> = {
  pause: 'Breathing pause',
  cough: 'Cough',
  movement: 'Movement',
};

/**
 * Snoring through the night: the sound level, every 20 seconds, as one filled shape. Faint guide
 * lines at 40, 60 and 80 dB, unlabelled. Built to match Engineering's interactive chart, in the Airese palette:
 *   fill       the `loudness` ramp, cyan → yellow → orange → red, pinned to decibels (see LEVELS)
 *   lane       events above the plot, each its own shape: breathing pause (Iris pill), cough (Moon
 *              diamond), movement (Mist ring), so colour is never the only cue
 *   playhead   a Moon line with a dot on the axis; the readout above gives its time and level
 *
 * Touch: drag to move the playhead. Two fingers pinch to zoom and slide to pan (down to 2 minutes).
 * Hint "Pinch to zoom" shows until you zoom; then "Whole night" takes its place.
 * The − / + buttons and "Whole night" do the same with one tap (WCAG 2.5.1, a single-pointer
 * alternative to pinch). Screen readers: the chart is adjustable; swipe up or down to step the playhead.
 * Grows in once on arrival (slow ease-out); Reduce Motion: drawn at once.
 *
 * Two modes, for two readers:
 *   overview  (the page) the whole night, breathing pauses only, and the moments you can hear as
 *             rings on the axis. A tap anywhere picks the nearest moment (`onSelect`); no zoom, no dB readout.
 *   explore   (sheets, the night report) everything above: every event, the playhead readout, zoom.
 */
export function SnoringChart({
  d,
  height = 200,
  mode = 'explore',
  moments = [],
  selected,
  onSelect,
}: {
  d: NightDetails;
  height?: number;
  mode?: 'overview' | 'explore';
  moments?: Clip[];
  selected?: string;
  onSelect?: (clip: Clip) => void;
}) {
  const overview = mode === 'overview';
  const reduced = useReducedMotion();
  const total = d.night.minutes;
  const H = height;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ''); // gradient ids, one set per chart on the page
  const [width, setWidth] = useState(0);
  const [view, setView] = useState({ start: 0, end: total });
  const [head, setHead] = useState<number | null>(null);
  const span = view.end - view.start;
  const zoomed = span < total - 0.5;

  // Latest values for the gesture handlers (created once).
  const live = useRef({ width, view, total, overview, moments, onSelect });
  live.current = { width, view, total, overview, moments, onSelect };
  const gesture = useRef<{
    left: number;
    pinch?: {
      dist: number;
      view: { start: number; end: number };
      centre: number;
    };
  }>({ left: 0 });

  const grow = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced || width === 0) return grow.setValue(1);
    Animated.timing(grow, {
      toValue: 1,
      duration: motion.slow.duration,
      easing: motion.slow.easeOut,
      useNativeDriver: motion.useNativeDriver,
    }).start();
  }, [reduced, width, grow]);

  const events = useMemo<Event[]>(
    () => [...d.breathingEvents.map((at) => ({ at, kind: 'pause' as const })), ...d.coughs.map((at) => ({ at, kind: 'cough' as const })), ...d.movements.map((at) => ({ at, kind: 'movement' as const }))],
    [d],
  );

  function move(e: GestureResponderEvent) {
    const { width: w, view: v, total: t } = live.current;
    if (!w) return;
    if (live.current.overview) {
      // Pick the moment nearest the tap.
      const m = v.start + (Math.max(0, Math.min(w, e.nativeEvent.locationX)) / w) * (v.end - v.start);
      const best = live.current.moments.reduce<Clip | undefined>((b, c) => (!b || Math.abs(c.at - m) < Math.abs(b.at - m) ? c : b), undefined);
      if (best) live.current.onSelect?.(best);
      return;
    }
    const touches = e.nativeEvent.touches;
    const toX = (pageX: number) => pageX - gesture.current.left;
    if (touches && touches.length >= 2) {
      const [a, b] = touches;
      const dist = Math.max(1, Math.abs(a.pageX - b.pageX));
      const midX = toX((a.pageX + b.pageX) / 2);
      if (!gesture.current.pinch)
        gesture.current.pinch = {
          dist,
          view: v,
          centre: v.start + (midX / w) * (v.end - v.start),
        };
      const p = gesture.current.pinch;
      const s = clampSpan(((p.view.end - p.view.start) * p.dist) / dist, t);
      setView(fit(p.centre - (midX / w) * s, s, t));
      return;
    }
    if (gesture.current.pinch) return; // one finger left after a pinch: wait for release
    const x = Math.max(0, Math.min(w, toX(e.nativeEvent.pageX)));
    setHead(v.start + (x / w) * (v.end - v.start));
  }
  const moveRef = useRef(move);
  moveRef.current = move;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (e) => !live.current.overview && e.nativeEvent.touches.length > 1,
      // Let the page scroll take over a mostly vertical one-finger drag.
      onPanResponderTerminationRequest: (_, g) => !gesture.current.pinch && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderGrant: (e) => {
        gesture.current.left = e.nativeEvent.pageX - e.nativeEvent.locationX;
        moveRef.current(e);
      },
      onPanResponderMove: (e) => !live.current.overview && moveRef.current(e),
      onPanResponderRelease: () => (gesture.current.pinch = undefined),
      onPanResponderTerminate: () => (gesture.current.pinch = undefined),
    }),
  ).current;

  const zoomBy = (factor: number) => {
    const s = clampSpan(span / factor, total);
    const centre = head != null && head >= view.start && head <= view.end ? head : view.start + span / 2;
    setView(fit(centre - ((centre - view.start) / span) * s, s, total));
  };

  // ---- Geometry
  const x = (m: number) => ((m - view.start) / span) * width;
  const y = (db: number) => H - ((Math.max(DB_MIN, Math.min(DB_MAX, db)) - DB_MIN) / (DB_MAX - DB_MIN)) * (H - LANE);
  const area = useMemo(() => (width ? areaPath(d.envelope, view.start, view.end, width, H, LANE) : ''), [d, view, width, H]);
  const hours = useMemo(() => {
    const first = (60 - (d.night.startMinutes % 60)) % 60;
    const marks: number[] = [];
    for (let m = first; m < total; m += 60) marks.push(m);
    return marks;
  }, [d, total]);

  const peak = useMemo(() => {
    const i0 = Math.floor(view.start * SAMPLES_PER_MINUTE);
    const i1 = Math.min(d.envelope.length, Math.ceil(view.end * SAMPLES_PER_MINUTE));
    let best = i0;
    for (let i = i0; i < i1; i++) if (d.envelope[i] > d.envelope[best]) best = i;
    return best / SAMPLES_PER_MINUTE;
  }, [d, view]);

  // An event counts as "at" the playhead within ~6 px of it.
  const near = head != null && width ? events.find((ev) => Math.abs(ev.at - head) <= (6 / width) * span) : undefined;
  const pillW = Math.max(4, (0.5 / span) * width);
  const visible = events.filter((ev) => ev.at >= view.start - 1 && ev.at <= view.end + 1 && (!overview || ev.kind === 'pause'));
  const chosen = overview ? moments.find((c) => c.id === selected) : undefined;

  const stepHead = (dir: 1 | -1) => setHead((h) => Math.max(view.start, Math.min(view.end, (h ?? view.start) + (dir * span) / 20)));

  return (
    <View>
      {/* Readout: the playhead's moment, or the loudest in view (explore) */}
      {!overview && (
        <View style={styles.readout} accessibilityLiveRegion="polite">
          <AppText variant="small" color="textMuted">
            {head != null ? clockAt(d, Math.floor(head)) : zoomed ? 'Loudest here' : 'Loudest'}
          </AppText>
          <AppText color="text" style={styles.readoutValue}>
            {head != null ? `${dbAt(d, head)} dB${near ? ` · ${EVENT_LABEL[near.kind]}` : ''}` : `${dbAt(d, peak)} dB at ${clockAt(d, Math.floor(peak))}`}
          </AppText>
        </View>
      )}

      <View style={{ flexDirection: 'row' }}>
        <View
          {...pan.panHandlers}
          style={[{ height: H, flex: 1 }, webTouch]}
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          accessible
          accessibilityRole={overview ? undefined : 'adjustable'}
          accessibilityHint={overview ? 'Tap near a ring to hear that moment' : undefined}
          accessibilityLabel={`Snoring through the night, ${clockAt(d, Math.floor(view.start))} to ${clockAt(d, Math.floor(view.end))}. Loudest ${dbAt(d, peak)} decibels at ${clockAt(d, Math.floor(peak))}. ${d.breathingEvents.length} breathing pauses, ${d.coughs.length} coughs, ${d.movements.length} movements.`}
          accessibilityValue={
            overview
              ? undefined
              : {
                  text: head != null ? `${clockAt(d, Math.floor(head))}, ${dbAt(d, head)} decibels${near ? `, ${EVENT_LABEL[near.kind]}` : ''}` : 'Swipe up or down to move through the night',
                }
          }
          accessibilityActions={overview ? undefined : [{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => stepHead(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        >
          {width > 0 && (
            <>
              {/* Hour stripes and decibel grid (static) */}
              <Svg width={width} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
                {hours.map((m, i) =>
                  i % 2 === 0 ? <Rect key={m} x={x(m)} y={LANE} width={x(Math.min(total, m + 60)) - x(m)} height={H - LANE} fill={alpha(colors.mist, 0.05)} /> : null,
                )}
                {GRID.map((db) => (
                  <Line key={db} x1={0} x2={width} y1={y(db)} y2={y(db)} stroke={alpha(colors.mist, 0.14)} strokeWidth={1} strokeDasharray="3 5" />
                ))}
              </Svg>

              {/* The sound level: grows up from the baseline on arrival */}
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    transform: [
                      {
                        translateY: grow.interpolate({
                          inputRange: [0, 1],
                          outputRange: [H / 2, 0],
                        }),
                      },
                      {
                        scaleY: grow.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.001, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Svg width={width} height={H}>
                  <Defs>
                    {/* Red at TOP_DB and above, down through orange and yellow to cyan at the floor */}
                    <LinearGradient id={`level${uid}`} x1="0" y1={y(TOP_DB)} x2="0" y2={H} gradientUnits="userSpaceOnUse">
                      {[...LEVELS].reverse().map((l) => (
                        <Stop key={l.key} offset={(TOP_DB - l.db) / (TOP_DB - DB_MIN)} stopColor={l.color} />
                      ))}
                    </LinearGradient>
                  </Defs>
                  <Path d={area} fill={`url(#level${uid})`} />
                </Svg>
              </Animated.View>

              {/* Baseline, events and playhead (static) */}
              <Svg width={width} height={H + 8} style={styles.overlay} pointerEvents="none">
                <Line x1={0} x2={width} y1={H - 0.5} y2={H - 0.5} stroke={alpha(colors.mist, 0.35)} strokeWidth={1} />
                {visible.map((ev, i) =>
                  ev.kind === 'pause' ? (
                    <Rect key={i} x={x(ev.at) - pillW / 2} y={2} width={pillW} height={8} rx={4} fill={colors.dataBreathing} />
                  ) : ev.kind === 'cough' ? (
                    <Rect key={i} x={x(ev.at) - 4} y={2} width={8} height={8} fill={colors.text} transform={`rotate(45 ${x(ev.at)} 6)`} />
                  ) : (
                    <Circle key={i} cx={x(ev.at)} cy={6} r={4} stroke={colors.textMuted} strokeWidth={2} fill="none" />
                  ),
                )}
                {overview ? (
                  <>
                    {chosen && <Line x1={x(chosen.at)} x2={x(chosen.at)} y1={LANE - 4} y2={H} stroke={colors.text} strokeWidth={1.5} />}
                    {moments.map((c) => (
                      <Circle key={c.id} cx={x(c.at)} cy={H} r={c.id === selected ? 7 : 6} stroke={colors.text} strokeWidth={2} fill={c.id === selected ? colors.text : colors.surface} />
                    ))}
                  </>
                ) : head == null ? (
                  <Circle cx={x(peak)} cy={y(dbAt(d, peak)) - 6} r={3.5} fill={colors.text} />
                ) : (
                  <>
                    <Line x1={x(head)} x2={x(head)} y1={LANE - 4} y2={H} stroke={colors.text} strokeWidth={1.5} />
                    <Circle cx={x(head)} cy={H} r={6} fill={colors.text} />
                  </>
                )}
              </Svg>
            </>
          )}
        </View>
      </View>

      {/* Window ends */}
      <View style={styles.ends}>
        <AppText variant="small" color="textMuted">
          {clockAt(d, Math.floor(view.start))}
        </AppText>
        <AppText variant="small" color="textMuted">
          {clockAt(d, Math.floor(view.end))}
        </AppText>
      </View>

      {/* Zoom (explore) */}
      {!overview && (
        <View style={styles.zoom}>
          <ZoomButton icon="remove" label="Zoom out" disabled={!zoomed} onPress={() => zoomBy(1 / STEP)} />
          <ZoomButton icon="add" label="Zoom in" disabled={span <= MIN_SPAN + 0.01} onPress={() => zoomBy(STEP)} />
          {zoomed && (
            <Pressable onPress={() => setView({ start: 0, end: total })} accessibilityRole="button" style={styles.whole}>
              <AppText variant="small" color="accent">
                Whole night
              </AppText>
            </Pressable>
          )}
          {!zoomed && (
            <AppText variant="small" color="textMuted" style={styles.hint}>
              Pinch to zoom
            </AppText>
          )}
        </View>
      )}

      {/* Legend: shape and colour together */}
      <View style={styles.legend}>
        <Key swatch={<View style={styles.keyPill} />} label="Breathing pause" />
        {overview ? (
          <Key swatch={<View style={styles.keyMoment} />} label="Moment to hear" />
        ) : (
          <>
            <Key swatch={<View style={styles.keyDiamond} />} label="Cough" />
            <Key swatch={<View style={styles.keyRing} />} label="Movement" />
          </>
        )}
      </View>
      <View style={styles.legend}>
        {LEVELS.map((l) => (
          <Key key={l.key} swatch={<View style={[styles.levelKey, { backgroundColor: l.color }]} />} label={l.label} />
        ))}
      </View>
    </View>
  );
}

function ZoomButton({ icon, label, disabled, onPress }: { icon: 'add' | 'remove'; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.zoomButton, disabled && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
    >
      <Icon name={icon} size={20} color="text" />
    </Pressable>
  );
}

function Key({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <View style={styles.key}>
      {swatch}
      <AppText variant="small" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

const clampSpan = (s: number, total: number) => Math.max(MIN_SPAN, Math.min(total, s));
const fit = (start: number, s: number, total: number) => {
  const a = Math.max(0, Math.min(total - s, start));
  return { start: a, end: a + s };
};

/**
 * The filled shape for the samples in view. Many samples per pixel: the loudest in each pixel column
 * (so short peaks survive). Few: a smooth curve through them (as when zoomed right in).
 */
function areaPath(env: number[], start: number, end: number, width: number, H: number, lane: number) {
  const y = (db: number) => H - ((Math.max(DB_MIN, Math.min(DB_MAX, db)) - DB_MIN) / (DB_MAX - DB_MIN)) * (H - lane);
  const i0 = Math.max(0, Math.floor(start * SAMPLES_PER_MINUTE));
  const i1 = Math.min(env.length - 1, Math.ceil(end * SAMPLES_PER_MINUTE));
  const xOf = (i: number) => ((i / SAMPLES_PER_MINUTE - start) / (end - start)) * width;
  const pts: [number, number][] = [];
  if (i1 - i0 > width / 3) {
    const cols = Math.min(width, i1 - i0);
    for (let c = 0; c <= cols; c++) {
      const a = Math.floor(i0 + ((i1 - i0) * c) / cols);
      const b = Math.max(a + 1, Math.floor(i0 + ((i1 - i0) * (c + 1)) / cols));
      let m = env[a];
      for (let i = a; i < b && i < env.length; i++) m = Math.max(m, env[i]);
      pts.push([(c / cols) * width, y(m)]);
    }
    return `M0,${H} ` + pts.map(([px, py]) => `L${px.toFixed(1)},${py.toFixed(1)}`).join(' ') + ` L${width},${H} Z`;
  }
  for (let i = i0; i <= i1; i++) pts.push([xOf(i), y(env[i])]);
  // Catmull-Rom through the samples, as cubic Béziers.
  let p = `M${pts[0][0]},${H} L${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[Math.max(0, i - 1)];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[Math.min(pts.length - 1, i + 2)];
    p += ` C${x1 + (x2 - x0) / 6},${y1 + (y2 - y0) / 6} ${x2 - (x3 - x1) / 6},${y2 - (y3 - y1) / 6} ${x2},${y2}`;
  }
  return `${p} L${pts[pts.length - 1][0]},${H} Z`;
}

/** Web: keep vertical page scroll, but let the chart have horizontal drags and pinches (no page zoom, no text selection). */
const webTouch =
  Platform.OS === 'web'
    ? ({
        touchAction: 'pan-y',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: 'pointer',
      } as object)
    : null;

const styles = StyleSheet.create({
  readout: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: space.sm,
    marginBottom: space.md,
    minHeight: 24,
  },
  readoutValue: { fontVariant: ['tabular-nums'] },
  overlay: { position: 'absolute', left: 0, top: 0, overflow: 'visible' },
  ends: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.md,
  },
  zoom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.moon, 0.08),
  },
  whole: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  hint: { marginLeft: 'auto' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: space.lg,
    rowGap: space.sm,
    marginTop: space.lg,
  },
  key: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  keyPill: {
    width: 14,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dataBreathing,
  },
  keyDiamond: {
    width: 8,
    height: 8,
    marginHorizontal: 2,
    backgroundColor: colors.text,
    transform: [{ rotate: '45deg' }],
  },
  keyMoment: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.text,
  },
  keyRing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  levelKey: { width: 6, height: 18, borderRadius: radius.pill },
});
