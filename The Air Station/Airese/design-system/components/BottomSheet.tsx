import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Keyboard, Modal, PanResponder, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors, motion, radius, space, useInsets, useReducedMotion } from '../theme';

const native = motion.useNativeDriver;
/** Drag further than this, or flick down faster than this, to dismiss. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.8;
/** Height of the draggable top strip when dragFrom="top". */
const TOP_STRIP = 88;

/**
 * Floating bottom sheet over a dimmed screen: inset from the edges, all corners
 * rounded, sitting just above the home indicator.
 * Opens above everything, including the tab bar: in a native Modal on iOS / Android, and on web
 * in a portal at the app root (#root), which keeps it inside the browser preview's phone frame.
 * Opens: backdrop fades in while the sheet glides up (fast ease-out).
 * Closes: tap the backdrop, or drag the sheet down; it drifts away (fast ease-in).
 * `dragFrom="top"`: only the top strip (handle and title) drags, for sheets whose content
 * scrolls or swipes itself (e.g. the remedies list in Night Notes).
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  dragFrom = 'sheet',
  fit = false,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dragFrom?: 'sheet' | 'top';
  /** Size to the content instead of the standard minimum height (short explanations). */
  fit?: boolean;
}) {
  const { height } = useWindowDimensions();
  const insets = useInsets();
  const reduced = useReducedMotion(); // Reduce Motion: sheet fades instead of sliding
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current; // 0 hidden, 1 open
  const drag = useRef(new Animated.Value(0)).current; // finger offset while dragging down
  const sheetTop = useRef(0); // sheet's top edge on screen
  const topOnly = useRef(dragFrom === 'top');
  topOnly.current = dragFrom === 'top';

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start();
    } else if (mounted) {
      Animated.timing(progress, { toValue: 0, duration: motion.fast.duration, easing: motion.fast.easeIn, useNativeDriver: native }).start(
        ({ finished }) => finished && setMounted(false),
      );
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sheets with a text field: sit above the keyboard while it's up.
  const [keyboard, setKeyboard] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKeyboard(e.endCoordinates.height));
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
      setKeyboard(0);
    };
  }, [visible]);

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
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx) && (!topOnly.current || g.y0 < sheetTop.current + TOP_STRIP),
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) onClose();
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
        onLayout={(e) => (sheetTop.current = e.nativeEvent.layout.y)}
        style={[
          styles.sheet,
          fit && { minHeight: 0 },
          {
            bottom: keyboard ? keyboard + space.sm : Math.max(space.xl, insets.bottom - space.sm),
            opacity: reduced ? progress : 1,
            transform: [
              { translateY: reduced ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) },
              { translateY: drag },
            ],
          },
        ]}
      >
        <View style={styles.handle} />
        {children}
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
    left: space.lg,
    right: space.lg,
    minHeight: 366, // Figma sheet height; content will set it once the sheet design lands
    backgroundColor: colors.surface,
    borderRadius: radius.sheet,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 30,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.textMuted, // full strength: 3:1+ against the sheet (WCAG 1.4.11)
    marginBottom: space.xl,
  },
});
