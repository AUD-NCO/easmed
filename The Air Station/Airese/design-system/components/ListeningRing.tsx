import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { colors, gradients, motion, useReducedMotion } from '../theme';
import { Icon } from './Icon';

const native = motion.useNativeDriver;
const BARS = 72;
const BAR_W = 2.5;
const KEYS = 9; // level keyframes per loop (first and last match, so the loop is seamless)

/**
 * While recording: the stop button inside a ring of bars that rise and fall like a calm sound level,
 * the night counterpart of the record dial. Airese blues only (no red: nothing alarming at night).
 *
 * Prototype: levels are simulated, drifting slowly over the ambient preset.
 * Engineering: drive each bar from the live input level instead (quiet room = short, even bars).
 * Reduce Motion: bars hold still at a gentle mid level.
 */
export function ListeningRing({ size, onStop }: { size: number; onStop: () => void }) {
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return t.setValue(0);
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: motion.ambient.duration, easing: Easing.linear, useNativeDriver: native }));
    loop.start();
    return () => loop.stop();
  }, [reduced, t]);

  // Each bar gets its own random levels, louder towards a few soft "peaks" round the ring.
  const levels = useMemo(
    () =>
      Array.from({ length: BARS }, (_, i) => {
        const swell = 0.55 + 0.45 * Math.abs(Math.sin((i / BARS) * Math.PI * 3));
        const keys = Array.from({ length: KEYS - 1 }, () => (0.25 + Math.random() * 0.75) * swell);
        return [...keys, keys[0]];
      }),
    [],
  );
  const input = Array.from({ length: KEYS }, (_, k) => k / (KEYS - 1));

  const button = Math.round(size * 0.34);
  const halo = Math.round(size * 0.56);
  const inner = size * 0.3; // where bars start (from the centre)
  const maxBar = size * 0.17;
  const blue = gradients.splash[gradients.splash.length - 1].color;

  return (
    <View style={{ width: size, height: size }}>
      {/* Bars */}
      {levels.map((lv, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[styles.barSlot, { left: size / 2 - BAR_W / 2, top: size / 2 - maxBar / 2, height: maxBar, transform: [{ rotate: `${(360 / BARS) * i}deg` }, { translateY: -(inner + maxBar / 2) }] }]}
        >
          <Animated.View
            style={[
              styles.bar,
              {
                height: maxBar,
                opacity: 0.5 + 0.5 * (i % 3 === 0 ? 1 : 0.6),
                transform: [{ translateY: maxBar / 2 }, { scaleY: reduced ? 0.45 : t.interpolate({ inputRange: input, outputRange: lv }) }, { translateY: -maxBar / 2 }],
              },
            ]}
          />
        </View>
      ))}

      {/* Soft halo, then the stop button */}
      <View style={styles.center} pointerEvents="box-none">
        <View pointerEvents="none" style={{ position: 'absolute', width: halo, height: halo }}>
          <Svg width={halo} height={halo}>
            <Defs>
              <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
                <Stop offset="0.55" stopColor={colors.accent} stopOpacity={0.22} />
                <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={halo / 2} cy={halo / 2} r={halo / 2} fill="url(#halo)" />
          </Svg>
        </View>
        <Pressable
          onPress={onStop}
          accessibilityRole="button"
          accessibilityLabel="Stop recording"
          style={({ pressed }) => [styles.button, { width: button, height: button, borderRadius: button / 2, opacity: pressed ? 0.85 : 1 }]}
        >
          <Svg style={StyleSheet.absoluteFill} width={button} height={button}>
            <Defs>
              {/* Same blues as the record dial: white stop square at 5.7:1 or more (WCAG 1.4.11) */}
              <LinearGradient id="stop" x1="0.15" y1="0" x2="0.85" y2="1">
                <Stop offset="0" stopColor={blue} />
                <Stop offset="1" stopColor={gradients.splash[1].color} />
              </LinearGradient>
            </Defs>
            <Circle cx={button / 2} cy={button / 2} r={button / 2} fill="url(#stop)" />
          </Svg>
          <View style={{ position: 'relative', zIndex: 1 }}>
            <Icon name="stop_fill" size={Math.round(button * 0.4)} color="white" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barSlot: { position: 'absolute', width: BAR_W }, // bottom end faces the centre; bars grow outwards
  bar: { width: BAR_W, borderRadius: BAR_W / 2, backgroundColor: colors.accent },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
});
