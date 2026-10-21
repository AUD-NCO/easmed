import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, space } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { IconStack } from './IconStack';

/**
 * A small bright banner that opens something (the Sleep Diary's check-ins): one row on Breath, the
 * whole of it a button. Text on the left (one line), then what's chosen as fading icons, and a chevron.
 * `label` is what screen readers hear (say what's chosen).
 */
export function CheckInBanner({ text, icons = [], label, onPress }: { text: string; icons?: IconName[]; label?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label ?? text} style={({ pressed }) => [styles.banner, pressed && { opacity: 0.8 }]}>
      <AppText color="onAccent" numberOfLines={1} style={styles.text}>
        {text}
      </AppText>
      {icons.length > 0 && <IconStack icons={icons} />}
      <Icon name="chevron_right" size={24} color="onAccent" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingLeft: space.lg, paddingRight: space.md, borderRadius: radius.lg, backgroundColor: colors.accent },
  text: { flex: 1, minWidth: 0 },
});
