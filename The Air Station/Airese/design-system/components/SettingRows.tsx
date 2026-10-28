import React from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { alpha, colors, radius, space } from '../theme';

/**
 * Rows for the Profile pages, inside a FormGroup card (the iOS Settings pattern).
 *
 *   SettingRow     icon, title and an optional line of detail. A tap does one thing: a chevron
 *                  means it opens a page; an `action` pill does something here ("Turn on").
 *   SettingSwitch  a label (with an optional icon) and a switch. Greyed out (and off) while `enabled` is false.
 */
export function SettingRow({
  icon,
  title,
  detail,
  chevron,
  action,
  disabled,
  onPress,
}: {
  icon: IconName;
  title: string;
  detail?: string;
  chevron?: boolean;
  action?: { label: string; onPress: () => void };
  disabled?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Icon name={icon} size={24} color="text" />
      <View style={{ flex: 1 }}>
        <AppText color="text">{title}</AppText>
        {detail ? (
          <AppText variant="small" color="textMuted">
            {detail}
          </AppText>
        ) : null}
      </View>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${action.label}: ${title}`} style={({ pressed }) => [styles.pill, pressed && { opacity: 0.85 }]}>
          <AppText variant="small" color="onAccent">
            {action.label}
          </AppText>
        </Pressable>
      ) : chevron ? (
        <Icon name="chevron_right" size={22} color="textMuted" />
      ) : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={`${title}${detail ? `, ${detail}` : ''}`}
      style={({ pressed }) => [styles.row, disabled && styles.disabled, pressed && { opacity: 0.7 }]}
    >
      {content}
    </Pressable>
  );
}

export function SettingSwitch({ icon, title, detail, value, enabled = true, onChange }: { icon?: IconName; title: string; detail?: string; value: boolean; enabled?: boolean; onChange: (on: boolean) => void }) {
  return (
    <View style={[styles.row, !enabled && styles.disabled]}>
      {icon && <Icon name={icon} size={24} color="text" />}
      <View style={{ flex: 1 }}>
        <AppText color="text">{title}</AppText>
        {detail ? (
          <AppText variant="small" color="textMuted">
            {detail}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        disabled={!enabled}
        onValueChange={onChange}
        accessibilityLabel={`${title}${detail ? `, ${detail}` : ''}`}
        trackColor={{ false: alpha(colors.mist, 0.3), true: colors.accent }}
        thumbColor={colors.white}
        ios_backgroundColor={alpha(colors.mist, 0.3)}
        {...(Platform.OS === 'web' ? ({ activeThumbColor: colors.white } as object) : null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, minHeight: 64, paddingHorizontal: space.lg, paddingVertical: space.md },
  disabled: { opacity: 0.5 },
  pill: { minHeight: 36, paddingHorizontal: space.lg, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.accent },
});
