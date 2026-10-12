import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText, Button, Icon, MonthCalendar, titleControl, PAGE_SIDE, PermissionSheet, TAB_BAR_CLEARANCE, TopSheet } from '../components';
import { nightState } from '../lib/nightDetails';
import { usePermissionStatus } from '../lib/permissionStatus';
import { setNotificationPref, useNotificationPrefs } from '../lib/profile';
import { POOR_COPY, demoStop, stopCopy } from '../lib/recordingIssues';
import { useAnalysing, useNights } from '../lib/recordings';
import { MISSED_NIGHTS_NUDGE, calendarNights, dayKey, recordedOfRecent } from '../lib/reports';
import { colors, radius, space, useInsets } from '../theme';
import { NightScreen } from './NightScreen';

/**
 * Reports tab: opens on the most recent night's report (Recording Details). The calendar (top right)
 * drops down from the top with a month of nights, each ringed by its Sound Score; pick one to see
 * its report. No ring means nothing was recorded that night.
 * When several recent nights are missing, the calendar suggests a bedtime reminder (and asks for
 * notifications first if they're off).
 * A night with a recording problem keeps the usual header, with the problem in the middle (image, problem,
 * reason, how to solve): couldn't hear clearly → Record tonight; stopped early → See what was saved.
 * `demoState`: the demo menu's Recording Details states, applied to the latest night (prototype only).
 */
export function ReportsScreen({ demoState, onRecordAgain }: { demoState?: string; onRecordAgain: () => void }) {
  const nights = useNights();
  const map = useMemo(() => calendarNights(nights), [nights]);
  const latest = nights[0];
  const [selected, setSelected] = useState<string | undefined>(latest?.id);
  const [calendar, setCalendar] = useState(false);
  const [savedOpen, setSavedOpen] = useState<string | null>(null); // stopped early: "See what was saved" tapped, for this night
  // Straight after a recording: the latest night, "Looking through your night", then its report.
  const analysing = useAnalysing();
  if (analysing && latest && selected !== latest.id) setSelected(latest.id);
  const night = (selected && map.get(selected)?.night) || latest;

  if (!night) return <NoReports onRecordAgain={onRecordAgain} />;

  const state = night === latest && analysing ? 'processing' : night === latest && demoState ? nightState(night, demoState) : nightState(night);
  // Only last night (the night that started yesterday) gets a tag; every other night shows just its date.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const tag = dayKey(night.date) === dayKey(yesterday) ? 'Last night' : undefined;
  const stop = state === 'stopped' ? demoStop(demoState) : undefined;

  const calendarButton = (inBar: boolean) => (
    // Title row: the glassy circle, like the avatar on Home. Compact bar: a plain Breath glyph, like "‹ Back".
    <Pressable
      onPress={() => setCalendar(true)}
      accessibilityRole="button"
      accessibilityLabel="Choose a night"
      hitSlop={4}
      style={({ pressed }) => [inBar ? styles.calendarGlyph : styles.calendarButton, pressed && { opacity: 0.8 }]}
    >
      <Icon name="calendar_month" size={24} color={inBar ? 'accent' : 'text'} />
    </Pressable>
  );

  const problem =
    state === 'poor'
      ? { copy: POOR_COPY, cta: 'Record tonight', onCta: onRecordAgain }
      : stop && savedOpen !== night.id
        ? { copy: stopCopy(night, stop), cta: 'See what was saved', onCta: () => setSavedOpen(night.id) }
        : null;

  return (
    <View style={styles.root}>
      <NightScreen
        key={`${night.id}${state === 'processing' ? ':analysing' : ''}${problem ? ':problem' : ''}`} // analysis done, or the saved part opened: a new page
        night={night}
        state={state}
        stop={stop}
        problem={problem ?? undefined}
        bottomInset={TAB_BAR_CLEARANCE}
        tag={tag}
        onRecordAgain={onRecordAgain}
        trailing={calendarButton}
      />

      <TopSheet visible={calendar} onClose={() => setCalendar(false)}>
        <MonthCalendar
          nights={map}
          selected={night.id}
          first={nights[nights.length - 1].date}
          onPick={(n) => {
            setSelected(n.night.id);
            setCalendar(false);
          }}
        />
        <MissedNights />
      </TopSheet>
    </View>
  );
}

/**
 * Several recent nights with no recording: a calm nudge towards a bedtime reminder.
 * Notifications off → ask for them (then the bedtime reminder is on). On, but the bedtime reminder off →
 * turn it on here. Both on → no nudge (there's nothing more to offer).
 */
function MissedNights() {
  const nights = useNights();
  const prefs = useNotificationPrefs();
  const notificationsOn = usePermissionStatus('notifications') === 'granted';
  const [asking, setAsking] = useState(false);
  const { recorded, days, missed } = recordedOfRecent(nights);
  if (missed < MISSED_NIGHTS_NUDGE || (notificationsOn && prefs.bedtime)) return null;

  return (
    <View style={styles.nudge}>
      <Icon name="notifications" size={24} color="accent" />
      <View style={{ flex: 1 }}>
        <AppText color="text">{`You recorded ${recorded} of the last ${days} nights. A bedtime reminder can help.`}</AppText>
        <Button
          label="Remind me at bedtime"
          variant="mini"
          onPress={() => (notificationsOn ? setNotificationPref('bedtime', true) : setAsking(true))}
          style={{ marginTop: space.md }}
        />
      </View>
      <PermissionSheet
        kind="notifications"
        visible={asking}
        onAllowed={() => {
          setAsking(false);
          setNotificationPref('bedtime', true);
        }}
        onNotNow={() => setAsking(false)}
      />
    </View>
  );
}

/** Before the first recording (or after deleting them all). */
function NoReports({ onRecordAgain }: { onRecordAgain: () => void }) {
  const insets = useInsets();
  return (
    <View style={[styles.root, styles.empty, { paddingTop: insets.top + space.xxl * 2, paddingBottom: TAB_BAR_CLEARANCE }]}>
      <StatusBar style="light" />
      <AppText variant="title" accessibilityRole="header">
        Reports
      </AppText>
      <AppText color="textMuted" style={{ marginTop: space.sm }}>
        Your first report appears here the morning after you record a night.
      </AppText>
      <Button label="Record tonight" onPress={onRecordAgain} style={{ marginTop: space.xl, alignSelf: 'flex-start' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  calendarButton: titleControl, // same as the avatar on Home
  calendarGlyph: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  nudge: { flexDirection: 'row', gap: space.md, marginTop: space.lg, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.tintAccent }, // Breath wash, so the Midnight mini button stands out
  empty: { paddingHorizontal: PAGE_SIDE },
});
