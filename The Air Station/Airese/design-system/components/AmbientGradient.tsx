import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors, gradients, motion, useReducedMotion } from '../theme';

const native = motion.useNativeDriver;

/**
 * Base layer for Home and Recording: the splash blues, night at the top to bright blue at the bottom, with two soft
 * glows drifting slowly across it (one ambient breath in, one out). Very faint on purpose:
 * just enough to feel alive. Static with Reduce Motion. Text over it stays at AAA contrast.
 */
export function AmbientGradient({ width, height }: { width: number; height: number }) {
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (reduced) return t.setValue(0.5);
    const breath = { duration: motion.ambient.duration, easing: motion.ambient.easing, useNativeDriver: native };
    const loop = Animated.loop(Animated.sequence([Animated.timing(t, { toValue: 1, ...breath }), Animated.timing(t, { toValue: 0, ...breath })]));
    loop.start();
    return () => loop.stop();
  }, [reduced, t]);

  const glow = width * 1.1;
  const drift = (from: number, to: number) => t.interpolate({ inputRange: [0, 1], outputRange: [from, to] });

  return (
    <View style={[styles.ambient, { height }]} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="base" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.night} />
            <Stop offset="0.5" stopColor={gradients.splash[1].color} />
            <Stop offset="1" stopColor={gradients.splash[2].color} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#base)" />
      </Svg>

      <Animated.View
        style={[styles.glow, { width: glow, height: glow, left: -glow * 0.35, top: height * 0.15, opacity: drift(0.35, 0.6), transform: [{ translateX: drift(0, width * 0.25) }, { translateY: drift(10, -10) }] }]}
      >
        <Glow id="glowA" size={glow} color={gradients.splash[2].color} />
      </Animated.View>
      <Animated.View
        style={[styles.glow, { width: glow, height: glow, right: -glow * 0.45, top: height * 0.35, opacity: drift(0.4, 0.2), transform: [{ translateX: drift(0, -width * 0.2) }] }]}
      >
        <Glow id="glowB" size={glow} color={colors.accent} />
      </Animated.View>
    </View>
  );
}

function Glow({ id, size, color }: { id: string; size: number; color: string }) {
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.55} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  ambient: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  glow: { position: 'absolute' },
});
