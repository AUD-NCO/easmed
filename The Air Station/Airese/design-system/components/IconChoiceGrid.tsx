import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { alpha, colors, space } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

const DISC = 64;
const MARK = 24;

/**
 * Multi-select as a grid of icons, four to a row: a round icon with its label under it.
 * Chosen: Breath wash and ring, the icon in Breath, and a check on the ring's lower right.
 * Each item reads as a checkbox to screen readers. Night Notes' Before sleeping and remedies pages.
 */
export function IconChoiceGrid({ options, selected, onToggle }: { options: { id: string; label: string; icon: IconName }[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <View style={styles.grid}>
      {options.map((x) => {
        const on = selected.includes(x.id);
        return (
          <Pressable
            key={x.id}
            onPress={() => onToggle(x.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={x.label}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.disc, on && styles.discOn]}>
              <Icon name={x.icon} size={30} color={on ? 'accent' : 'text'} />
              {on && (
                <View style={styles.mark}>
                  <Icon name="check" size={16} color="onAccent" />
                </View>
              )}
            </View>
            <AppText variant="small" color={on ? 'text' : 'textMuted'} numberOfLines={2} style={styles.label}>
              {x.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space.xs },
  item: { width: '25%', alignItems: 'center', paddingHorizontal: space.xs, paddingVertical: space.md },
  disc: { width: DISC, height: DISC, borderRadius: DISC / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.surface },
  discOn: { borderColor: colors.accent, backgroundColor: alpha(colors.breath, 0.16) },
  mark: { position: 'absolute', right: -4, bottom: -4, width: MARK, height: MARK, borderRadius: MARK / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.background },
  label: { marginTop: space.sm, textAlign: 'center' },
});
