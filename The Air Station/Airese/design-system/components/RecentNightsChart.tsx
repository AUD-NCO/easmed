import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { alpha, colors, space } from '../theme';
import { AppText } from './AppText';
import { RampFill } from './RampFill';

const HEIGHT = 112; // plot height
const GAP = 8; // between bars
const LABEL = 22; // room above the tallest bar for tonight's value

/**
 * The last 7 nights as bars: tonight through the loudness ramp up to `level` (where tonight sits on
 * its guide scale, 0 to 1, so the bar ends in the same colour as tonight's snoring score) with its
 * value on top, the earlier nights in neutral grey, and a dashed line at the user's usual. Day names
 * underneath. Single series, so no legend box; the card's sentence names it.
 */
export function RecentNightsChart({ nights, usual, level, format }: { nights: { day: string; value: number; tonight: boolean }[]; usual: number; level: number; format: (v: number) => string }) {
  const [width, setWidth] = useState(0);
  const max = Math.max(usual, ...nights.map((n) => n.value)) * 1.05 || 1;
  const y = (v: number) => (v / max) * (HEIGHT - LABEL);
  const barW = width > 0 ? (width - GAP * (nights.length - 1)) / nights.length : 0;
  const tonight = nights.find((n) => n.tonight);

  return (
    <View accessible accessibilityLabel={`Last ${nights.length} nights. Tonight ${tonight ? format(tonight.value) : ''}. Your usual is ${format(usual)}.`}>
      <View style={{ height: HEIGHT }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 &&
          nights.map((n, i) => (
            <View key={i} style={{ position: 'absolute', left: i * (barW + GAP), width: barW, bottom: 0, alignItems: 'center' }}>
              <View style={[styles.bar, { height: Math.max(4, y(n.value)) }, !n.tonight && styles.earlier]}>{n.tonight && <RampFill to={level} />}</View>
            </View>
          ))}
        {/* Tonight's value, above its bar (the last one), right-aligned to the card */}
        {width > 0 && tonight && (
          <AppText variant="caption" color="text" style={[styles.value, { bottom: Math.max(4, y(tonight.value)) + space.xs }]}>
            {format(tonight.value)}
          </AppText>
        )}
        {/* Your usual: dashed line with its label */}
        {width > 0 && (
          <View style={[styles.usual, { bottom: y(usual) }]} pointerEvents="none">
            <View style={styles.dash} />
          </View>
        )}
      </View>
      <View style={styles.baseline} />
      <View style={styles.days}>
        {nights.map((n, i) => (
          <AppText key={i} variant="caption" color={n.tonight ? 'text' : 'textMuted'} style={{ width: barW, textAlign: 'center' }}>
            {n.day}
          </AppText>
        ))}
      </View>
      <View style={styles.key}>
        <View style={[styles.dash, { width: 18, flex: 0 }]} />
        <AppText variant="caption" color="textMuted">{`Your usual: ${format(usual)}`}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Wider than its bar, so the value stays on one line; right-aligned so it never runs off the card.
  value: { position: 'absolute', right: 0, width: 140, textAlign: 'right' },
  bar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4, overflow: 'hidden' },
  earlier: { backgroundColor: alpha(colors.moon, 0.16) }, // earlier nights neutral, so tonight's colour stands out
  usual: { position: 'absolute', left: 0, right: 0, height: 0 },
  dash: { flex: 1, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: colors.mist },
  baseline: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
  key: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
});
