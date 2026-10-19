import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { colors, radius, space, type ColorName } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Props = {
  label: string;
  onPress?: () => void;
  /**
   * primary: the one next step on a screen. quiet: text-only alternative.
   * mini: a small Midnight pill that hugs its label, for an action inside a banner or card
   * (36 pt tall plus 4 pt hit slop each side = a 44 pt target). Moon label on Midnight, 15:1.
   */
  variant?: 'primary' | 'quiet' | 'mini';
  /** Primary only: the fill, for the night's next step by mood (`VERDICT_ACTION`). Midnight label on each. */
  color?: Extract<ColorName, 'accent' | 'lamp' | 'urgentAction'>;
  /** Primary only: an icon before the label. */
  icon?: IconName;
  /** Layout only (e.g. alignSelf to hug the label). Stretches to its container by default. */
  style?: ViewStyle;
  accessibilityLabel?: string;
  /**
   * Can't be used yet. Primary turns Deep with a Mist label (still 7:1, so it reads) and is announced
   * as dimmed, but a tap still calls onPress, so the screen can say why (e.g. show "Verify your email
   * to continue." as an error). A button that silently does nothing leaves people stuck.
   */
  disabled?: boolean;
};

/** Pill button, 48 pt tall. Primary is filled with the accent (Breath) by default and has a Midnight label. */
export function Button({ label, onPress, variant = 'primary', color = 'accent', icon, style, accessibilityLabel, disabled = false }: Props) {
  const primary = variant === 'primary';
  const fill = disabled ? colors.surface : colors[color];
  const mini = variant === 'mini';
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ disabled }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={mini ? 4 : undefined}
      style={({ pressed }) => [
        {
          minHeight: mini ? 36 : 48, // grows with large text
          paddingVertical: mini ? space.sm : undefined,
          borderRadius: radius.pill,
          paddingHorizontal: mini ? space.lg : space.xl,
          flexDirection: 'row',
          gap: space.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: primary ? fill : mini ? colors.background : 'transparent',
          alignSelf: mini ? 'flex-start' : undefined,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {primary && icon ? <Icon name={icon} size={20} color={disabled ? 'textMuted' : 'onAccent'} /> : null}
      <AppText variant={mini ? 'buttonSmall' : 'button'} color={disabled ? 'textMuted' : primary ? 'onAccent' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}
