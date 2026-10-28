import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppText } from '@ds/components/AppText';
import { motion, space, useReducedMotion } from '@ds/theme';

const RISE = space.xs + 2; // how far a line drifts as it leaves and arrives: barely

/**
 * One muted line that takes turns between a few (Reports: "8 hr of recording", then "11:05 pm to 7:05 am").
 * Each line rests a good while, then drifts up and fades as the next rises in (fast preset). Always one line:
 * the slot is as wide as the longest, so whatever sits after it (the "Last night" tag) never moves.
 * Screen readers hear every line at once; nothing is announced as they change. Reduce Motion: a plain fade.
 */
export function FlipLine({ lines }: { lines: string[] }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const t = useRef(new Animated.Value(1)).current; // 0 waiting below, 1 in place, 2 gone above

  useEffect(() => {
    if (lines.length < 2) return;
    const m = motion.fast;
    const id = setInterval(() => {
      Animated.timing(t, { toValue: 2, duration: m.duration, easing: m.easeIn, useNativeDriver: motion.useNativeDriver }).start(() => {
        setI((n) => (n + 1) % lines.length);
        t.setValue(0);
        Animated.timing(t, { toValue: 1, duration: m.duration, easing: m.easeOut, useNativeDriver: motion.useNativeDriver }).start();
      });
    }, motion.hold * 2);
    return () => clearInterval(id);
  }, [lines.length, t]);

  const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), '');
  const opacity = t.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 1, 0] });
  const shift = t.interpolate({ inputRange: [0, 1, 2], outputRange: [RISE, 0, -RISE] });
  return (
    <View accessible accessibilityLabel={lines.join(', ')}>
      {/* Sizer: holds the widest line's room */}
      <AppText color="textMuted" numberOfLines={1} style={styles.sizer} importantForAccessibility="no" accessibilityElementsHidden>
        {longest}
      </AppText>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity, transform: reduced ? [] : [{ translateY: shift }] }]}>
        <AppText color="textMuted" numberOfLines={1}>
          {lines[i]}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sizer: { opacity: 0 },
});
