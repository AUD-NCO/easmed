import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { alpha, colors, space } from '../theme';
import { AppText } from './AppText';
import { RampFill } from './RampFill';

const GAP = 6;

/**
 * Snoring minutes (or breathing pauses) in each hour of the night, hour labels underneath, the busiest
 * hour labelled with its value. Each bar runs through the loudness ramp up to the colour its value
 * reaches on `scale` (the value that counts as the top: a whole hour of snoring by default), like the
 * score rings; hours with none show a faint neutral stub. Heights are relative to the night's busiest
 * hour, colours to the fixed scale, so a quiet night stays cyan. `compact`: a small sparkline for a square card (no labels).
 */
export function HourlyBars({ hours, compact = false, scale = 60, what = 'Snoring', unit = 'min' }: { hours: { label: string; minutes: number }[]; compact?: boolean; scale?: number; what?: string; unit?: string }) {
  const [width, setWidth] = useState(0);
  const H = compact ? 44 : 120;
  const max = Math.max(1, ...hours.map((h) => h.minutes));
  const peak = hours.findIndex((h) => h.minutes === max);
  const gap = compact ? 3 : GAP;
  const barW = width > 0 ? (width - gap * (hours.length - 1)) / hours.length : 0;

  return (
    <View accessible={!compact} accessibilityLabel={`${what} by hour. Most at ${hours[peak]?.label}: ${max} ${unit}.`}>
      <View style={{ height: H }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 &&
          hours.map((h, i) => (
            <View key={i} style={{ position: 'absolute', left: i * (barW + gap), width: barW, bottom: 0, alignItems: 'center' }}>
              {!compact && i === peak && (
                <AppText variant="small" color="text" style={styles.peak}>
                  {`${h.minutes} ${unit}`}
                </AppText>
              )}
              <View style={{ width: '100%', height: Math.max(3, (h.minutes / max) * (H - (compact ? 0 : 26))), borderRadius: compact ? 2 : 4, overflow: 'hidden', backgroundColor: h.minutes ? undefined : alpha(colors.moon, 0.14) }}>
                {h.minutes > 0 && <RampFill to={h.minutes / scale} />}
              </View>
            </View>
          ))}
      </View>
      {!compact && (
        <View style={styles.labels}>
          {hours.map((h, i) => (
            <AppText key={i} variant="small" color="textMuted" style={{ width: barW + gap, textAlign: 'center', opacity: i % 2 === 0 ? 1 : 0 }}>
              {h.label.replace(' ', ' ')}
            </AppText>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  peak: { position: 'absolute', bottom: '100%', width: 80, textAlign: 'center', marginBottom: space.xs },
  labels: { flexDirection: 'row', marginTop: space.sm },
});
