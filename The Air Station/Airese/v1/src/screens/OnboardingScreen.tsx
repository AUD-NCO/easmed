import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View, type ImageSourcePropType, type LayoutChangeEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText, BottomSheet, Button, IconButton, InfoButton } from '../components';
import { colors, motion, radius, space, useInsets, useReducedMotion } from '@ds/theme';

/**
 * Artwork shown inside the circle. Each source image is a square with the
 * circle painted on it; cx/cy/d (in source pixels) locate that painted circle
 * so it can be lined up with, and clipped to, the on-screen circle.
 */
type Illustration = { source: ImageSourcePropType; px: number; cx: number; cy: number; d: number };

type Slide = {
  title: string;
  /** What the page's (i) says. */
  info: string;
  illustration: Illustration;
  /** Last page only: the way forward. */
  showContinue?: boolean;
};

// Headlines only, each saying the whole point in about two lines (Oct 2026); more is in each page's (i).
const SLIDES: Slide[] = [
  {
    title: 'Record your sleep with just your phone.',
    info: 'Put your phone by the bed and tap record. Airese listens for snoring and breathing, and keeps short moments you can play back in the morning.',
    illustration: { source: require('../../assets/onboarding/1-hear.jpg'), px: 1254, cx: 622, cy: 598, d: 1117 },
  },
  {
    title: 'Private. Recordings stay on your phone.',
    info: 'Airese works out your night on your phone. Nothing leaves it unless you choose to share a report.',
    illustration: { source: require('../../assets/onboarding/2-private.jpg'), px: 1254, cx: 624, cy: 607, d: 1139 },
  },
  {
    title: 'Know when it’s worth getting checked.',
    info: 'One night is hard to read on its own. Airese only suggests talking to a doctor when the same thing shows up night after night.',
    illustration: { source: require('../../assets/onboarding/3-pattern.jpg'), px: 1254, cx: 633, cy: 592, d: 1100 },
    showContinue: true,
  },
];

// Layout is designed on the Figma frame "iPhone 16 & 17 Pro - 2/3/4" (402 × 874 pt) and scales
// with the viewport: the circle and spacing follow the screen's height, capped by its width.
// Text stays on the type scale (never shrinks below the 16 pt base); it follows the system text size.
const REF_W = 402;
const REF_H = 874;
const REF_CIRCLE = 556 * 0.88; // circle diameter on the reference frame (88% of the Figma 556 pt)
const REF_TOP = 12; // circle top
const REF_GAP = 50; // circle bottom to headline
const SHIFT_RATIO = 116 / 556; // how far the circle moves per page, relative to its size
const TEXT_MIN = 260; // room always kept below the circle for headline, Continue and the home indicator
const ACCOUNT_ROOM = 48 + space.lg; // plus the pinned "I already have an account" button and its gap
const DASH_H = 4;
const DASH_W = 28;
const TARGET = 44; // minimum touch target (WCAG 2.5.5 AAA): each dash sits in a 44 × 44 tap area
const PARALLAX = 40; // how far each illustration slides inside the circle between pages
const SIDE = space.gutter; // standard screen edge

const native = motion.useNativeDriver;

/**
 * Onboarding carousel: three pages, one big circle.
 * The pages scroll normally; the circle sits behind them and moves a shorter
 * distance (right, centre, left), so it drifts across as you swipe. Inside it,
 * the illustrations cross-fade and slide slightly against the circle's movement
 * (parallax), and the scene breathes slowly the whole time.
 */
export function OnboardingScreen({ onContinue, onLogIn }: { onContinue?: () => void; onLogIn?: () => void }) {
  // Sized from the screen's own layout (not the window), so it's right in split view and in the preview frame.
  const insets = useInsets();
  const [box, setBox] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => setBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
  return (
    <View style={styles.root} onLayout={onLayout}>
      <StatusBar style="light" />
      {box.width > 0 && <Carousel width={box.width} height={box.height - (onLogIn ? ACCOUNT_ROOM : 0)} onContinue={onContinue} />}
      {/* Returning people (a new phone): a full-size way in on every page, pinned to the bottom, as
          sure-footed as Get started. Outlined, so the page's own button stays the first choice. */}
      {onLogIn ? (
        <View style={[styles.account, { bottom: insets.bottom + space.lg }]}>
          <Pressable onPress={onLogIn} accessibilityRole="button" style={({ pressed }) => [styles.accountButton, pressed && { opacity: 0.8 }]}>
            <AppText variant="button" color="text">
              I already have an account
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function Carousel({ width, height, onContinue }: { width: number; height: number; onContinue?: () => void }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scroller = useRef<ScrollView>(null);
  const reduced = useReducedMotion(); // Reduce Motion: no drift, parallax or breathing; fades stay

  // Viewport scaling: v is this screen's height relative to the reference frame.
  const v = height / REF_H;
  const top = REF_TOP * v;
  const gap = Math.max(space.xl, REF_GAP * v);
  const size = Math.min(
    REF_CIRCLE * v, // follow the height
    (REF_CIRCLE / REF_W) * width, // but never wider than the design allows
    height - top - gap - TEXT_MIN, // and always leave room for the text
  );
  const textTop = top + size + gap;
  const shift = reduced ? 0 : size * SHIFT_RATIO;
  const parallax = reduced ? 0 : PARALLAX;
  const pages = SLIDES.map((_, i) => i * width);

  // Value per page → interpolated while swiping between pages.
  const byPage = (values: number[]) => scrollX.interpolate({ inputRange: pages, outputRange: values, extrapolate: 'clamp' });
  // 1 on page i, fading to 0 on its neighbours.
  const onPage = (i: number) =>
    scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [0, 1, 0], extrapolate: 'clamp' });

  // First appearance: the artwork fades in gently once the screen is up.
  const artIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(artIn, {
      toValue: 1,
      duration: motion.slow.duration,
      delay: motion.stagger,
      easing: motion.slow.easeOut,
      useNativeDriver: native,
    }).start();
  }, [artIn]);

  // Ambient motion: the scene breathes very slowly (slight scale and float). Off with Reduce Motion.
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      breath.setValue(0);
      return;
    }
    const half = { duration: motion.ambient.duration / 2, easing: motion.ambient.easing, useNativeDriver: native };
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, ...half }),
        Animated.timing(breath, { toValue: 0, ...half }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, reduced]);

  // Info sheet: which page's detail is open (null = closed).
  const [infoFor, setInfoFor] = useState<number | null>(null);
  const [lastInfo, setLastInfo] = useState(0); // keeps content visible while the sheet closes
  const openInfo = (i: number) => {
    setLastInfo(i);
    setInfoFor(i);
  };

  const goTo = (i: number) => scroller.current?.scrollTo({ x: i * width, animated: true });

  // Which page is current (for screen readers on the page dashes).
  const [page, setPage] = useState(0);
  const onScrollJS = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const nearest = Math.round(e.nativeEvent.contentOffset.x / width);
    setPage((prev) => (prev === nearest ? prev : nearest));
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* The circle: behind the pages, moves right → centre → left */}
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            top,
            left: (width - size) / 2,
            transform: [{ translateX: byPage(SLIDES.map((_, i) => shift * (1 - i))) }],
          },
        ]}
      >
        {/* Illustrations: fade in on arrival, cross-fade between pages, slide a little against the circle (parallax), and breathe */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: artIn,
              transform: [
                { scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) },
                { translateY: breath.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
              ],
            },
          ]}
        >
          {SLIDES.map(({ illustration: art }, i) => {
            const k = size / art.d; // source px → points, so the painted circle matches ours
            return (
              <Animated.Image
                key={i}
                source={art.source}
                accessible={false} // decorative: the text carries the meaning
                importantForAccessibility="no"
                resizeMode="cover"
                style={{
                  position: 'absolute',
                  width: art.px * k,
                  height: art.px * k,
                  left: size / 2 - art.cx * k,
                  top: size / 2 - art.cy * k,
                  opacity: onPage(i),
                  transform: [
                    {
                      translateX: scrollX.interpolate({
                        inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                        outputRange: [parallax, 0, -parallax],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                }}
              />
            );
          })}
        </Animated.View>
      </Animated.View>

      {/* The pages: text only, swiped horizontally */}
      <Animated.ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: native, listener: onScrollJS })}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={{ width }}>
            <Animated.View style={[styles.text, { marginTop: textTop, opacity: onPage(i) }]}>
              <View style={styles.titleRow}>
                <AppText variant="headline" accessibilityRole="header" style={styles.title}>
                  {slide.title}
                </AppText>
                <InfoButton onPress={() => openInfo(i)} label={`More about: ${slide.title}`} />
              </View>
              {/* Part of the page: there with the text, moves and fades with it (no animation of its own) */}
              <View style={{ alignSelf: 'flex-start', marginTop: space.xl }}>
                {slide.showContinue ? (
                  <Button label="Get started" onPress={onContinue} />
                ) : (
                  <IconButton icon="arrow_forward" label="Next" onPress={() => goTo(i + 1)} />
                )}
              </View>
            </Animated.View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Page indicator, just above the headline: one dash per page, the current one lit. Tap to jump. */}
      <View style={[styles.dashes, { top: textTop - space.xl - DASH_H - (TARGET - DASH_H) / 2 }]}>
        {SLIDES.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => goTo(i)}
            style={styles.dashTarget}
            accessibilityRole="button"
            accessibilityLabel={`Page ${i + 1} of ${SLIDES.length}`}
            accessibilityState={{ selected: page === i }}
          >
            {/* Inactive at 45% so it still reads at 3:1 against the background (WCAG 1.4.11) */}
            <Animated.View style={[styles.dash, { opacity: scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [0.45, 1, 0.45], extrapolate: 'clamp' }) }]} />
          </Pressable>
        ))}
      </View>

      {/* Detail for the page's (i) button. Placeholder content until the sheet design lands. */}
      <BottomSheet visible={infoFor !== null} onClose={() => setInfoFor(null)}>
        <AppText variant="heading">{SLIDES[lastInfo].title}</AppText>
        <AppText color="textMuted" style={{ marginTop: space.sm }}>
          {SLIDES[lastInfo].info}
        </AppText>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  circle: { position: 'absolute', overflow: 'hidden', pointerEvents: 'none' }, // no fill: artwork fades in straight from the background
  center: { alignItems: 'center', justifyContent: 'center' },
  text: { paddingHorizontal: SIDE },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { flex: 1 },
  dashes: { position: 'absolute', left: SIDE - (TARGET - DASH_W) / 2, flexDirection: 'row' },
  dashTarget: { width: TARGET, height: TARGET, alignItems: 'center', justifyContent: 'center' },
  dash: { width: DASH_W, height: DASH_H, borderRadius: DASH_H / 2, backgroundColor: colors.text },
  account: { position: 'absolute', left: SIDE, right: SIDE },
  // Moon label 15:1; Mist outline 3:1+ against Midnight (WCAG 1.4.11)
  accountButton: { minHeight: 48, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
});
