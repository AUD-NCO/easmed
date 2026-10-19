import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { colors, motion, space, type } from '../theme';
import { AppText } from './AppText';

const medium = { fontFamily: type.button.fontFamily, fontWeight: type.button.fontWeight };

export type Segment = { key: string; label: string };

const HEIGHT = 44; // iOS uses 32; 44 keeps each segment a full touch target (WCAG 2.5.5)
const PAD = 2;

/**
 * Segmented control: native shape and behaviour (iOS UISegmentedControl), Airese colours.
 * Deep track; the selected segment is a Breath thumb with a Midnight label, like our buttons
 * (9.4:1). It slides between segments (fast ease-in-out). Others: Mist on Deep (7.6:1).
 * Reads as a radio group for screen readers.
 */
export function SegmentedControl({ segments, selected, onSelect, label }: { segments: Segment[]; selected: string; onSelect: (key: string) => void; label: string }) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, segments.findIndex((s) => s.key === selected));
  const segWidth = width > 0 ? (width - PAD * 2) / segments.length : 0;
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(x, { toValue: index * segWidth, duration: motion.fast.duration, easing: motion.fast.easeInOut, useNativeDriver: motion.useNativeDriver }).start();
  }, [index, segWidth, x]);

  return (
    <View style={styles.track} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {segWidth > 0 && <Animated.View style={[styles.thumb, { width: segWidth, transform: [{ translateX: x }] }]} />}
      {segments.map((s) => {
        const active = s.key === selected;
        return (
          <Pressable key={s.key} onPress={() => onSelect(s.key)} style={styles.segment} accessibilityRole="radio" accessibilityState={{ selected: active }} accessibilityLabel={s.label}>
            <AppText variant="small" color={active ? 'onAccent' : 'textMuted'} numberOfLines={1} style={active ? medium : undefined}>
              {s.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: HEIGHT,
    padding: PAD,
    flexDirection: 'row',
    borderRadius: 10,
    backgroundColor: colors.surface, // Deep
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: 8,
    backgroundColor: colors.accent, // Breath, like the primary button
    shadowColor: colors.night,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm },
});
