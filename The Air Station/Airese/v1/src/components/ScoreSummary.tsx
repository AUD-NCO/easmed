import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@ds/components/AppText';
import { Icon, type IconName } from '@ds/components/Icon';
import { ScoreRing } from '@ds/components/ScoreRing';
import { colors, dataInk, loudnessRamp, radius, space } from '@ds/theme';

/**
 * One headline score as a full-width card (Recording Details, "Option 2"): what it says on the left,
 * the ring on the right. Left: the score's name, its level as a big word, then either the parts it's
 * made of (a dot in the colour the ramp reaches for that part, "44/50") or one line of facts. Under a
 * hairline, an optional sentence on the night. Rings run through the loudness ramp (more is worse).
 * Text is Moon and Mist only; the data colours are for the ring and dots.
 */
export function ScoreSummary({
  tone,
  fraction,
  value,
  icon,
  name,
  level,
  parts,
  facts,
  line,
  ringSize = 104,
}: {
  tone: 'snoring' | 'breathing';
  fraction: number;
  /** In the ring; leave out to show `icon` instead. */
  value?: string;
  icon?: IconName;
  name: string;
  level: string;
  parts?: { label: string; value: number; max: number }[];
  facts?: string;
  line?: string;
  ringSize?: number;
}) {
  const color = tone === 'snoring' ? colors.dataSnoring : colors.dataBreathing;
  const said = [name, value, level, ...(parts ?? []).map((p) => `${p.label} ${p.value} of ${p.max}`), facts, line].filter(Boolean).join('. ');
  return (
    <View style={styles.card} accessible accessibilityLabel={said}>
      <View style={styles.top}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="small" color="textMuted">
            {name}
          </AppText>
          <AppText variant="headline" color="text">
            {level}
          </AppText>
          {parts?.map((p) => (
            <View key={p.label} style={styles.part}>
              <View style={[styles.dot, { backgroundColor: dataInk(tone, p.value / p.max) }]} />
              <AppText variant="small" color="text">{`${p.label}: ${p.value}/${p.max}`}</AppText>
            </View>
          ))}
          {facts ? (
            <AppText variant="small" color="textMuted" style={{ marginTop: space.xs }}>
              {facts}
            </AppText>
          ) : null}
        </View>
        <ScoreRing fraction={fraction} color={color} ramp={loudnessRamp} size={ringSize} stroke={10}>
          {value ? (
            <AppText variant="headline" color="text">
              {value}
            </AppText>
          ) : icon ? (
            <Icon name={icon} size={32} color="text" />
          ) : null}
        </ScoreRing>
      </View>
      {line ? (
        <View style={styles.line}>
          <AppText color="text">{line}</AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: space.gutter, paddingVertical: space.lg }, // compact: three cards share the first fold
  top: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  part: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { marginTop: space.md, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
});
