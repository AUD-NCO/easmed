import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@ds/components/AppText';
import { Button } from '@ds/components/Button';
import { Icon, type IconName } from '@ds/components/Icon';
import { LargeSheet } from '@ds/components/LargeSheet';
import { alpha, colors, radius, space, type } from '@ds/theme';

export type Caution = {
  /** The sheet's title: what's about to happen ("Delete all recordings"). */
  title: string;
  /** One sentence: what goes, for good. */
  lead: string;
  /** Short reasons to think twice: an icon, a few words, one line under them. Three at most. */
  points: { icon: IconName; title: string; body: string }[];
  /** The safe way out, the bright button ("Keep my recordings"). */
  keep: string;
  /** The destructive action, quieter and in red ("Delete all recordings"). */
  confirm: string;
};

/**
 * Before something that can't be undone (Profile → Delete all recordings, Delete account): a near
 * full-height sheet. An alert mark, "This can’t be undone", one sentence on what goes, then a few short
 * points on why it's worth keeping, and two answers: keep (bright, first) or delete (outlined in red).
 * Calm, not scary: the facts, no pressure (BRAND: calm, useful, no invented urgency).
 */
export function CautionSheet({ content, visible, onKeep, onConfirm }: { content: Caution; visible: boolean; onKeep: () => void; onConfirm: () => void }) {
  return (
    <LargeSheet visible={visible} title={content.title} onClose={onKeep}>
      <View style={styles.body}>
        <View style={styles.mark} accessible={false}>
          <Icon name="warning" size={32} color="error" />
        </View>
        <AppText variant="headline" color="text" accessibilityRole="header">
          This can’t be undone
        </AppText>
        <AppText color="text" style={{ marginTop: space.sm }}>
          {content.lead}
        </AppText>

        <AppText variant="small" color="textMuted" style={styles.kicker} accessibilityRole="header">
          Worth knowing first
        </AppText>
        <View style={styles.points}>
          {content.points.map((p) => (
            <View key={p.title} style={styles.point} accessible accessibilityLabel={`${p.title}. ${p.body}`}>
              <View style={styles.pointIcon}>
                <Icon name={p.icon} size={22} color="accent" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText color="text" style={styles.semibold}>
                  {p.title}
                </AppText>
                <AppText variant="small" color="textMuted">
                  {p.body}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        <Button label={content.keep} onPress={onKeep} style={{ marginTop: space.xxl }} />
        <Pressable onPress={onConfirm} accessibilityRole="button" accessibilityLabel={content.confirm} accessibilityHint="Can’t be undone" style={({ pressed }) => [styles.danger, pressed && { opacity: 0.8 }]}>
          <AppText variant="button" color="error">
            {content.confirm}
          </AppText>
        </Pressable>
      </View>
    </LargeSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: space.xl },
  // Flare at a low tint behind the Flare-light mark: a caution, not an alarm
  mark: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.errorMark, 0.16), marginTop: space.md, marginBottom: space.lg },
  kicker: { marginTop: space.xl, marginBottom: space.md },
  points: { gap: space.lg },
  point: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  pointIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tintAccent },
  semibold: { fontFamily: type.heading.fontFamily, fontWeight: type.heading.fontWeight },
  // Error text on the sheet: 7.5:1 (AAA). Outlined, so it reads as the second answer, not the first
  danger: { minHeight: 48, marginTop: space.md, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
});
