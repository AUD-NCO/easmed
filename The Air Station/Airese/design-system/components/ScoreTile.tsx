import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { alpha, colors, dataInk, loudnessRamp, radius, space, type } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { ScoreRing } from './ScoreRing';
import type { DataTone } from './DataCard';

const INK: Record<Exclude<DataTone, 'neutral'>, string> = { snoring: colors.dataSnoring, breathing: colors.dataBreathing, sleep: colors.dataSleep };
const TINT: Record<Exclude<DataTone, 'neutral'>, string> = { snoring: colors.tintSnoring, breathing: colors.tintBreathing, sleep: colors.tintSleep };
// Snoring and breathing pauses: more is worse, so their rings run through the loudness ramp (cyan to red).
// Sleep (more is better) keeps its own colour.
const RAMPED: Partial<Record<Exclude<DataTone, 'neutral'>, boolean>> = { snoring: true, breathing: true };

/**
 * One headline score, half width, two side by side (Recording Details, top of the page):
 *   a big ring in the data's colour with the number inside · the name · a level word on a soft tint
 *   · one line saying what the number is made of. The whole tile opens the full story.
 * The level is a word, never a colour alone. Snoring and breathing rings run through the loudness ramp
 * (red only near the top of the scale), and the level dot takes the colour the ring ends in.
 * No `value`: the ring holds the data's icon instead (breathing: a plain level on the page, the
 * exact rate in its sheet).
 */
export function ScoreTile({
  tone,
  fraction,
  value,
  icon,
  name,
  level,
  detail,
  onPress,
  accessibilityLabel,
  action,
  ringSize = 116,
}: {
  tone: Exclude<DataTone, 'neutral'>;
  fraction: number;
  value?: string;
  icon?: IconName;
  name: string;
  level: string;
  /** A line under the level (vs your usual); left out when there's nothing to compare. */
  detail?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** A small action at the foot of the tile (e.g. Listen); tiles side by side keep it level. */
  action?: React.ReactNode;
  /** The ring's size; smaller when the tile carries an action, so the pair stays short. */
  ringSize?: number;
}) {
  const ramped = RAMPED[tone];
  const ink = dataInk(tone, fraction);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? `${name}: ${value ? `${value}, ` : ''}${level}.${detail ? ` ${detail}` : ''}`}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      {onPress ? (
        <View style={styles.more}>
          <Icon name="chevron_right" size={20} color="textMuted" />
        </View>
      ) : null}
      <ScoreRing fraction={fraction} color={INK[tone]} ramp={ramped ? loudnessRamp : undefined} size={ringSize} stroke={10}>
        {value ? (
          <AppText variant="title" color="text" numberOfLines={1}>
            {value}
          </AppText>
        ) : icon ? (
          <Icon name={icon} size={40} color="text" />
        ) : null}
      </ScoreRing>
      <AppText color="text" style={styles.name} numberOfLines={1}>
        {name}
      </AppText>
      <View style={[styles.level, { backgroundColor: ramped ? alpha(colors.moon, 0.08) : TINT[tone] }]}>
        <View style={[styles.dot, { backgroundColor: ink }]} />
        <AppText variant="small" color="text">
          {level}
        </AppText>
      </View>
      {detail ? (
        <AppText variant="small" color="textMuted" style={styles.detail} numberOfLines={2}>
          {detail}
        </AppText>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: space.md, paddingTop: space.xl, paddingBottom: space.lg },
  pressed: { opacity: 0.85 },
  more: { position: 'absolute', top: space.md, right: space.md },
  name: { marginTop: space.lg, fontFamily: type.heading.fontFamily, fontWeight: type.heading.fontWeight },
  level: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 28, paddingHorizontal: space.md, borderRadius: radius.pill, marginTop: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  detail: { marginTop: space.sm, textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: 'auto', paddingTop: space.lg },
});
