import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { AppText, BottomSheet, Button, DetailPage, ExplainSheet, FormDivider, FormGroup, Icon, Logo, PAGE_SIDE, PermissionSheet, SettingRow, SettingSwitch, Toast } from '../components';
import { SUPPORT } from '../lib/airStation';
import { EXPLAIN } from '../lib/nightDetails';
import { usePermissionStatus } from '../lib/permissionStatus';
import { initials, phoneDisplay, setNotificationPref, useNotificationPrefs, useProfile } from '../lib/profile';
import { deleteAllRecordings, useNights } from '../lib/recordings';
import { alpha, colors, space } from '../theme';

type Confirm = 'recordings' | 'erase';
type About = 'how' | 'privacy' | 'terms';

const CONFIRM: Record<Confirm, { title: string; body: string; action: string }> = {
  recordings: {
    title: 'Delete all recordings?',
    body: 'Every night’s recording and results are removed from this phone. Your details and settings stay. This can’t be undone.',
    action: 'Delete all recordings',
  },
  erase: {
    title: 'Erase everything?',
    body: 'Your details, recordings, Night Notes and settings are removed from this phone, and Airese starts again from the beginning. This can’t be undone.',
    action: 'Erase everything',
  },
};

// PLACEHOLDERS: Legal and Product to supply the privacy policy and terms (link out once published).
const ABOUT: Record<About, { title: string; body: string }> = {
  how: {
    title: 'How Airese works',
    body: 'Airese listens through your phone’s microphone while you sleep. It picks out snoring, pauses in breathing, coughs and movement, keeps short clips you can play back, and shows how each night compares with your usual. It all happens on your phone.',
  },
  privacy: { title: 'Privacy policy', body: `${EXPLAIN.privacy.body} The full privacy policy will be linked here.` },
  terms: { title: 'Terms of use', body: 'The terms of use will be linked here.' },
};

/**
 * Profile (account settings), opened from the avatar on Home. One short page of
 * rows; anything with a form or switches opens one level down. Order follows what people come for:
 *
 *   you          initials (no photo), name, email · Edit details ›
 *   sleep care   Talk to a sleep care team (call) · Our centres ›   (same words as Recording Details)
 *   settings     Bedtime reminder (a switch; "Turn on" while notifications are off) · Microphone ("Turn on" while it's off)
 *   about        How Airese works · Privacy policy · Terms of use
 *   your data    Delete all recordings · Erase everything and start again (each confirms; a toast after)
 *   brand        the Airese logo, "Powered by The Air Station", where your data lives, the version: quiet, at the end
 *
 * No sign-in or sign-out yet (so no "account" to delete: erase is what's on the phone).
 */
export function ProfileScreen({
  backLabel = 'Home',
  onBack,
  onOpenDetails,
  onOpenCentres,
  onErased,
}: {
  backLabel?: string;
  onBack: () => void;
  onOpenDetails: () => void;
  onOpenCentres: () => void;
  onErased: () => void;
}) {
  const profile = useProfile();
  const nights = useNights();
  const prefs = useNotificationPrefs();
  const notificationsOn = usePermissionStatus('notifications') === 'granted';
  const micOn = usePermissionStatus('microphone') === 'granted';
  const [micSheet, setMicSheet] = useState(false);
  const [notificationsSheet, setNotificationsSheet] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [lastConfirm, setLastConfirm] = useState<Confirm>('recordings'); // keeps the copy while the sheet closes
  const [about, setAbout] = useState<About | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const name = `${profile.firstName} ${profile.lastName}`.trim();
  const contact = profile.phone ? phoneDisplay(profile) : profile.email;
  const version = Constants.expoConfig?.version ?? '';

  const ask = (c: Confirm) => {
    setLastConfirm(c);
    setConfirm(c);
  };
  const confirmed = () => {
    setConfirm(null);
    if (lastConfirm === 'recordings') {
      deleteAllRecordings();
      setToast('All recordings deleted');
    } else onErased();
  };

  return (
    <>
      <DetailPage backLabel={backLabel} title="Profile" onBack={onBack}>
        <View style={styles.body}>
          {/* You */}
          <Pressable onPress={onOpenDetails} accessibilityRole="button" accessibilityLabel={`${name || 'Add your details'}${contact ? `, ${contact}` : ''}. Edit details`} style={({ pressed }) => [styles.you, pressed && { opacity: 0.8 }]}>
            <View style={styles.avatar}>
              {initials(profile) ? (
                <AppText variant="heading" color="text">
                  {initials(profile)}
                </AppText>
              ) : (
                <Icon name="person" size={28} color="text" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="heading" color="text" numberOfLines={1}>
                {name || 'Add your details'}
              </AppText>
              <AppText variant="small" color={name ? 'textMuted' : 'accent'} numberOfLines={1}>
                {name ? contact || 'Edit details' : 'Name, phone and a little about you'}
              </AppText>
            </View>
            <Icon name="chevron_right" size={22} color="textMuted" />
          </Pressable>

          {/* Sleep care: the way to a person, high up */}
          <FormGroup title="Sleep care">
            <SettingRow icon="call" title="Talk to a sleep care team" detail={SUPPORT.hours} chevron onPress={() => Linking.openURL(`tel:${SUPPORT.phone}`).catch(() => {})} />
            <FormDivider />
            <SettingRow icon="location_on" title="Our centres" detail="Find The Air Station near you" chevron onPress={onOpenCentres} />
          </FormGroup>

          {/* Settings */}
          <FormGroup title="Settings">
            {notificationsOn ? (
              <SettingSwitch icon="notifications" title="Bedtime reminder" value={prefs.bedtime} onChange={(on) => setNotificationPref('bedtime', on)} />
            ) : (
              <SettingRow icon="notifications" title="Bedtime reminder" detail="Notifications are off" action={{ label: 'Turn on', onPress: () => setNotificationsSheet(true) }} />
            )}
            <FormDivider />
            <SettingRow
              icon="mic"
              title="Microphone"
              detail={micOn ? 'On · needed to record your night' : 'Off · Airese can’t record without it'}
              action={micOn ? undefined : { label: 'Turn on', onPress: () => setMicSheet(true) }}
            />
          </FormGroup>

          {/* About */}
          <FormGroup title="About">
            <SettingRow icon="info" title="How Airese works" chevron onPress={() => setAbout('how')} />
            <FormDivider />
            <SettingRow icon="lock" title="Privacy policy" chevron onPress={() => setAbout('privacy')} />
            <FormDivider />
            <SettingRow icon="description" title="Terms of use" chevron onPress={() => setAbout('terms')} />
          </FormGroup>

          {/* Your data: last, on its own */}
          <FormGroup title="Your data">
            <SettingRow
              icon="delete"
              title="Delete all recordings"
              detail={nights.length ? `${nights.length} nights on this phone` : 'No recordings on this phone'}
              disabled={!nights.length}
              onPress={() => ask('recordings')}
            />
            <FormDivider />
            <SettingRow icon="delete" title="Erase everything and start again" detail="Details, recordings, notes and settings" onPress={() => ask('erase')} />
          </FormGroup>

          {/* Brand: quiet, at the end */}
          <View style={styles.brand} accessible accessibilityLabel={`Airese, powered by The Air Station. Everything Airese keeps is on this phone. Version ${version}`}>
            <Logo width={52} color="mist" />
            <AppText variant="small" color="textMuted" style={{ marginTop: space.lg }}>
              Powered by The Air Station
            </AppText>
            <AppText variant="small" color="textMuted" style={{ marginTop: space.xs, textAlign: 'center' }}>
              Everything Airese keeps is on this phone.
            </AppText>
            {version ? (
              <AppText variant="caption" color="textMuted" style={{ marginTop: space.xs }}>
                {`Version ${version}`}
              </AppText>
            ) : null}
          </View>
        </View>
      </DetailPage>

      <PermissionSheet kind="microphone" visible={micSheet} onAllowed={() => setMicSheet(false)} onNotNow={() => setMicSheet(false)} />
      {/* Bedtime reminder while notifications are off: allow them, and the reminder is on */}
      <PermissionSheet
        kind="notifications"
        visible={notificationsSheet}
        onAllowed={() => {
          setNotificationsSheet(false);
          setNotificationPref('bedtime', true);
        }}
        onNotNow={() => setNotificationsSheet(false)}
      />
      <ExplainSheet content={about ? ABOUT[about] : null} onClose={() => setAbout(null)} />

      <BottomSheet visible={confirm !== null} onClose={() => setConfirm(null)} fit>
        <AppText variant="heading" color="text" accessibilityRole="header" style={styles.center}>
          {CONFIRM[lastConfirm].title}
        </AppText>
        <AppText color="textMuted" style={[styles.center, { marginTop: space.sm }]}>
          {CONFIRM[lastConfirm].body}
        </AppText>
        <Button label={CONFIRM[lastConfirm].action} onPress={confirmed} style={{ marginTop: space.xl }} />
        <Button label="Cancel" variant="quiet" onPress={() => setConfirm(null)} style={{ marginTop: space.sm }} />
      </BottomSheet>

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_SIDE, marginTop: space.xl, gap: space.xl },
  you: { flexDirection: 'row', alignItems: 'center', gap: space.lg, minHeight: 64 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: alpha(colors.moon, 0.24),
  },
  brand: { alignItems: 'center', paddingTop: space.xxl * 2, paddingBottom: space.xxl, marginTop: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  center: { textAlign: 'center' },
});
