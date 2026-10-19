import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { alpha, colors, motion, radius, space, useInsets, useReducedMotion } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

const native = motion.useNativeDriver;
const DISMISS_DISTANCE = 140;
const DISMISS_VELOCITY = 0.8;
const HEADER = 76; // draggable top strip: grabber and title row

/**
 * Near full-height sheet, like the iOS large sheet: it rises over the dimmed page, leaving the
 * status bar and a sliver of the page above it. For "more" on a card: room for a full chart,
 * a plain explanation and any action, without leaving the page.
 *
 * Close: the × button, a tap on the dimmed sliver, a drag down on the top strip, or Android back.
 * Opens and closes with the fast preset; Reduce Motion fades instead.
 * Native: a Modal. Web: a portal at the app root, so it stays inside the preview's phone frame.
 */
export function LargeSheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const { height } = useWindowDimensions();
  const insets = useInsets();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const [shownTitle, setShownTitle] = useState(title);
  if (visible && title !== shownTitle) setShownTitle(title);
  const progress = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start();
    } else if (mounted) {
      Animated.timing(progress, { toValue: 0, duration: motion.fast.duration, easing: motion.fast.easeIn, useNativeDriver: native }).start(({ finished }) => finished && setMounted(false));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeRef.current();
      return true;
    });
    return () => sub.remove();
  }, [visible]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) closeRef.current();
        else Animated.timing(drag, { toValue: 0, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start();
      },
    }),
  ).current;

  if (!mounted) return null;
  const top = insets.top + space.md;

  const content = (
    <View style={[StyleSheet.absoluteFill, { zIndex: 60 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            top,
            opacity: reduced ? progress : 1,
            transform: [{ translateY: reduced ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }, { translateY: drag }],
          },
        ]}
        accessibilityViewIsModal
      >
        <View {...pan.panHandlers} style={styles.header}>
          <View style={styles.grabber} />
          <View style={styles.titleRow}>
            <AppText variant="heading" color="text" accessibilityRole="header" style={{ flex: 1 }} numberOfLines={1}>
              {shownTitle}
            </AppText>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.close, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel="Close">
              <Icon name="close" size={20} color="text" />
            </Pressable>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: insets.bottom + space.xxl }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
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
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(colors.moon, 0.12),
    overflow: 'hidden',
  },
  header: { minHeight: HEADER, paddingTop: space.sm, paddingHorizontal: space.gutter },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: colors.textMuted, marginBottom: space.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingBottom: space.md },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.moon, 0.1) },
});
