import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Circle, Stop } from 'react-native-svg';
import { colors, gradients, motion, radius, space, useReducedMotion } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

const native = motion.useNativeDriver;
const TICKS = 60;
const TICK_W = 3;
const TICK_H = 12;
const DIM = 0.3; // unlit tick
const BUTTON = 0.64; // button diameter as a share of the dial
const TRAIL = 0.22; // share of the ring the travelling light's tail covers

/**
 * The record button: a big round mic inside a ring of ticks, the one "larger than life" element.
 *
 * Tap: the ticks light up round the ring (fast ease-out) and recording starts when it's full.
 * Stopping asks to confirm, so a stray tap costs nothing. At rest the button breathes very gently
 * (ambient preset), and now and then a light runs once round the ring (attention preset) to invite a tap.
 * Under it, the status line and an optional note, in one small muted block.
 * Reduce Motion: no breathing or travelling light; the ring fills at once.
 */
/** Where the button is on screen (window coordinates), for transitions that grow out of it. */
export type DialRect = { x: number; y: number; width: number; height: number; button: number };

/**
 * `ready`: false while something must happen first (e.g. the microphone is off). A tap then
 * calls onStart (to ask for it) and the dial resets at once, without saying "Recording started".
 */
export function RecordDial({ size, note, ready = true, onStart }: { size: number; note?: string; ready?: boolean; onStart?: (from: DialRect) => void }) {
  const ringRef = useRef<View>(null);
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current; // 0 → 1 as the ring lights after a tap
  const press = useRef(new Animated.Value(0)).current; // 0 → 1 while the finger is down
  const breath = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current; // light running round the ring: 0 → 1 + TRAIL
  const [state, setState] = useState<'idle' | 'starting' | 'started'>('idle');

  useEffect(() => {
    if (reduced) return breath.setValue(0);
    const half = { duration: motion.ambient.duration / 2, easing: motion.ambient.easing, useNativeDriver: native };
    const loop = Animated.loop(Animated.sequence([Animated.timing(breath, { toValue: 1, ...half }), Animated.timing(breath, { toValue: 0, ...half })]));
    loop.start();
    return () => loop.stop();
  }, [breath, reduced]);

  // At rest, a light runs round the ring now and then, inviting a tap.
  useEffect(() => {
    if (reduced || state !== 'idle') return sweep.setValue(0);
    const lap = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1 + TRAIL, duration: motion.attention.duration, easing: motion.attention.easing, useNativeDriver: native }),
        Animated.delay(motion.attention.rest),
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: native }),
      ]),
    );
    const wait = setTimeout(() => lap.start(), motion.stagger * 2); // let Home settle first
    return () => {
      clearTimeout(wait);
      lap.stop();
    };
  }, [reduced, state, sweep]);

  const start = () => {
    ringRef.current?.measureInWindow((x, y, width, height) => onStart?.({ x, y, width, height, button: width * BUTTON }));
    if (!ready) {
      Animated.timing(progress, { toValue: 0, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start();
      return setState('idle');
    }
    setState('started');
    // Prototype: no recording screen yet, so the dial resets after a beat.
    setTimeout(() => {
      Animated.timing(progress, { toValue: 0, duration: motion.slow.duration, easing: motion.slow.easeInOut, useNativeDriver: native }).start();
      setState('idle');
    }, motion.slow.duration);
  };

  const tap = () => {
    if (state !== 'idle') return;
    setState('starting');
    if (reduced) return start();
    Animated.timing(progress, { toValue: 1, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start(({ finished }) => finished && start());
  };
  const pressTo = (v: number) => Animated.timing(press, { toValue: v, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start();

  const button = Math.round(size * BUTTON);
  const radius = size / 2 - TICK_H / 2 - 4;
  const blue = gradients.splash[gradients.splash.length - 1].color;

  return (
    <View style={{ alignItems: 'center' }}>
      <View ref={ringRef} style={{ width: size, height: size }}>
        {/* Ring of ticks: they light round the ring after a tap */}
        {Array.from({ length: TICKS }, (_, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.tick,
              {
                left: size / 2 - TICK_W / 2,
                top: size / 2 - TICK_H / 2,
                opacity: progress.interpolate({ inputRange: [i / TICKS, (i + 1) / TICKS], outputRange: [DIM, 1], extrapolate: 'clamp' }),
                transform: [{ rotate: `${(360 / TICKS) * i}deg` }, { translateY: -radius }],
              },
            ]}
          />
        ))}

        {/* The travelling light: Moon ticks over the ring, brightest at the head, fading behind it */}
        {Array.from({ length: TICKS }, (_, i) => {
          const at = i / TICKS;
          return (
            <Animated.View
              key={`glint${i}`}
              pointerEvents="none"
              style={[
                styles.tick,
                styles.glint,
                {
                  left: size / 2 - TICK_W / 2,
                  top: size / 2 - TICK_H / 2,
                  opacity: sweep.interpolate({ inputRange: [at, at + 0.015, at + TRAIL], outputRange: [0, 1, 0], extrapolate: 'clamp' }),
                  transform: [{ rotate: `${(360 / TICKS) * i}deg` }, { translateY: -radius }],
                },
              ]}
            />
          );
        })}

        {/* The button */}
        <Animated.View
          style={[
            styles.center,
            {
              transform: [
                { scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) },
                { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] }) },
              ],
            },
          ]}
        >
          <Pressable
            onPress={tap}
            onPressIn={() => pressTo(1)}
            onPressOut={() => pressTo(0)}
            accessibilityRole="button"
            accessibilityLabel="Start recording"
            style={[styles.button, { width: button, height: button, borderRadius: button / 2 }]}
          >
            <Svg style={StyleSheet.absoluteFill} width={button} height={button}>
              <Defs>
                {/* Splash blues: the white mic stays at 5.7:1 or more (WCAG 1.4.11) */}
                <LinearGradient id="dial" x1="0.15" y1="0" x2="0.85" y2="1">
                  <Stop offset="0" stopColor={blue} />
                  <Stop offset="1" stopColor={gradients.splash[1].color} />
                </LinearGradient>
                <RadialGradient id="sheen" cx="35%" cy="25%" r="70%">
                  <Stop offset="0" stopColor={colors.accent} stopOpacity={0.6} />
                  <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={button / 2} cy={button / 2} r={button / 2} fill="url(#dial)" />
              <Circle cx={button / 2} cy={button / 2} r={button / 2} fill="url(#sheen)" />
            </Svg>
            {/* Positioned so it paints above the gradient on web too */}
            <View style={{ position: 'relative', zIndex: 1 }}>
              <Icon name="mic_fill" size={Math.round(button * 0.32)} color="white" />
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Same style as "Tap to stop recording" on the Recording screen: body, Moon */}
      <AppText color="text" accessibilityLiveRegion="polite" style={{ marginTop: space.md, textAlign: 'center' }}>
        {state === 'started' ? 'Recording started' : 'Tap to start recording'}
      </AppText>
      {note ? (
        // The privacy promise, with a lock so it reads as a fact rather than small print
        <View style={styles.note}>
          <Icon name="lock" size={16} color="accent" />
          <AppText variant="small" color="textMuted">
            {note}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  tick: { position: 'absolute', width: TICK_W, height: TICK_H, borderRadius: TICK_W / 2, backgroundColor: colors.accent },
  glint: { backgroundColor: colors.text, shadowColor: colors.accent, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    // Soft Breath glow
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
  },
});
