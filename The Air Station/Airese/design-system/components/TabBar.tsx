import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { alpha, colors, radius, space, useInsets } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type TabItem = { key: string; label: string; icon: IconName; iconSelected?: IconName };

/** The two home tabs (web bar and browser preview; native tabs are declared in src/app/(tabs)/_layout.tsx). */
export const HOME_TABS: TabItem[] = [
  { key: 'home', label: 'Home', icon: 'home', iconSelected: 'home_fill' },
  { key: 'reports', label: 'Reports', icon: 'description' },
];

/** Space to leave at the bottom of a tab screen so content isn't hidden under the floating bar. */
export const TAB_BAR_CLEARANCE = 64 + space.lg * 2;

/**
 * Floating "Liquid Glass" tab bar (iOS 26 style), for the web build and browser preview.
 * On iOS the app uses the system tab bar (NativeTabs), which is Liquid Glass on iOS 26;
 * this mirrors it in Airese colours so the preview reads the same.
 *
 * A frosted, translucent pill floating above the content; the selected tab sits on a
 * Breath capsule with Midnight icon and label, like our buttons (9.4:1). Labels are 12 pt (our minimum).
 * Render it last inside the screen container: it positions itself over the content.
 */
export function TabBar({ items, selected, onSelect }: { items: TabItem[]; selected: string; onSelect: (key: string) => void }) {
  const insets = useInsets();
  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, space.lg) }]} pointerEvents="box-none">
      <View style={styles.glass} accessibilityRole="tablist">
        {items.map((item) => {
          const active = item.key === selected;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              style={[styles.item, active && styles.itemActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
            >
              <Icon name={active && item.iconSelected ? item.iconSelected : item.icon} size={24} color={active ? 'onAccent' : 'text'} />
              <AppText variant="caption" color={active ? 'onAccent' : 'text'}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  glass: {
    flexDirection: 'row',
    padding: space.xs,
    gap: space.xs,
    borderRadius: radius.pill,
    backgroundColor: alpha(colors.deep, 0.55), // Deep, translucent
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(colors.moon, 0.22), // Moon edge highlight
    shadowColor: colors.night,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)' } as object) : null),
  },
  item: { width: 108, height: 56, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: radius.pill },
  itemActive: { backgroundColor: colors.accent }, // Breath capsule, like the primary button
});
