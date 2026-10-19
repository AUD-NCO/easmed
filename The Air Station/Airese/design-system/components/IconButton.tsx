import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { colors } from '../theme';
import { Icon, type IconName } from './Icon';

/**
 * Round icon-only button: accent (Breath) circle with a Midnight Material Symbol.
 * 56 pt, above the 44 pt minimum target. Always give it an accessibility label.
 */
export function IconButton({ icon, label, onPress, style }: { icon: IconName; label: string; onPress?: () => void; style?: ViewStyle }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <Icon name={icon} size={28} color="onAccent" />
    </Pressable>
  );
}
