import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { space } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

/**
 * A checkbox with a sentence beside it (e.g. agreeing to the terms). The box is a 44 pt target;
 * the sentence can hold inline links (nested <AppText onPress>), which stay tappable on their own.
 * `error` shows a calm line under it, with the error mark, like form groups do.
 */
export function Checkbox({ checked, onToggle, label, error, children }: { checked: boolean; onToggle: () => void; label: string; error?: string; children: React.ReactNode }) {
  return (
    <View>
      <View style={styles.row}>
        <Pressable
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={label}
          hitSlop={4}
          style={({ pressed }) => [styles.box, pressed && { opacity: 0.8 }]}
        >
          <Icon name={checked ? 'check_box' : 'check_box_outline_blank'} size={26} color={error && !checked ? 'errorMark' : checked ? 'accent' : 'textMuted'} />
        </Pressable>
        <AppText variant="small" color="textMuted" style={styles.text} onPress={onToggle}>
          {children}
        </AppText>
      </View>
      {error && !checked ? (
        <View style={styles.error}>
          <Icon name="error" size={16} color="errorMark" />
          <AppText variant="small" color="error" accessibilityLiveRegion="polite">
            {error}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

/** An inline link inside a Checkbox sentence. */
export function InlineLink({ children, onPress, label }: { children: string; onPress: () => void; label?: string }) {
  return (
    <AppText variant="small" color="accent" onPress={onPress} accessibilityRole="link" accessibilityLabel={label ?? children} style={styles.link}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  box: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  text: { flex: 1, paddingVertical: space.sm },
  link: { textDecorationLine: 'underline' },
  error: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
});
