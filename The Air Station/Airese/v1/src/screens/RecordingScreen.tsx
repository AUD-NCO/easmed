import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AmbientGradient, AppText, BottomSheet, Button, ExplainSheet, Icon, InfoButton, ListeningRing, PAGE_SIDE, TipCarousel, type CarouselTip } from '../components';
import { MAX_RECORDING_MINUTES, formatClock, fromMinutes, minutesSince } from '../lib/time';
import { alpha, colors, gradients, motion, radius, space, useInsets, useReducedMotion } from '@ds/theme';
import { pausedCopy } from '../lib/recordingIssues';
import type { RecordOrigin } from './HomeScreen';
import { ProblemScreen } from './ProblemScreen';

const native = motion.useNativeDriver;
const RING_MAX = 300;
const RING_LABEL = 40; // room under the ring for "Tap to stop recording"
const GRADIENT_STRETCH = 1.4;

/**
 * Recording: shown all night while Airese listens.
 *
 * Arrives from Home: the record button's blue grows out from where it sat until it fills the
 * screen (slow ease-in-out), then this screen surfaces out of the blue: the gradient fades in,
 * the words rise into place and the listening ring opens out (slow ease-out, staggered).
 * Reduce Motion: no growing circle; the screen fades in.
 *
 * Type: the title, then one style for everything else (Inter 16 regular). Importance comes from
 * colour alone: Moon for what matters (the tips, the safety stop), Mist for the subtitle.
 *
 * Under the title, three tips in a carousel: lock the phone and leave Airese be, keep it charging,
 * and Night Notes (with a way to add them if there are none yet).
 *
 * Runs until you stop it when you wake: tap the button, then confirm, so a half-asleep tap never
 * ends the night. Stops by itself after 8 hours (MAX_RECORDING_MINUTES) if you forget.
 * Direction: Figma "iPhone 16 & 17 Pro - 15" (Oct 2026).
 *
 * Paused: recording stopped in the night (another app closed Airese) and the user has come back.
 * The problem screen (ProblemScreen): Carry on recording continues the same night; × stops for the
 * night (with the usual confirm). Engineering: set on returning to the app after the recorder was cut off.
 */
export function RecordingScreen({
  startedAt,
  from,
  onStop,
  notesTonight = '',
  onOpenNotes,
  pausedAt,
}: {
  startedAt: Date;
  /** Recording stopped at this time and hasn't carried on yet. */
  pausedAt?: Date;
  from?: RecordOrigin;
  onStop: () => void;
  /** Tonight's Night Notes, summarised; empty when none yet. */
  notesTonight?: string;
  onOpenNotes?: () => void;
}) {
  const insets = useInsets();
  const reduced = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [ringRoom, setRingRoom] = useState({ width: 0, height: 0 });
  const [, tick] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [info, setInfo] = useState(false);
  const [paused, setPaused] = useState(pausedAt);

  const flood = useRef(new Animated.Value(0)).current; // the blue circle: 0 button size → 1 fills the screen
  const surface = useRef(new Animated.Value(0)).current; // this screen fading in over the blue
  const ring = useRef(new Animated.Value(0)).current; // the listening ring opening out

  // "Recording for …" stays true through the night; the safety cap ends it after 8 hours.
  const elapsed = minutesSince(startedAt);
  const capAt = fromMinutes(startedAt.getHours() * 60 + startedAt.getMinutes() + MAX_RECORDING_MINUTES);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (elapsed >= MAX_RECORDING_MINUTES) onStop();
  }, [elapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (size.width === 0) return;
    const out = { easing: motion.slow.easeOut, useNativeDriver: native };
    const arrive = Animated.parallel([
      Animated.timing(surface, {
        toValue: 1,
        duration: motion.slow.duration,
        ...out,
      }),
      Animated.timing(ring, {
        toValue: 1,
        duration: motion.slow.duration,
        delay: motion.stagger,
        ...out,
      }),
    ]);
    if (reduced || !from) return arrive.start();
    Animated.sequence([
      Animated.timing(flood, {
        toValue: 1,
        duration: motion.slow.duration,
        easing: motion.slow.easeInOut,
        useNativeDriver: native,
      }),
      arrive,
    ]).start();
  }, [size.width > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // The blue circle: big enough to cover the screen from wherever the button was.
  const origin = from ?? { x: size.width / 2, y: size.height / 2, r: 60 };
  const cover = 2 * Math.hypot(Math.max(origin.x, size.width - origin.x), Math.max(origin.y, size.height - origin.y));
  const ringSize = Math.floor(Math.min(RING_MAX, ringRoom.width, ringRoom.height - RING_LABEL));
  const rise = (by: number) => ({
    opacity: surface,
    transform: [
      {
        translateY: surface.interpolate({
          inputRange: [0, 1],
          outputRange: [reduced ? 0 : by, 0],
        }),
      },
    ],
  });

  // Stopping asks first, from the ring or (paused) the ×
  const confirmSheet = (
    <BottomSheet visible={confirm} onClose={() => setConfirm(false)}>
      <AppText variant="heading" color="text" accessibilityRole="header" style={styles.center}>
        Stop recording?
      </AppText>
      <AppText color="textMuted" style={[styles.center, { marginTop: space.sm }]}>
        Airese will look through your night.
      </AppText>
      <Button
        label="Stop recording"
        onPress={() => {
          setConfirm(false);
          onStop();
        }}
        style={{ marginTop: space.xl }}
      />
      <Button label="Keep recording" variant="quiet" onPress={() => setConfirm(false)} style={{ marginTop: space.sm }} />
    </BottomSheet>
  );

  if (paused) {
    return (
      <ProblemScreen copy={pausedCopy(paused)} cta="Carry on recording" onCta={() => setPaused(undefined)} onClose={() => setConfirm(true)} closeLabel="Stop for the night">
        {confirmSheet}
      </ProblemScreen>
    );
  }

  return (
    <View style={styles.root} onLayout={(e: LayoutChangeEvent) => setSize(e.nativeEvent.layout)}>
      <StatusBar style="light" />

      {/* 1. The record button's blue, growing to fill the screen */}
      {size.width > 0 && from && !reduced && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: cover,
            height: cover,
            left: origin.x - cover / 2,
            top: origin.y - cover / 2,
            borderRadius: cover / 2,
            backgroundColor: gradients.splash[2].color,
            transform: [
              {
                scale: flood.interpolate({
                  inputRange: [0, 1],
                  outputRange: [(origin.r * 2) / cover, 1],
                }),
              },
            ],
          }}
        />
      )}

      {/* 2. This screen, surfacing out of the blue */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: surface }]} pointerEvents="none">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
        {/* Runs past the bottom edge, so the text at the bottom sits on mid blue (Moon at 7:1 or more) */}
        {size.width > 0 && <AmbientGradient width={size.width} height={size.height * GRADIENT_STRETCH} />}
      </Animated.View>

      <View style={{ flex: 1, paddingTop: insets.top + space.xl }}>
        <Animated.View style={[{ paddingHorizontal: PAGE_SIDE }, rise(12)]}>
          <AppText variant="title" color="white" accessibilityRole="header">
            Recording…
          </AppText>
          {/* What's happening, with (i) for how recording works */}
          <View style={styles.subtitle}>
            <AppText color="textMuted" style={{ flex: 1 }}>
              Listening privately, on this phone.
            </AppText>
            <InfoButton color="textMuted" label="How recording works" onPress={() => setInfo(true)} />
          </View>
        </Animated.View>

        {/* Tonight's tips: swipe or tap the dashes */}
        <Animated.View style={[{ paddingHorizontal: PAGE_SIDE, paddingTop: space.xl }, rise(12)]}>
          <TipCarousel tips={tonightTips(notesTonight, onOpenNotes)} />
        </Animated.View>

        <View style={styles.ringArea} onLayout={(e: LayoutChangeEvent) => setRingRoom(e.nativeEvent.layout)}>
          {ringSize > 0 && (
            <Animated.View
              style={{
                opacity: ring,
                transform: [
                  {
                    scale: ring.interpolate({
                      inputRange: [0, 1],
                      outputRange: [reduced ? 1 : 0.7, 1],
                    }),
                  },
                ],
              }}
            >
              <ListeningRing size={ringSize} onStop={() => setConfirm(true)} />
              {/* Says what the button does; same style as "Tap to start recording" on Home: body, Moon */}
              <AppText color="text" style={[styles.center, { marginTop: space.sm }]} importantForAccessibility="no" accessibilityElementsHidden>
                Tap to stop recording
              </AppText>
            </Animated.View>
          )}
        </View>

        <Animated.View style={[styles.note, rise(8), { marginBottom: Math.max(insets.bottom, space.lg) + space.xl }]}>
          {/* The safety net, said plainly: a chip, not a footnote */}
          <View style={styles.cap} accessible accessibilityLabel={`Stops by itself after ${MAX_RECORDING_MINUTES / 60} hours, at ${formatClock(capAt)}`}>
            <Icon name="schedule" size={20} color="text" />
            <AppText color="text" style={{ flexShrink: 1 }}>
              {`Stops by itself after ${MAX_RECORDING_MINUTES / 60} hours`}
            </AppText>
          </View>
        </Animated.View>
      </View>

      {confirmSheet}

      {/* (i): how recording works, plain and factual (design-system/docs/BRAND.md) */}
      <ExplainSheet
        content={info ? { title: 'How recording works', body: 'Airese listens through your phone’s microphone, even with the screen locked. It keeps short moments of snoring and breathing, and works out your night on this phone. Nothing leaves it unless you choose to share.' } : null}
        onClose={() => setInfo(false)}
      />
    </View>
  );
}

/** What to know once recording has started. Copy: plain and calm (design-system/docs/BRAND.md). */
function tonightTips(notesTonight: string, onOpenNotes?: () => void): CarouselTip[] {
  return [
    { id: 'lock', icon: 'lock', text: 'Keep Airese open. Just lock your phone.' },
    { id: 'charge', icon: 'battery_charging_full', text: 'Keep your phone on charge.' },
    notesTonight
      ? { id: 'notes', icon: 'edit_note', text: 'Night Notes added for tonight.' }
      : { id: 'notes', icon: 'edit_note', text: 'No Night Notes yet tonight.', action: onOpenNotes ? { label: 'Add', onPress: onOpenNotes } : undefined },
  ];
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  subtitle: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xs },
  ringArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xl,
    marginHorizontal: PAGE_SIDE,
  },
  note: {
    paddingHorizontal: PAGE_SIDE,
    marginTop: space.lg,
    alignItems: 'center',
  },
  cap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 44,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: alpha(colors.moon, 0.12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(colors.moon, 0.35),
  },
  center: { textAlign: 'center' },
});
