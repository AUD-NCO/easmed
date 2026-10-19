import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, space, type } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

/** A soft tick each time the value changes under the finger (native only; the web has no haptics worth it). */
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

/** Web: CSS scroll snapping (react-native-web passes these through). Native uses snapToInterval. */
const webSnap = (axis: 'x' | 'y') => (Platform.OS === 'web' ? ({ scrollSnapType: `${axis} mandatory` } as object) : null);
const webSnapItem = Platform.OS === 'web' ? ({ scrollSnapAlign: 'center' } as object) : null;

// ---------- Wheel ----------

const ROW = 48;
const VISIBLE = 5; // rows on show; the middle one is the value

/**
 * A scroll wheel (the iOS date picker feel) for picking one number from a range, e.g. a year.
 * Scroll it, tap a row, or use VoiceOver's swipe up / down (adjustable). The middle band marks the value.
 */
export function WheelPicker({ min, max, value, onChange, label, format = String }: { min: number; max: number; value: number; onChange: (v: number) => void; label: string; format?: (v: number) => string }) {
  const ref = useRef<ScrollView>(null);
  const current = useRef(value);
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const scrollTo = (v: number, animated: boolean) => ref.current?.scrollTo({ y: (v - min) * ROW, animated });
  const set = (v: number) => {
    const next = Math.min(max, Math.max(min, v));
    if (next === current.current) return;
    current.current = next;
    tick();
    onChange(next);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => set(min + Math.round(e.nativeEvent.contentOffset.y / ROW));

  return (
    <View
      style={styles.wheel}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const v = value + (e.nativeEvent.actionName === 'increment' ? 1 : -1);
        set(v);
        scrollTo(v, true);
      }}
    >
      <View style={styles.band} pointerEvents="none" />
      <ScrollView
        ref={ref}
        onLayout={() => scrollTo(value, false)}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={ROW}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: ROW * Math.floor(VISIBLE / 2) }}
        style={webSnap('y')}
      >
        {items.map((v) => (
          <Pressable key={v} onPress={() => scrollTo(v, true)} style={[styles.wheelRow, webSnapItem]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <AppText variant={v === value ? 'heading' : 'body'} color={v === value ? 'text' : 'textMuted'}>
              {format(v)}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------- Ruler ----------

const GAP = 10; // pt between ticks, one tick per step

/**
 * A ruler you drag under a fixed needle, for height and weight. The big number above can also be
 * typed in (`editable`), and − / + step it, so it never depends on dragging (WCAG 2.5.7).
 * `display` formats the big number (e.g. 68 inches → 5′ 8″); `unit` sits beside it.
 */
export function RulerPicker({
  min,
  max,
  value,
  onChange,
  label,
  unit,
  display,
  editable = true,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  label: string;
  unit?: string;
  display?: (v: number) => string;
  editable?: boolean;
}) {
  const ref = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const current = useRef(value);
  const [typed, setTyped] = useState<string>();
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const scrollTo = (v: number, animated: boolean) => ref.current?.scrollTo({ x: (v - min) * GAP, animated });
  const set = (v: number, scroll: boolean) => {
    const next = Math.min(max, Math.max(min, Math.round(v)));
    if (scroll) scrollTo(next, true);
    if (next === current.current) return;
    current.current = next;
    tick();
    onChange(next);
  };

  // A new range (units switched): put the ruler back under the value.
  useEffect(() => {
    current.current = value;
    if (width) scrollTo(value, false);
  }, [min, max, width]); // eslint-disable-line react-hooks/exhaustive-deps

  const big = display ? display(value) : String(value);

  return (
    <View>
      <View style={styles.readout}>
        <StepButton icon="remove" label={`Less ${label.toLowerCase()}`} onPress={() => set(value - 1, true)} />
        <View style={styles.readoutValue}>
          {editable ? (
            <TextInput
              value={typed ?? big}
              onFocus={() => setTyped('')}
              onChangeText={(t) => setTyped(t.replace(/\D/g, '').slice(0, 3))}
              onBlur={() => {
                if (typed) set(Number(typed), true);
                setTyped(undefined);
              }}
              onSubmitEditing={() => {
                if (typed) set(Number(typed), true);
                setTyped(undefined);
              }}
              placeholder={big}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              returnKeyType="done"
              keyboardAppearance="dark"
              selectionColor={colors.accent}
              maxFontSizeMultiplier={2}
              accessibilityLabel={`${label}, ${big} ${unit ?? ''}. Type a number`}
              style={styles.bigInput}
            />
          ) : (
            <AppText variant="title" style={styles.bigText} accessibilityLabel={`${label}, ${big}`}>
              {big}
            </AppText>
          )}
          {unit ? (
            <AppText color="textMuted" style={{ marginLeft: space.xs }}>
              {unit}
            </AppText>
          ) : null}
        </View>
        <StepButton icon="add" label={`More ${label.toLowerCase()}`} onPress={() => set(value + 1, true)} />
      </View>

      <View style={styles.ruler} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {width > 0 && (
          <ScrollView
            ref={ref}
            horizontal
            onScroll={(e) => set(min + e.nativeEvent.contentOffset.x / GAP, false)}
            scrollEventThrottle={16}
            snapToInterval={GAP}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: width / 2 - GAP / 2,alignItems: 'flex-end' }}
            style={webSnap('x')}
          >
            {steps.map((v) => {
              const major = v % 10 === 0;
              return (
                <View key={v} style={[styles.tickSlot, webSnapItem]}>
                  <View style={[styles.tick, { height: major ? 28 : v % 5 === 0 ? 20 : 12, opacity: major ? 1 : 0.6 }]} />
                </View>
              );
            })}
          </ScrollView>
        )}
        <View style={[styles.needle, { left: width / 2 - 1.5 }]} pointerEvents="none" />
      </View>
    </View>
  );
}

function StepButton({ icon, label, onPress }: { icon: 'add' | 'remove'; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.step, pressed && { opacity: 0.8 }]}>
      <Icon name={icon} size={24} color="text" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wheel: { height: ROW * VISIBLE, overflow: 'hidden' },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ROW * Math.floor(VISIBLE / 2),
    height: ROW,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  wheelRow: { height: ROW, alignItems: 'center', justifyContent: 'center' },

  readout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readoutValue: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', flex: 1 },
  bigInput: { ...type.title, color: colors.text, textAlign: 'center', width: 80, padding: 0, outlineStyle: 'none' } as object,
  bigText: { textAlign: 'center' },
  step: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  ruler: { height: 64, marginTop: space.lg, justifyContent: 'flex-end' },
  tickSlot: { width: GAP, alignItems: 'center', justifyContent: 'flex-end', height: 40 },
  tick: { width: 2, borderRadius: 1, backgroundColor: colors.textMuted },
  needle: { position: 'absolute', bottom: 0, width: 3, height: 48, borderRadius: 2, backgroundColor: colors.accent },
});
