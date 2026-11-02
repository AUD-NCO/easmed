import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { alpha, colors, motion, radius, space, useReducedMotion } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { IconStack } from './IconStack';

/**
 * A small bright banner that opens something (the Sleep Diary's check-ins): one row on Breath, the
 * whole of it a button. Text on the left (one line), then what's chosen as fading icons, and a chevron.
 * `label` is what screen readers hear (say what's chosen).
 * `quiet`: a plain row on the card surface with a small check-in icon, for when it shouldn't compete
 * with what's above it (a night's report, under the verdict).
 * `shine`: one soft light sweeps across it once, shortly after it appears, so it isn't missed
 * (the glint preset; never repeats). Reduce Motion: no sweep.
 */
export function CheckInBanner({ text, icons = [], label, onPress, quiet = false, shine = false }: { text: string; icons?: IconName[]; label?: string; onPress: () => void; quiet?: boolean; shine?: boolean }) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;
  const sweeping = shine && !reduced && width > 0;
  useEffect(() => {
    if (!sweeping) return;
    const run = Animated.timing(sweep, { toValue: 1, duration: motion.glint.duration, delay: motion.stagger * 2, easing: motion.glint.easing, useNativeDriver: motion.useNativeDriver });
    run.start();
    return () => run.stop();
  }, [sweeping, sweep]);

  return (
    <Pressable
      onPress={onPress}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="button"
      accessibilityLabel={label ?? text}
      style={({ pressed }) => [styles.banner, quiet && styles.quiet, pressed && { opacity: 0.8 }]}
    >
      {sweeping && (
        <Animated.View
          pointerEvents="none"
          style={[styles.shine, { transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-SHINE, width + SHINE] }) }, { skewX: '-20deg' }] }]}
        />
      )}
      {quiet && <Icon name="edit_note" size={24} color="accent" />}
      <AppText color={quiet ? 'text' : 'onAccent'} numberOfLines={1} style={styles.text}>
        {text}
      </AppText>
      {icons.length > 0 && <IconStack icons={icons} />}
      <Icon name="chevron_right" size={24} color={quiet ? 'textMuted' : 'onAccent'} />
    </Pressable>
  );
}

const SHINE = 72; // the light band's width, in points

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingLeft: space.lg, paddingRight: space.md, borderRadius: radius.lg, backgroundColor: colors.accent },
  quiet: { backgroundColor: colors.surface, overflow: 'hidden' },
  shine: { position: 'absolute', top: 0, bottom: 0, left: 0, width: SHINE, backgroundColor: alpha(colors.moon, 0.08) },
  text: { flex: 1, minWidth: 0 },
});
