import React, { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { AppText } from '@ds/components/AppText';
import { Button } from '@ds/components/Button';
import { Icon, type IconName } from '@ds/components/Icon';
import { HeroBackground } from '@ds/components/InsightCard';
import { InfoButton } from '@ds/components/InfoButton';
import { ScoreRing } from '@ds/components/ScoreRing';
import { VERDICT_ACTION, VerdictActions, type Mood, type VerdictAction } from '@ds/components/VerdictCard';
import { alpha, colors, dataInk, loudnessRamp, motion, radius, space, type, useReducedMotion } from '@ds/theme';

export type TrioLayout = 'tall' | 'wide' | 'loud' | 'mellow';

/** ?layout=… on Reports (and in the shared preview's report-screen.html) → the layout. */
export const trioLayout = (param?: string | null): TrioLayout | undefined =>
  ({ trio: 'tall', wide: 'wide', loud: 'loud', mellow: 'mellow' } as Record<string, TrioLayout>)[param ?? ''];

/**
 * The top of a report as three boxes. The report's own design builds on Layout Option 5, without the card's shine.
 * Options 2 to 4 are temporary layout variants, for comparing on public/report-layouts.html (?layout=trio, wide or loud on Reports).
 * Layout Option 2 (tall): Breathing pauses tall on the left, Snore Score over the verdict on the right.
 * Layout Option 3 (wide): Breathing pauses across the top, Snore Score and the verdict side by side below.
 * Layout Option 4 (loud): Breathing pauses as the hero, then Snore Score as a row, then a quiet verdict.
 * Layout Option 5 (mellow): the report's usual arrangement and sizes. Breathing pauses lit up, its ring breathing and a light running around its border as it arrives, the verdict's mood colours softened.
 * To remove Options 2 to 4: delete their branches and components here, the page, and the `trio` prop that reaches NightScreen. Keep Option 5's.
 */
export function ReportTrio({ layout, pauses, snore, verdict }: { layout: TrioLayout; pauses: React.ReactNode; snore: React.ReactNode; verdict: React.ReactNode }) {
  if (layout === 'mellow') {
    return (
      <View style={styles.stack}>
        <View style={styles.row}>
          {snore}
          {pauses}
        </View>
        {verdict}
      </View>
    );
  }
  if (layout === 'loud') {
    return (
      <View style={styles.stack}>
        {pauses}
        {snore}
        {verdict}
      </View>
    );
  }
  if (layout === 'wide') {
    return (
      <View style={styles.stack}>
        {pauses}
        <View style={styles.row}>
          {snore}
          <View style={styles.column}>{verdict}</View>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      {pauses}
      <View style={styles.column}>
        <View style={styles.snore}>{snore}</View>
        {verdict}
      </View>
    </View>
  );
}

/** Breathing pauses as the big box. Tall: the ring and level centred, with Listen at the foot. Wide: the ring on the left, the rest beside it. */
export function TallScoreTile({ layout, fraction, name, level, accessibilityLabel, action }: { layout: 'tall' | 'wide'; fraction: number; name: string; level: string; accessibilityLabel: string; action?: React.ReactNode }) {
  if (layout === 'wide') {
    return (
      <View style={styles.wide}>
        <ScoreRing fraction={fraction} color={colors.dataBreathing} ramp={loudnessRamp} size={112} stroke={10}>
          <Icon name="airwave" size={48} color="text" />
        </ScoreRing>
        <View style={styles.wideBody}>
          <View accessible accessibilityLabel={accessibilityLabel} style={{ alignItems: 'flex-start' }}>
            <AppText color="text" style={styles.wideName} numberOfLines={1}>
              {name}
            </AppText>
            <View style={styles.level}>
              <View style={[styles.dot, { backgroundColor: dataInk('breathing', fraction) }]} />
              <AppText variant="small" color="text">
                {level}
              </AppText>
            </View>
          </View>
          {action ? <View style={{ marginTop: space.md }}>{action}</View> : null}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.tall}>
      <View style={styles.tallBody} accessible accessibilityLabel={accessibilityLabel}>
        <ScoreRing fraction={fraction} color={colors.dataBreathing} ramp={loudnessRamp} size={132} stroke={10}>
          <Icon name="airwave" size={56} color="text" />
        </ScoreRing>
        <AppText color="text" style={styles.name} numberOfLines={1}>
          {name}
        </AppText>
        <View style={styles.level}>
          <View style={[styles.dot, { backgroundColor: dataInk('breathing', fraction) }]} />
          <AppText variant="small" color="text">
            {level}
          </AppText>
        </View>
      </View>
      {action}
    </View>
  );
}

/** The verdict at half width: VerdictCard's words, colours and next step, with tighter padding and stacked buttons. Labels wrap, centred. */
export function CompactVerdict({ mood, title, body, action, secondary }: { mood: Mood; title: string; body: string; action: VerdictAction; secondary?: VerdictAction }) {
  return (
    <View style={styles.verdict}>
      <HeroBackground mood={mood} />
      <AppText variant="heading" color="text" accessibilityRole="header">
        {title}
      </AppText>
      <AppText color="text" style={{ marginTop: space.sm }}>
        {body}
      </AppText>
      <View style={styles.actions}>
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => [styles.action, { backgroundColor: colors[VERDICT_ACTION[mood]] }, pressed && { opacity: 0.8 }]}
        >
          <AppText variant="button" color="onAccent" style={{ textAlign: 'center' }}>
            {action.label}
          </AppText>
        </Pressable>
        {secondary ? <Button label={secondary.label} variant="quiet" onPress={secondary.onPress} style={{ paddingHorizontal: space.sm }} /> : null}
      </View>
    </View>
  );
}

/** Layout Option 4: Breathing pauses as the loudest thing on the page, on the blue card colours at every level. The level is the biggest word. */
export function LoudPauses({ fraction, name, level, accessibilityLabel, action }: { fraction: number; name: string; level: string; accessibilityLabel: string; action?: React.ReactNode }) {
  return (
    <View style={styles.loud}>
      <HeroBackground mood="calm" />
      <View accessible accessibilityLabel={accessibilityLabel} style={{ alignItems: 'center' }}>
        <AppText variant="heading" color="text">
          {name}
        </AppText>
        <View style={{ marginTop: space.sm }}>
          <ScoreRing fraction={fraction} color={colors.dataBreathing} ramp={loudnessRamp} size={108} stroke={11}>
            <Icon name="airwave" size={48} color="text" />
          </ScoreRing>
        </View>
        <AppText variant="title" color="text" style={{ marginTop: space.xs }}>
          {level}
        </AppText>
      </View>
      {action ? <View style={styles.loudAction}>{action}</View> : null}
    </View>
  );
}

/** Layout Option 4: Snore Score as one short row. */
export function SnoreRow({ fraction, value, name, level, accessibilityLabel, action }: { fraction: number; value: string; name: string; level: string; accessibilityLabel: string; action?: React.ReactNode }) {
  return (
    <View style={styles.snoreRow}>
      <View accessible accessibilityLabel={accessibilityLabel} style={styles.snoreSummary}>
        <ScoreRing fraction={fraction} color={colors.dataSnoring} ramp={loudnessRamp} size={64} stroke={7}>
          <AppText color="text" style={styles.wideName}>
            {value}
          </AppText>
        </ScoreRing>
        <View>
          <AppText color="text" style={styles.wideName} numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="small" color="textMuted">
            {level}
          </AppText>
        </View>
      </View>
      {action}
    </View>
  );
}

/** Layout Option 4: the verdict played down. The night's mood colours softened, small words, and a small next step in the mood's colour. */
export function QuietVerdict({ mood, title, body, action, secondary }: { mood: Mood; title: string; body: string; action: VerdictAction; secondary?: VerdictAction & { icon: IconName } }) {
  return (
    <View style={styles.quiet}>
      <View style={styles.mellowMood} pointerEvents="none">
        <HeroBackground mood={mood} />
      </View>
      <AppText color="text" style={styles.wideName} accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="small" color="textMuted">
        {body}
      </AppText>
      <View style={styles.quietActions}>
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          hitSlop={4}
          style={({ pressed }) => [styles.quietAction, { backgroundColor: colors[VERDICT_ACTION[mood]] }, pressed && { opacity: 0.8 }]}
        >
          <AppText variant="buttonSmall" color="onAccent">
            {action.label}
          </AppText>
        </Pressable>
        {secondary ? (
          <Pressable
            onPress={secondary.onPress}
            accessibilityRole="button"
            accessibilityLabel={secondary.label}
            hitSlop={4}
            style={({ pressed }) => [styles.quietIcon, { borderColor: colors[VERDICT_ACTION[mood]] }, pressed && { opacity: 0.7 }]}
          >
            <Icon name={secondary.icon} size={20} color={VERDICT_ACTION[mood]} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/**
 * The report's Breathing pauses tile (and Layout Option 5's): ScoreTile's measures on the blue card colours, the same at every level: the highlight
 * says "look here", not how bad it is (a severe night may be down to snoring alone).
 * Arrives with a flip. The ring breathes throughout (ambient). With `shine` (Layout Option 5), once the flip settles
 * a light runs around the card's border twice, then stops (glint). Reduce Motion: it fades in and all of it holds still.
 * Web preview: 'airese:replay' plays the arrival again (the page's tabs, as hidden reports load out of sight).
 */
export function HighlightTile({ fraction, name, level, accessibilityLabel, action, infoLabel, onInfo, shine: shines = false }: { fraction: number; name: string; level: string; accessibilityLabel: string; action?: React.ReactNode; infoLabel: string; onInfo: () => void; shine?: boolean }) {
  const reduced = useReducedMotion();
  const [arrive] = useState(() => new Animated.Value(0)); // 0 turned away, 1 facing
  const [breath] = useState(() => new Animated.Value(0)); // 0 out, 1 in
  const [shine] = useState(() => new Animated.Value(0)); // 0 → SHINE_LAPS: laps of the border
  useEffect(() => {
    let shining: Animated.CompositeAnimation | undefined;
    const play = () => {
      arrive.setValue(0);
      Animated.timing(arrive, { toValue: 1, duration: motion.slow.duration, easing: motion.slow.easeOut, useNativeDriver: motion.useNativeDriver }).start();
      shining?.stop();
      shine.setValue(0);
      if (reduced || !shines) return;
      const { duration, easing } = motion.glint;
      shining = Animated.sequence([
        Animated.delay(motion.slow.duration), // once the flip has settled
        Animated.timing(shine, { toValue: SHINE_LAPS, duration: duration * SHINE_LAPS, easing, useNativeDriver: false }), // one eased run, so it never pauses between laps
      ]);
      shining.start();
    };
    play();
    const { duration, easing } = motion.ambient;
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: duration / 2, easing, useNativeDriver: motion.useNativeDriver }),
        Animated.timing(breath, { toValue: 0, duration: duration / 2, easing, useNativeDriver: motion.useNativeDriver }),
      ]),
    );
    if (!reduced) breathing.start();
    const stop = () => {
      breathing.stop();
      shining?.stop();
    };
    if (Platform.OS !== 'web') return stop;
    window.addEventListener('airese:replay', play);
    return () => {
      stop();
      window.removeEventListener('airese:replay', play);
    };
  }, [arrive, breath, shine, shines, reduced]);
  const turn = reduced ? [] : [{ perspective: 800 }, { rotateY: arrive.interpolate({ inputRange: [0, 1], outputRange: ['90deg', '0deg'] }) }];
  return (
    <Animated.View style={[styles.lit, { opacity: arrive, transform: turn }]}>
      <View style={styles.litFill} pointerEvents="none">
        <HeroBackground mood="calm" />
      </View>
      {!reduced && shines && <BorderShine t={shine} />}
      <View accessible accessibilityLabel={accessibilityLabel} style={{ alignItems: 'center' }}>
        <View>
          <Animated.View
            pointerEvents="none"
            style={[styles.halo, { opacity: breath, transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) }] }]}
          />
          <Animated.View style={{ transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] }}>
            <ScoreRing fraction={fraction} color={colors.dataBreathing} ramp={loudnessRamp} size={96} stroke={10}>
              <Icon name="airwave" size={40} color="text" />
            </ScoreRing>
          </Animated.View>
        </View>
        <AppText color="text" style={styles.name} numberOfLines={1}>
          {name}
        </AppText>
        <LevelChip level={level} ink={dataInk('breathing', fraction)} />
      </View>
      {action ? <View style={styles.litAction}>{action}</View> : null}
      <View style={styles.litInfo}>
        <InfoButton size={20} label={infoLabel} onPress={onInfo} />
      </View>
    </Animated.View>
  );
}

/** The report's Snore Score tile (and Layout Option 5's): ScoreTile's snoring measures, with the same stronger level chip as the tile beside it. */
export function MellowSnoreTile({ fraction, value, name, level, accessibilityLabel, action }: { fraction: number; value: string; name: string; level: string; accessibilityLabel: string; action?: React.ReactNode }) {
  return (
    <View style={styles.mellowSnore}>
      <View accessible accessibilityLabel={accessibilityLabel} style={{ alignItems: 'center' }}>
        <ScoreRing fraction={fraction} color={colors.dataSnoring} ramp={loudnessRamp} size={96} stroke={10}>
          <AppText variant="title" color="text" numberOfLines={1}>
            {value}
          </AppText>
        </ScoreRing>
        <AppText color="text" style={styles.name} numberOfLines={1}>
          {name}
        </AppText>
        <LevelChip level={level} ink={dataInk('snoring', fraction)} />
      </View>
      {action ? <View style={styles.litAction}>{action}</View> : null}
    </View>
  );
}

/** A level on a Moon wash with a fine edge: no new colour, only the dot the ring already ends in. Moon text 7:1+ on either card. */
function LevelChip({ level, ink }: { level: string; ink: string }) {
  return (
    <View style={[styles.level, styles.levelStrong]}>
      <View style={[styles.dot, { backgroundColor: ink }]} />
      <AppText variant="small" color="text">
        {level}
      </AppText>
    </View>
  );
}

const SHINE_LAPS = 2;
const SHINE_WIDTH = 2;
// The light: see-through strokes stacked from one head, each longer and fainter than the last, so they add
// up to a bright white point fading smoothly into a long Breath tail, with no steps or seams along the way.
const SHINE_LAYERS = 24;
const SHINE_TRAIL = Array.from({ length: SHINE_LAYERS }, (_, i) => {
  const t = (SHINE_LAYERS - i) / SHINE_LAYERS; // longest first, so the white head sits on top
  return { length: 0.012 + 0.34 * t * t, color: t > 0.4 ? colors.accent : colors.text, opacity: 0.02 + 0.3 * (1 - t) ** 2 };
});

/**
 * A light running around a border as `t` goes 0 → `laps`, fading in and out at the very ends. `corner`: the border's radius.
 * Progress drives plain SVG props (animated SVG elements leak native-only props on web; see ScoreRing).
 */
export function BorderShine({ t, corner = radius.card, laps = SHINE_LAPS }: { t: Animated.Value; corner?: number; laps?: number }) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [p, setP] = useState(0);
  useEffect(() => {
    const id = t.addListener(({ value }) => setP(value));
    return () => t.removeListener(id);
  }, [t]);
  const width = box.width - SHINE_WIDTH;
  const height = box.height - SHINE_WIDTH;
  const r = corner - SHINE_WIDTH / 2;
  const around = 2 * (width + height - 4 * r) + 2 * Math.PI * r;
  const fade = Math.sin((Math.min(1, p / 0.25, (laps - p) / 0.25) * Math.PI) / 2);
  return (
    <View style={styles.litShine} pointerEvents="none" onLayout={(e) => setBox(e.nativeEvent.layout)}>
      {box.width > 0 && p > 0 && p < laps && (
        <Svg width={box.width} height={box.height}>
          {SHINE_TRAIL.map(({ length, color, opacity }) => (
            <Rect
              key={length}
              x={SHINE_WIDTH / 2}
              y={SHINE_WIDTH / 2}
              width={width}
              height={height}
              rx={r}
              ry={r}
              fill="none"
              stroke={color}
              strokeWidth={SHINE_WIDTH}
              strokeOpacity={opacity * fade}
              strokeDasharray={`${around * length} ${around * (1 - length)}`}
              strokeDashoffset={around * (length - p)}
            />
          ))}
        </Svg>
      )}
    </View>
  );
}

/** The report's verdict (and Layout Option 5's): VerdictCard's size and arrangement, with the night's mood colours softened and no graph. The next step stays in the mood's colour, as on the report. */
export function MellowVerdict({ mood, title, body, action, secondary }: { mood: Mood; title: string; body: string; action: VerdictAction; secondary?: VerdictAction & { icon: IconName } }) {
  return (
    <View style={styles.mellow}>
      <View style={styles.mellowMood} pointerEvents="none">
        <HeroBackground mood={mood} />
      </View>
      <AppText variant="heading" color="text" accessibilityRole="header">
        {title}
      </AppText>
      <AppText color="text" style={{ marginTop: space.sm }}>
        {body}
      </AppText>
      <VerdictActions mood={mood} action={action} secondary={secondary} style={{ marginTop: space.xl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.md },
  lit: { flex: 1, alignItems: 'center', borderRadius: radius.card, paddingHorizontal: space.md, paddingTop: space.xl, paddingBottom: space.lg },
  litFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', borderRadius: radius.card, borderWidth: 1, borderColor: alpha(colors.accent, 0.24) },
  litShine: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  halo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 48, backgroundColor: alpha(colors.accent, 0.1) },
  mellowSnore: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: space.md, paddingTop: space.xl, paddingBottom: space.lg },
  litInfo: { position: 'absolute', top: space.md, right: space.md },
  litAction: { alignSelf: 'stretch', marginTop: 'auto', paddingTop: space.lg },
  mellow: { overflow: 'hidden', backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.xl },
  mellowMood: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.55 },
  loud: { overflow: 'hidden', borderRadius: radius.xl, padding: space.lg },
  loudAction: { marginTop: space.md },
  snoreRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.card, padding: space.md },
  snoreSummary: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
  quiet: { overflow: 'hidden', backgroundColor: colors.surface, borderRadius: radius.card, padding: space.lg },
  quietAction: { minHeight: 36, justifyContent: 'center', paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.pill }, // 36 pt plus the hit slop: a 44 pt target
  quietActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  quietIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }, // 36 pt plus the hit slop: a 44 pt target
  row: { flexDirection: 'row', gap: space.md },
  wide: { flexDirection: 'row', alignItems: 'center', gap: space.lg, backgroundColor: colors.surface, borderRadius: radius.card, padding: space.lg },
  wideBody: { flex: 1 },
  wideName: { fontFamily: type.heading.fontFamily, fontWeight: type.heading.fontWeight },
  column: { flex: 1, gap: space.md },
  snore: { flexDirection: 'row' }, // ScoreTile fills the width of a row
  tall: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: space.md, paddingVertical: space.lg },
  tallBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: space.lg },
  name: { marginTop: space.lg, fontFamily: type.heading.fontFamily, fontWeight: type.heading.fontWeight },
  level: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 28, paddingHorizontal: space.md, borderRadius: radius.pill, marginTop: space.sm, backgroundColor: alpha(colors.moon, 0.08) },
  levelStrong: { backgroundColor: alpha(colors.moon, 0.14), borderWidth: 1, borderColor: alpha(colors.moon, 0.2) },
  dot: { width: 8, height: 8, borderRadius: 4 },
  verdict: { flexGrow: 1, overflow: 'hidden', borderRadius: radius.xl, padding: space.lg },
  actions: { marginTop: 'auto', paddingTop: space.lg, gap: space.xs },
  action: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm, paddingVertical: space.sm, borderRadius: radius.xl },
});
