import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@ds/components/AppText';
import { alpha, colors, motion, radius, space, useReducedMotion } from '@ds/theme';

/**
 * A review comment pinned to the corner of whatever it wraps, as in Figma or Google Docs: a small
 * Lamp pin (round, one square corner), and on tap or hover a light comment card. For open questions
 * from review, not product UI: remove the wrapper once the question is settled.
 * Fades in (motion.fast); Reduce Motion: shown at once.
 */
export function ReviewNote({ label = 'To discuss', note, children }: { label?: string; note: string; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const open = pinned || hover;

  const [fade] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) return fade.setValue(open ? 1 : 0);
    Animated.timing(fade, {
      toValue: open ? 1 : 0,
      duration: motion.fast.duration,
      easing: open ? motion.fast.easeOut : motion.fast.easeIn,
      useNativeDriver: motion.useNativeDriver,
    }).start();
  }, [open, reduced, fade]);

  return (
    <View style={[styles.wrap, open && styles.raised]}>
      {children}
      <Pressable onHoverIn={() => setHover(true)} onHoverOut={() => setHover(false)} style={styles.anchor}>
        <Pressable
          onPress={() => setPinned((p) => !p)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Review comment: ${note}`}
          accessibilityState={{ expanded: open }}
          style={({ pressed }) => [styles.pin, pressed && { opacity: 0.8 }]}
        >
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.dot} />
          ))}
        </Pressable>
        {open && (
          <Animated.View style={[styles.card, { opacity: fade }]} accessibilityLiveRegion="polite">
            <AppText variant="caption" color="onAccent" style={styles.label}>
              {label}
            </AppText>
            <AppText variant="small" color="onAccent">
              {note}
            </AppText>
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

const PIN = 24;

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  raised: { zIndex: 10 },
  anchor: { position: 'absolute', top: -PIN / 3, right: -PIN / 3, alignItems: 'flex-end' },
  pin: {
    width: PIN,
    height: PIN,
    borderRadius: PIN / 2,
    borderBottomLeftRadius: 3,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.lamp,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.onAccent },
  card: {
    width: 220,
    marginTop: space.xs,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.text,
    shadowColor: colors.night,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: alpha(colors.night, 0.08),
  },
  label: { fontWeight: '600', marginBottom: 2 },
});
