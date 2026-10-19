import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { alpha, colors, motion, radius, space, useInsets, useReducedMotion } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PAGE_SIDE, PAGE_TITLE_TOP, PageTitle } from './PageTitle';

const native = motion.useNativeDriver;
const BAR = 44; // sticky top bar, below the status bar
const FADE = 24; // soft fade above a sticky footer

/**
 * Template for a page opened from a list or row (Night Notes, Profile pages): plain Midnight,
 * "‹ Back" top left, large title and subtitle, then the content. Also a tab's own page (Reports):
 * no back, an optional `trailing` control top right, and `bottomInset` to clear the tab bar.
 *
 * Sticky header, as on iOS: the back button stays put; once the large title has scrolled under
 * the bar, a compact frosted title fades in behind it.
 * Optional `footer` sticks to the bottom (e.g. Done), over the content. With `footerAfter` (a distance
 * into the content, below the title) it stays hidden until the page scrolls past that point, then rises
 * in (fast preset), e.g. once the same action at the top has scrolled away. Back above it: it goes again.
 *
 * Moving in and out: on iOS / Android the system push (slide from the right, swipe back), set in
 * the route. The browser has no native push, so with `slideIn` the page slides itself in and out
 * (fast preset) over a dimming screen. Reduce Motion: it fades instead.
 * `onBack` runs once the page is out; `leave(fn)` (from children via render prop) does the same for other exits.
 */
export function DetailPage({
  backLabel,
  title,
  subtitle,
  subtitleTag,
  onBack,
  slideIn = Platform.OS === 'web',
  footer,
  footerAfter,
  children,
  trailing,
  bottomInset = 0,
}: {
  /** Back button text. Leave out (with onBack) for a tab's own page, which has no back. */
  backLabel?: string;
  title: string;
  /** Muted text under the title (a "\n" makes a second line). */
  subtitle?: string;
  /** A small Breath pill at the end of the subtitle's first line (e.g. "Last night"). */
  subtitleTag?: string;
  onBack?: () => void;
  slideIn?: boolean;
  /**
   * A control at the top right (e.g. the Reports calendar). As a function it gets `inBar`: true when it
   * sits in the compact bar, where it should be a plain glyph (as iOS bar buttons are), false in the title row.
   */
  trailing?: React.ReactNode | ((inBar: boolean) => React.ReactNode);
  /** Extra room at the bottom, e.g. TAB_BAR_CLEARANCE on a tab's page so the footer sits above the tab bar. */
  bottomInset?: number;
  footer?: (leave: (then: () => void) => void) => React.ReactNode;
  footerAfter?: number;
  children: React.ReactNode | ((leave: (then: () => void) => void) => React.ReactNode);
}) {
  const insets = useInsets();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const t = useRef(new Animated.Value(slideIn ? 0 : 1)).current; // 0 off to the right, 1 in place
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerShown, setFooterShown] = useState(footerAfter == null);
  const lastY = useRef(0); // latest scroll position, to re-check when the reveal point moves
  const tab = !onBack; // a tab's own page: Home's title row, no back
  const [scrolled, setScrolled] = useState(false); // tab page: the trailing control moves up into the bar
  const pastPoint = (y: number) => footerAfter == null || y > headerHeight + footerAfter;
  // The reveal point arrives or moves (e.g. once the content above it has been measured): re-check.
  useEffect(() => {
    setFooterShown(footerAfter == null || lastY.current > headerHeight + footerAfter);
  }, [footerAfter, headerHeight]);
  const reveal = useRef(new Animated.Value(footerAfter == null ? 1 : 0)).current;

  useEffect(() => {
    if (footerAfter == null) return;
    const m = motion.fast;
    Animated.timing(reveal, { toValue: footerShown ? 1 : 0, duration: m.duration, easing: footerShown ? m.easeOut : m.easeIn, useNativeDriver: native }).start();
  }, [footerShown, footerAfter, reveal]);

  useEffect(() => {
    if (!slideIn || width === 0) return;
    Animated.timing(t, { toValue: 1, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start();
  }, [slideIn, width, t]);

  const leave = (then: () => void = () => {}) => {
    if (!slideIn) return then();
    Animated.timing(t, { toValue: 0, duration: motion.fast.duration, easing: motion.fast.easeIn, useNativeDriver: native }).start(() => then());
  };

  const page = slideIn
    ? reduced
      ? { opacity: t }
      : { transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [width, 0] }) }] }
    : null;

  // Compact title: in as the large title (which starts just under the bar) slides beneath it.
  const compact = scrollY.interpolate({ inputRange: [space.lg, space.lg + BAR / 2], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <StatusBar style="light" />
      {slideIn && <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: t }]} pointerEvents="none" />}

      <Animated.View style={[styles.page, page]}>
        <Animated.ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + (tab ? PAGE_TITLE_TOP : BAR), paddingBottom: (footer ? footerHeight : insets.bottom) + bottomInset + space.xl }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: native,
            listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => {
              lastY.current = e.nativeEvent.contentOffset.y;
              setFooterShown(pastPoint(lastY.current));
              if (tab) setScrolled(lastY.current > space.lg + BAR / 2);
            },
          })}
        >
          <View style={tab ? undefined : styles.header} onLayout={(e: LayoutChangeEvent) => setHeaderHeight(e.nativeEvent.layout.height)}>
            {tab ? (
              // Same title row as every tab (PageTitle): title and trailing control on one line
              <PageTitle title={title} trailing={scrolled ? <View style={{ width: 44 }} /> : typeof trailing === 'function' ? trailing(false) : trailing} />
            ) : (
              <AppText variant="title" color="text" accessibilityRole="header">
                {title}
              </AppText>
            )}
            {subtitle ? (
              <Subtitle text={subtitle} tag={subtitleTag} style={[{ marginTop: space.xs }, tab && { paddingHorizontal: PAGE_SIDE }]} />
            ) : null}
          </View>
          {typeof children === 'function' ? children(leave) : children}
        </Animated.ScrollView>

        {/* Sticky top bar: frosted background and compact title fade in; back always here */}
        <Animated.View pointerEvents="none" style={[styles.barBg, { height: insets.top + BAR, opacity: compact }]} />
        <View style={[styles.bar, { top: insets.top }]} pointerEvents="box-none">
          {onBack && backLabel ? (
            <Pressable onPress={() => leave(onBack)} hitSlop={8} style={styles.back} accessibilityRole="button" accessibilityLabel={`Back to ${backLabel}`}>
              <Icon name="chevron_left" size={28} color="accent" />
              <AppText color="accent">{backLabel}</AppText>
            </Pressable>
          ) : null}
          <Animated.View pointerEvents="none" style={[styles.compactTitle, { opacity: compact }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <AppText variant="button" color="text" numberOfLines={1}>
              {title}
            </AppText>
          </Animated.View>
          {/* Bar control: always on a pushed page; on a tab page only once the title row has scrolled away */}
          {trailing && (!tab || scrolled) ? <View style={styles.trailing}>{typeof trailing === 'function' ? trailing(true) : trailing}</View> : null}
        </View>

        {footer && (
          <Animated.View
            pointerEvents={footerShown ? 'auto' : 'none'}
            importantForAccessibility={footerShown ? 'auto' : 'no-hide-descendants'}
            accessibilityElementsHidden={!footerShown}
            style={[
              styles.footer,
              { paddingBottom: bottomInset ? bottomInset + space.xl : Math.max(insets.bottom, space.lg) + space.sm, opacity: reveal, // on a tab page: room above the tab bar
                 transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : space.xl, 0] }) }] },
            ]}
            onLayout={(e: LayoutChangeEvent) => setFooterHeight(e.nativeEvent.layout.height)}
          >
            <Svg style={styles.fade} width="100%" height={FADE} pointerEvents="none">
              <Defs>
                <LinearGradient id="footerFade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.background} stopOpacity={0} />
                  <Stop offset="1" stopColor={colors.background} stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height={FADE} fill="url(#footerFade)" />
            </Svg>
            {footer(leave)}
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

/** The muted line(s) under the title; an optional tag pill sits at the end of the first line. */
function Subtitle({ text, tag, style }: { text: string; tag?: string; style: StyleProp<ViewStyle> }) {
  const [first, ...rest] = text.split('\n');
  return (
    <View style={style}>
      <View style={styles.subtitleRow}>
        <AppText color="textMuted">{first}</AppText>
        {tag ? (
          <View style={styles.tag}>
            <AppText variant="small" color="accent">
              {tag}
            </AppText>
          </View>
        ) : null}
      </View>
      {rest.length ? <AppText color="textMuted">{rest.join('\n')}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  subtitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm },
  // Breath on a Breath wash: 8:1 on Midnight
  tag: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.tintAccent },
  page: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: PAGE_SIDE, marginTop: space.sm },
  barBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: alpha(colors.midnight, 0.88), // Midnight, frosted
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: alpha(colors.mist, 0.1),
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)' } as object) : null),
  },
  bar: { position: 'absolute', left: 0, right: 0, height: BAR, justifyContent: 'center', paddingHorizontal: space.sm },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, paddingRight: space.sm, zIndex: 1 },
  trailing: { position: 'absolute', right: space.sm, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
  compactTitle: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  fade: { position: 'absolute', top: -FADE, left: 0, right: 0 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: PAGE_SIDE, paddingTop: space.md, backgroundColor: colors.background },
});
