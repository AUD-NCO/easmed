import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AppText, Logo } from '../components';
import { colors, gradients, motion, space, useReducedMotion } from '@ds/theme';

/** Total time on screen before the exit starts (includes the intro). */
const HOLD_MS = 3000;

const native = motion.useNativeDriver;

/**
 * Launch screen, shown after the native splash while the app loads.
 * Design: Figma "iPhone 16 & 17 Pro - 1". Vertical gradient from Midnight to
 * blue, white stacked logo centred, "Powered by The Air Station" below it.
 *
 * Exit transition: the gradient and logo drop away like a curtain falling.
 * The screen behind is Midnight, the gradient's top colour and the app
 * background, so the top colour seems to fill the screen and becomes the
 * next screen. `onFinish` fires once the fall completes; navigate there
 * without an animation of its own.
 */
export function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const reduced = useReducedMotion();
  const logoIn = useRef(new Animated.Value(0)).current;
  const subtextIn = useRef(new Animated.Value(0)).current;
  const fall = useRef(new Animated.Value(0)).current; // 0 = in place, 1 = gone below the screen

  // Intro: logo rises in; the subtext follows while the logo is still settling (overlapped, not chained).
  useEffect(() => {
    const enter = { duration: motion.slow.duration, easing: motion.slow.easeOut, useNativeDriver: native };
    Animated.parallel([
      Animated.timing(logoIn, { toValue: 1, delay: motion.stagger, ...enter }),
      Animated.timing(subtextIn, { toValue: 1, delay: motion.stagger * 3, ...enter }),
    ]).start();
  }, [logoIn, subtextIn]);

  // Exit: after the hold, fall away (or just finish if the user prefers reduced motion).
  useEffect(() => {
    if (!onFinish || size.height === 0) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (cancelled) return;
      if (reduceMotion) return onFinish();
      Animated.timing(fall, {
        toValue: 1,
        duration: motion.slow.duration,
        // Glides down and away: soft start, soft finish as it leaves the screen.
        easing: motion.slow.easeInOut,
        useNativeDriver: native,
      }).start(({ finished }) => finished && !cancelled && onFinish());
    }, HOLD_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [onFinish, size.height, fall]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const fallY = fall.interpolate({ inputRange: [0, 1], outputRange: [0, size.height] });

  return (
    <View style={styles.root} onLayout={onLayout}>
      <StatusBar style="light" />

      {size.width > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, { transform: [{ translateY: fallY }] }]}>
          <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height}>
            <Defs>
              <LinearGradient id="splash" x1="0" y1="0" x2="0" y2="1">
                {gradients.splash.map((s) => (
                  <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect width={size.width} height={size.height} fill="url(#splash)" />
          </Svg>

          <Animated.View
            style={{
              opacity: logoIn,
              transform: [{ translateY: logoIn.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 10, 0] }) }],
            }}
          >
            <Logo width={128} color="white" />
          </Animated.View>

          <Animated.View style={{ opacity: subtextIn, marginTop: space.sm }}>
            <AppText variant="caption" color="moon">
              Powered by The Air Station
            </AppText>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // What's revealed as the splash falls: the app background, same as the gradient's top.
  root: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
