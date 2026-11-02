import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { alpha, colors, motion, useReducedMotion } from '../theme';
import { Icon } from './Icon';

const SIZE = 32;

/**
 * A small star in Lamp that marks something Airese does that other apps don't (e.g. breathing pauses),
 * placed in a card's corner. A soft halo swells out of it and fades, then rests (the attention preset):
 * noticed, never shouting. Tap for the short story. Reduce Motion: the star alone, still.
 * 32 pt, with hit slop to a 44 pt target. Always give it a label.
 */
export function Spotlight({ label, onPress }: { label: string; onPress: () => void }) {
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const { duration, rest, easing } = motion.attention;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(motion.stagger),
        Animated.timing(t, { toValue: 1, duration, easing, useNativeDriver: motion.useNativeDriver }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: motion.useNativeDriver }),
        Animated.delay(rest),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, t]);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={({ pressed }) => [styles.root, pressed && { opacity: 0.7 }]}>
      {!reduced && (
        <Animated.View
          pointerEvents="none"
          style={[styles.halo, { opacity: t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.45, 0] }), transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }] }]}
        />
      )}
      <View style={styles.badge}>
        <Icon name="star_shine_fill" size={20} color="lamp" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: colors.lamp },
  badge: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.lamp, 0.16) },
});
