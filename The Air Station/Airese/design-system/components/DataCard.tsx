import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { alpha, colors, radius, space, type ColorName } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type DataTone = 'snoring' | 'breathing' | 'sleep' | 'neutral';
const INK: Record<DataTone, ColorName> = { snoring: 'dataSnoring', breathing: 'dataBreathing', sleep: 'dataSleep', neutral: 'textMuted' };
const TINT: Record<DataTone, string> = { snoring: colors.tintSnoring, breathing: colors.tintBreathing, sleep: colors.tintSleep, neutral: alpha(colors.mist, 0.12) };

/**
 * The Recording Details card. Two shapes, one anatomy:
 *   label (with the data's icon) · the visual or big number · one line of insight · "›" for more.
 *
 *   wide    full width, shorter: things that read across (timeline, audio, recent nights)
 *   square  half width, two side by side: one number and a small visual
 *
 * The whole card is one button; it opens the detail in a large sheet. Type: one title size,
 * one big-number size, body and small, in regular and semibold only.
 */
export function DataCard({
  shape = 'wide',
  icon,
  tone = 'neutral',
  label,
  title,
  insight,
  onPress,
  accessibilityLabel,
  style,
  children,
}: {
  shape?: 'wide' | 'square';
  icon?: IconName;
  tone?: DataTone;
  /** Small label above the content (square cards, and wide cards that lead with a visual). */
  label?: string;
  /** Section title (wide cards). */
  title?: string;
  insight?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.card, shape === 'square' && styles.square, pressed && styles.pressed, style]}
    >
      <View style={styles.head}>
        {icon ? (
          <View style={[styles.badge, { backgroundColor: TINT[tone] }]}>
            <Icon name={icon} size={18} color={INK[tone]} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          {title ? (
            <AppText variant="heading" color="text" accessibilityRole="header">
              {title}
            </AppText>
          ) : label ? (
            <AppText variant="small" color="textMuted">
              {label}
            </AppText>
          ) : null}
        </View>
        {onPress ? <Icon name="chevron_right" size={20} color="textMuted" /> : null}
      </View>

      {children ? <View style={styles.body}>{children}</View> : null}

      {insight ? (
        <AppText variant="small" color="text" style={styles.insight}>
          {insight}
        </AppText>
      ) : null}
    </Pressable>
  );
}

/** The big number in a card: one size, one weight (no small units). Durations use the compact "7h 36m". */
export function BigNumber({ value }: { value: string }) {
  return (
    <AppText variant="title" color="text" numberOfLines={1}>
      {value}
    </AppText>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.gutter },
  square: { flex: 1, minHeight: 176 },
  pressed: { opacity: 0.85 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 28 },
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  body: { marginTop: space.lg },
  insight: { marginTop: space.lg },
});
