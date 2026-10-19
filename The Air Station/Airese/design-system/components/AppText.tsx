import React from 'react';
import { Text, type TextProps } from 'react-native';
import { colors, type, type ColorName, type TypeVariant } from '../theme';

type Props = TextProps & { variant?: TypeVariant; color?: ColorName };

/** The only text component screens use. Scales with the system text size up to 200% (WCAG 1.4.4). */
export function AppText({ variant = 'body', color = 'text', style, ...rest }: Props) {
  return <Text {...rest} maxFontSizeMultiplier={2} style={[type[variant], { color: colors[color] }, style]} />;
}
