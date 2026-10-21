import React from 'react';
import { StyleSheet, View } from 'react-native';
import { alpha, colors, space } from '../theme';
import { Icon, type IconName } from './Icon';

/** How strongly each icon shows, fading out towards the end. More than this many: the rest are left out. */
const FADE = [1, 1, 0.75, 0.5, 0.25];
const DISC = 32;

/**
 * A short row of overlapping round icons that fades out towards the end: what's been chosen, at a
 * glance, without a list of words (Sleep Diary banners, on Breath). Decorative: say what's in it in
 * the parent's accessibility label.
 */
export function IconStack({ icons }: { icons: IconName[] }) {
  return (
    <View style={styles.row} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {icons.slice(0, FADE.length).map((icon, i) => (
        <View key={`${icon}${i}`} style={[styles.disc, i > 0 && { marginLeft: -space.sm }]}>
          <View style={{ opacity: FADE[i] }}>
            <Icon name={icon} size={18} color="onAccent" />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  disc: { width: DISC, height: DISC, borderRadius: DISC / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderWidth: 1.5, borderColor: alpha(colors.midnight, 0.25) },
});
