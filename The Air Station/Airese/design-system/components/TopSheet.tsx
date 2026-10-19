import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Modal, PanResponder, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors, motion, radius, space, useInsets, useReducedMotion } from '../theme';

const native = motion.useNativeDriver;
/** Drag further than this, or flick up faster than this, to dismiss. */
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 0.8;

/**
 * The bottom sheet's twin, dropping down from the top (e.g. the Reports calendar, opened from a
 * control in the top bar, so it arrives where the finger already is). Full width, bottom corners
 * rounded, a handle at the bottom edge. Over a dimmed screen.
 * Opens: backdrop fades in while the sheet glides down (fast ease-out).
 * Closes: tap the backdrop, or drag the sheet up; it drifts away (fast ease-in).
 * Opens above everything: a native Modal on iOS / Android; on web a portal at the app root (#root),
 * which keeps it inside the browser preview's phone frame. Reduce Motion: it fades instead of sliding.
 */
export function TopSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const { height } = useWindowDimensions();
  const insets = useInsets();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current; // 0 hidden, 1 open
  const drag = useRef(new Animated.Value(0)).current; // finger offset while dragging up (negative)

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start();
    } else if (mounted) {
      Animated.timing(progress, { toValue: 0, duration: motion.fast.duration, easing: motion.fast.easeIn, useNativeDriver: native }).start(({ finished }) => finished && setMounted(false));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Android back button closes the sheet.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.setValue(Math.min(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (-g.dy > DISMISS_DISTANCE || -g.vy > DISMISS_VELOCITY) onClose();
        else Animated.timing(drag, { toValue: 0, duration: motion.fast.duration, easing: motion.fast.easeInOut, useNativeDriver: native }).start();
      },
    }),
  ).current;

  if (!mounted) return null;

  const content = (
    <View style={[StyleSheet.absoluteFill, styles.layer]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>

      <Animated.View
        {...pan.panHandlers}
        accessibilityViewIsModal
        style={[
          styles.sheet,
          {
            paddingTop: insets.top + space.sm,
            opacity: reduced ? progress : 1,
            transform: [{ translateY: reduced ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [-height, 0] }) }, { translateY: drag }],
          },
        ]}
      >
        {children}
        <View style={styles.handle} />
      </Animated.View>
    </View>
  );

  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createPortal } = require('react-dom') as { createPortal: (node: React.ReactNode, el: Element) => React.ReactPortal };
    return createPortal(content, document.getElementById('root') ?? document.body);
  }
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  layer: { zIndex: 50 },
  backdrop: { backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.sheet,
    borderBottomRightRadius: radius.sheet,
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
  },
  handle: {
    alignSelf: 'center',
    width: 30,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.textMuted, // full strength: 3:1+ against the sheet (WCAG 1.4.11)
    marginTop: space.lg,
  },
});
