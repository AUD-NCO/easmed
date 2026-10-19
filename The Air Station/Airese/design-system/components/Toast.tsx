import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { alpha, colors, motion, radius, space, useInsets } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

const SHOWN_MS = 2600;

/**
 * A short confirmation after an action ("All recordings deleted"): a pill near the bottom with a
 * check. Fades in (fast ease-out), stays a moment, fades out (fast ease-in). Screen readers hear it
 * once (polite live region). Doesn't take taps. Pass a new message each time (`key` changes it).
 */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  const insets = useInsets();
  const t = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(message);
  if (message && message !== shown) setShown(message);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!message) return;
    const run = Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: motion.useNativeDriver }),
      Animated.delay(SHOWN_MS),
      Animated.timing(t, { toValue: 0, duration: motion.fast.duration, easing: motion.fast.easeIn, useNativeDriver: motion.useNativeDriver }),
    ]);
    run.start(({ finished }) => finished && done.current());
    return () => run.stop();
  }, [message, t]);

  if (!message) return null;
  return (
    <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.toast, { bottom: insets.bottom + space.xl, opacity: t }]}>
      <Icon name="check" size={20} color="dataSleep" />
      <AppText color="text">{shown}</AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 48,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(colors.moon, 0.24),
    zIndex: 70,
  },
});
