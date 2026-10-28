import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@ds/components/AppText';
import { Icon } from '@ds/components/Icon';
import { alpha, colors, radius, space } from '@ds/theme';

/**
 * The way from a score to the sound behind it: "Listen", at the foot of a score tile. It doesn't play
 * here: it takes you down to the recording (the moment card), with that moment picked and ready.
 * A Breath play disc, so it's the brightest thing on the tile; Moon label on a light Moon wash (9:1+).
 */
export function ListenButton({ onPress, accessibilityLabel }: { onPress: () => void; accessibilityLabel: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Goes to the recording"
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.disc}>
        <Icon name="play_fill" size={18} color="onAccent" />
      </View>
      <AppText variant="button" color="text">
        Listen
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // The disc sits at the pill's left edge, an even 6 pt in on every side, like a media control
  button: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44, padding: space.xs + 2, paddingRight: space.lg, borderRadius: radius.pill, backgroundColor: alpha(colors.moon, 0.1) },
  disc: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingLeft: 2, backgroundColor: colors.accent }, // a play triangle reads centred a touch right of centre
});
