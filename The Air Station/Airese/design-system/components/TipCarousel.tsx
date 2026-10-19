import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { alpha, colors, radius, space } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

/** One tip: a short line (aim for under 40 characters), an icon, and an optional text action. */
export type CarouselTip = { id: string; icon: IconName; text: string; action?: { label: string; onPress: () => void } };

const DASH_W = 16;
const DASH_H = 4;

/**
 * A few short tips, one at a time, in a very light frosted box with a soft shadow: icon, one line,
 * optional text action on the right; small dashes underneath. Swipe between tips (follows the
 * finger, pages snap) or tap a dash: every swipe has a tap alternative (WCAG 2.5.7).
 * Used on the Recording screen.
 */
export function TipCarousel({ tips }: { tips: CarouselTip[] }) {
  const scroller = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const nearest = Math.round(e.nativeEvent.contentOffset.x / width);
    setPage((p) => (p === nearest ? p : nearest));
  };
  const goTo = (i: number) => scroller.current?.scrollTo({ x: i * width, animated: true });

  return (
    <View style={styles.box}>
      <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <ScrollView ref={scroller} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
            {tips.map((tip, i) => {
              const hidden = i !== page;
              return (
                <View key={tip.id} style={[styles.slide, { width }]} accessibilityElementsHidden={hidden} importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}>
                  <Icon name={tip.icon} size={22} color="accent" />
                  <AppText color="text" style={styles.text}>
                    {tip.text}
                  </AppText>
                  {tip.action ? (
                    <Pressable onPress={tip.action.onPress} hitSlop={10} accessibilityRole="button" style={styles.action}>
                      <AppText color="accent">
                        {tip.action.label}
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.dashes}>
        {tips.map((tip, i) => (
          <Pressable
            key={tip.id}
            onPress={() => goTo(i)}
            hitSlop={{ top: 10, bottom: 10 }} // 24 + 20 = a 44 pt target
            style={styles.dashTarget}
            accessibilityRole="button"
            accessibilityLabel={`Tip ${i + 1} of ${tips.length}`}
            accessibilityState={{ selected: i === page }}
          >
            <View style={[styles.dash, i === page && styles.dashOn]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Moon at 7% over the night gradient, a hairline edge and a soft Night shadow: there, but barely
  box: {
    borderRadius: radius.xl,
    paddingHorizontal: space.md,
    paddingTop: space.md,
    backgroundColor: alpha(colors.moon, 0.07),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(colors.moon, 0.16),
    shadowColor: colors.night,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  slide: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 },
  text: { flex: 1, minWidth: 0 },
  action: { minHeight: 44, justifyContent: 'center' },
  dashes: { flexDirection: 'row', justifyContent: 'center', gap: space.xs, paddingBottom: space.xs },
  dashTarget: { width: 28, height: 24, alignItems: 'center', justifyContent: 'center' },
  dash: { width: DASH_W, height: DASH_H, borderRadius: radius.pill, backgroundColor: alpha(colors.moon, 0.45) }, // Moon at 45%: 4.1:1 (BRAND §4)
  dashOn: { backgroundColor: colors.accent },
});
