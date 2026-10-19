import React from 'react';
import { StyleSheet, View } from 'react-native';
import { INTENSITY_LABEL, type Intensity } from '../lib/nightDetails';
import { alpha, colors, loudness, space } from '@ds/theme';
import { AppText } from '@ds/components/AppText';

const ORDER: Intensity[] = ['light', 'moderate', 'loud', 'veryLoud'];

/**
 * How the snoring split by loudness (after the reference): a dot, the level, a bar and the share.
 * The `loudness` ramp, cyan to red, the same colours as the snoring chart. `compact`: one stacked bar.
 */
export function LoudnessBars({ share, compact = false }: { share: Record<Intensity, number>; compact?: boolean }) {
  if (compact) {
    return (
      <View style={styles.stack} accessible accessibilityLabel={ORDER.map((k) => `${INTENSITY_LABEL[k]} ${share[k]}%`).join(', ')}>
        {ORDER.filter((k) => share[k] > 0).map((k) => (
          <View key={k} style={{ flex: share[k], backgroundColor: loudness[k] }} />
        ))}
      </View>
    );
  }
  return (
    <View style={{ gap: space.md }}>
      {ORDER.map((k) => (
        <View key={k} style={styles.row} accessible accessibilityLabel={`${INTENSITY_LABEL[k]}: ${share[k]}% of snoring`}>
          <View style={[styles.dot, { backgroundColor: loudness[k] }]} />
          <AppText color="text" style={{ width: 92 }}>
            {INTENSITY_LABEL[k]}
          </AppText>
          <View style={styles.track}>
            <View style={{ width: `${share[k]}%`, height: '100%', borderRadius: 5, backgroundColor: loudness[k] }} />
          </View>
          <AppText color="textMuted" style={{ width: 44, textAlign: 'right' }}>
            {`${share[k]}%`}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 28 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: alpha(colors.mist, 0.1), overflow: 'hidden' },
  stack: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2, backgroundColor: colors.surface },
});
