import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { zoneOf, type Benchmark } from '../lib/benchmarks';
import { alpha, colors, space } from '@ds/theme';
import { AppText } from '@ds/components/AppText';

const TRACK = 10;
const MARK = 18;
const GAP = 3;

/**
 * Where tonight sits: a bar split into zones (named underneath), the zone tonight falls in filled
 * in `color`, the colour the score reaches (`dataInk`, as on its ring; the others neutral), a marker for tonight, and a small tick for the
 * user's usual when known. Words do the judging, not colour alone.
 */
export function BenchmarkScale({ b, color }: { b: Benchmark; color: string }) {
  const [width, setWidth] = useState(0);
  const x = (v: number) => ((Math.min(b.max, Math.max(b.min, v)) - b.min) / (b.max - b.min)) * width;
  const edges = [b.min, ...b.zones.map((z) => z.upTo)];
  const current = zoneOf(b);

  return (
    <View accessible accessibilityLabel={`${b.name}: ${b.display}. Scale ${b.zones.map((z) => z.word).join(', ')}.${b.usual != null ? ' Your usual is marked.' : ''}`}>
      <View style={{ height: MARK + 4, justifyContent: 'center' }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <>
            {b.zones.map((z, i) => (
              <View
                key={z.word}
                style={[styles.zone, { left: x(edges[i]) + (i ? GAP / 2 : 0), width: x(edges[i + 1]) - x(edges[i]) - (i ? GAP : GAP / 2), backgroundColor: z === current ? color : alpha(colors.moon, 0.14) }]}
              />
            ))}
            {b.usual != null && <View style={[styles.usual, { left: x(b.usual) - 1 }]} />}
            <View style={[styles.mark, { left: x(b.value) - MARK / 2, borderColor: color }]} />
          </>
        )}
      </View>
      <View style={styles.words}>
        {width > 0 &&
          b.zones.map((z, i) => (
            <AppText key={z.word} variant="small" color={z === current ? 'text' : 'textMuted'} numberOfLines={1} style={[styles.word, wordBox(x(edges[i]), x(edges[i + 1]), width)]}>
              {z.word}
            </AppText>
          ))}
      </View>
    </View>
  );
}

/** A zone's word, centred under it; at least 84 wide so short zones don't wrap, kept inside the scale. */
function wordBox(a: number, b: number, total: number) {
  const w = Math.max(84, b - a);
  return { width: w, left: Math.min(total - w, Math.max(0, (a + b) / 2 - w / 2)) };
}

const styles = StyleSheet.create({
  zone: { position: 'absolute', height: TRACK, borderRadius: TRACK / 2 },
  usual: { position: 'absolute', width: 2, height: MARK + 4, borderRadius: 1, backgroundColor: colors.mist },
  mark: { position: 'absolute', width: MARK, height: MARK, borderRadius: MARK / 2, backgroundColor: colors.text, borderWidth: 4 },
  words: { height: 24, marginTop: space.xs },
  word: { position: 'absolute', textAlign: 'center' },
});
