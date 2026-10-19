import React, { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { openAppSettings } from '../lib/permissions';
import { askPermission, refreshPermissions, usePermissionStatus, type PermissionKind } from '../lib/permissionStatus';
import { colors, alpha, space } from '@ds/theme';
import { AppText } from '@ds/components/AppText';
import { BottomSheet } from '@ds/components/BottomSheet';
import { Button } from '@ds/components/Button';
import { Icon, type IconName } from '@ds/components/Icon';

const COPY: Record<PermissionKind, { icon: IconName; cta: string; why: { title: string; body: string }; blocked: { title: string; body: string } }> = {
  microphone: {
    icon: 'mic',
    cta: 'Allow microphone',
    why: {
      title: 'Airese needs your microphone',
      body: 'It’s how Airese hears snoring and breathing while you sleep. Without it, nothing gets recorded. Recordings stay on your phone.',
    },
    blocked: {
      title: 'Microphone is off',
      body: 'Airese can’t record your night without it. To turn it on, open Settings and allow Microphone for Airese.',
    },
  },
  notifications: {
    icon: 'notifications',
    cta: 'Allow notifications',
    why: {
      title: 'Get a nudge at bedtime',
      body: 'A reminder at bedtime, so you don’t miss a night.',
    },
    blocked: {
      title: 'Notifications are off',
      body: 'You won’t get the bedtime reminder. To turn it on, open Settings and allow Notifications for Airese.',
    },
  },
};

/**
 * A second chance at a permission, in a bottom sheet. Never a wall: "Not now" always moves on.
 * Picks its message from where the permission stands:
 *   not asked yet / skipped → why it matters, with Allow (shows the system prompt)
 *   said no                 → what's missing and how to turn it on, with Open Settings
 *                             (iOS shows its prompt only once, so Settings is the only way back)
 * Back from Settings with it turned on: calls onAllowed by itself.
 * Used after Skip / Don't Allow in onboarding, and from Home when a permission is off.
 */
export function PermissionSheet({
  kind,
  visible,
  onAllowed,
  onNotNow,
  onDismiss,
  note,
}: {
  kind: PermissionKind;
  visible: boolean;
  onAllowed: () => void;
  onNotNow: () => void;
  /** Backdrop tap or drag down: just close. Defaults to onNotNow. */
  onDismiss?: () => void;
  /** Optional line under the buttons, e.g. where to find this later. */
  note?: string;
}) {
  const status = usePermissionStatus(kind);
  const [asking, setAsking] = useState(false);
  const [mode, setMode] = useState<'why' | 'blocked'>(status === 'blocked' ? 'blocked' : 'why');
  const copy = COPY[kind];
  const text = mode === 'why' ? copy.why : copy.blocked;

  // Opening: match the message to where the permission stands now.
  useEffect(() => {
    if (visible) setMode(status === 'blocked' ? 'blocked' : 'why');
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const allow = async () => {
    setAsking(true); // hide the sheet while the system prompt is up
    const next = await askPermission(kind);
    setAsking(false);
    if (next === 'granted') onAllowed();
    else setMode('blocked');
  };

  const settings = async () => {
    await openAppSettings().catch(() => {});
    if (Platform.OS === 'web') onNotNow(); // browser preview: no Settings app to come back from
  };

  // Back from Settings: if it's now on, carry on.
  useEffect(() => {
    if (!visible || mode !== 'blocked') return;
    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      await refreshPermissions();
    });
    return () => sub.remove();
  }, [visible, mode]);
  useEffect(() => {
    if (visible && status === 'granted' && mode === 'blocked') onAllowed();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BottomSheet visible={visible && !asking} onClose={onDismiss ?? onNotNow}>
      <View style={styles.badge}>
        <Icon name={mode === 'why' ? copy.icon : 'settings'} size={28} color="accent" />
      </View>
      <AppText variant="heading" accessibilityRole="header" style={[styles.center, { marginTop: space.lg }]}>
        {text.title}
      </AppText>
      <AppText color="textMuted" style={[styles.center, { marginTop: space.sm }]}>
        {text.body}
      </AppText>
      <Button label={mode === 'why' ? copy.cta : 'Open Settings'} onPress={mode === 'why' ? allow : settings} style={{ marginTop: space.xl }} />
      <Button label="Not now" variant="quiet" onPress={onNotNow} style={{ marginTop: space.sm }} />
      {note ? (
        <AppText variant="small" color="textMuted" style={[styles.center, { marginTop: space.sm }]}>
          {note}
        </AppText>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.breath, 0.14), // Breath, soft
  },
  center: { textAlign: 'center' },
});
