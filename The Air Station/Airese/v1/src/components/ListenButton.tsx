import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@ds/components/AppText';
import { Icon } from '@ds/components/Icon';
import { alpha, colors, motion, radius, space, useReducedMotion } from '@ds/theme';
import { BorderShine } from './ReportTrio';

/**
 * The way from a score to the sound behind it: "Listen", at the foot of a score tile. It doesn't play
 * here: it takes you down to the recording (the moment card), with that moment picked and ready.
 * A Breath play disc, so it's the brightest thing on the tile; Moon label on a light Moon wash (9:1+).
 * `filled` (Layout Option 5): a Breath wash instead (Moon label 7:1+), still well short of a solid button. The same size.
 * `attention` (a severe night): once the card has settled, two lights run around the border while a small sound wave
 * moves beside the label; then both rest, the wave flat, like a breathing pause, and it starts again (the attention
 * preset). Reduce Motion: the wave lies flat and nothing moves.
 */
export function ListenButton({ onPress, accessibilityLabel, filled = false, attention = false }: { onPress: () => void; accessibilityLabel: string; filled?: boolean; attention?: boolean }) {
  const reduced = useReducedMotion();
  const [t] = useState(() => new Animated.Value(0)); // 0 → 1: one lap of the lights, one burst of the wave
  useEffect(() => {
    if (!attention || reduced) return;
    const { duration, rest, easing } = motion.attention;
    const run = Animated.sequence([
      Animated.delay(motion.slow.duration), // once the card's flip has settled
      Animated.loop(Animated.sequence([Animated.timing(t, { toValue: 1, duration, easing, useNativeDriver: false }), Animated.delay(rest)])),
    ]);
    run.start();
    return () => run.stop();
  }, [attention, reduced, t]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Goes to the recording"
      style={({ pressed }) => [styles.button, filled && styles.filled, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.disc}>
        <Icon name="play_fill" size={18} color="onAccent" />
      </View>
      <AppText variant="button" color="text">
        Listen
      </AppText>
      {attention && (
        <View style={styles.wave}>
          {WAVE.map((outputRange, i) => (
            <Animated.View key={i} style={[styles.bar, { transform: [{ scaleY: t.interpolate({ inputRange: WAVE_AT, outputRange }) }] }]} />
          ))}
        </View>
      )}
      {attention && !reduced && <BorderShine t={t} corner={22} laps={1} loud />}
    </Pressable>
  );
}

// The wave's bars through one burst, flat at both ends
const WAVE_AT = [0, 0.2, 0.4, 0.6, 0.8, 1];
const WAVE = [
  [0.2, 0.7, 0.4, 0.9, 0.5, 0.2],
  [0.2, 1, 0.6, 0.5, 1, 0.2],
  [0.2, 0.5, 1, 0.7, 0.6, 0.2],
  [0.2, 0.8, 0.5, 1, 0.4, 0.2],
];

const styles = StyleSheet.create({
  // The disc sits at the pill's left edge, an even 6 pt in on every side, like a media control
  button: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44, padding: space.xs + 2, paddingRight: space.lg, borderRadius: radius.pill, backgroundColor: alpha(colors.moon, 0.1) },
  filled: { backgroundColor: alpha(colors.accent, 0.2) },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto', height: 16 },
  bar: { width: 3, height: 16, borderRadius: 1.5, backgroundColor: colors.accent },
  disc: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingLeft: 2, backgroundColor: colors.accent }, // a play triangle reads centred a touch right of centre
});
