import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { alpha, colors, radius, space } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

/**
 * A pill that can be switched on and off (multi-select), e.g. Night Notes choices.
 * Off: a faint outline. On: a Deep fill, a Breath outline and a check: clear, but quiet.
 * 44 pt tall (touch target). Reads as a checkbox to screen readers.
 */
export function ToggleChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && { opacity: 0.8 }]}
    >
      {selected && (
        <View style={{ marginLeft: -space.xs }}>
          <Icon name="check" size={18} color="accent" />
        </View>
      )}
      <AppText variant="small" color={selected ? 'text' : 'textMuted'}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Chips flowing across lines. */
export function ChipGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: alpha(colors.mist, 0.28), // Mist, faint
  },
  selected: {
    backgroundColor: colors.surface, // Deep
    borderColor: colors.accent, // Breath (9:1 on Midnight)
  },
});
