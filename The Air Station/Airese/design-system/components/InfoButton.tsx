import React from 'react';
import { Pressable } from 'react-native';
import type { ColorName } from '../theme';
import { Icon } from './Icon';

/** Material Symbols "info". Opens more detail about what's next to it. */
export function InfoButton({ onPress, label = 'More about this', size = 28, color = 'textMuted' }: { onPress?: () => void; label?: string; size?: number; color?: ColorName }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={(44 - size) / 2} // 44 pt touch target
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Icon name="info" size={size} color={color} />
    </Pressable>
  );
}
