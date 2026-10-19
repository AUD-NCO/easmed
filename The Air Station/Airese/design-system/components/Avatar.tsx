import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { alpha, colors } from '../theme';

/** Round avatar: the user's initials, or a person icon when no name was given. 44 pt (touch target size). */
export function Avatar({ initials, onPress }: { initials?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.avatar} accessibilityRole={onPress ? 'button' : 'image'} accessibilityLabel="Your profile">
      {initials ? (
        <AppText variant="button" color="text">
          {initials}
        </AppText>
      ) : (
        <Icon name="person" size={24} color="text" />
      )}
    </Pressable>
  );
}

/** The round glassy look of a tab's title-row control (the avatar on Home, the calendar on Reports). */
export const titleControl = {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: alpha(colors.moon, 0.14), // Moon at 14%: glassy over the hero
  borderWidth: 1,
  borderColor: alpha(colors.moon, 0.24),
} as const;

const styles = StyleSheet.create({
  avatar: titleControl,
});
