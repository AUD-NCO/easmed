import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText, BottomSheet, Button, Icon, MonthCalendar, titleControl, PAGE_SIDE, PAGE_TITLE_TOP, PageTitle, PermissionSheet, TAB_BAR_CLEARANCE, TopSheet } from '../components';
import { isRemedy, nightEntry, optionsOf, rateNight, useNightNotes } from '../lib/nightNotes';
import { nightState } from '../lib/nightDetails';
import { usePermissionStatus } from '../lib/permissionStatus';
import { setNotificationPref, useNotificationPrefs } from '../lib/profile';
import { POOR_COPY, demoStop, stopCopy } from '../lib/recordingIssues';
import { markRatingAsked, recordingsDeleted, shouldAskRating, useAnalysing, useNights, type Night } from '../lib/recordings';
import { MISSED_NIGHTS_NUDGE, calendarNights, dayKey, recordedOfRecent } from '../lib/reports';
import { alpha, colors, radius, space, useInsets } from '@ds/theme';
import { NightScreen } from './NightScreen';

/**
 * Reports tab: opens on the most recent night's report (Recording Details). The calendar (top right)
 * drops down from the top with a month of nights, each ringed by its Sound Score; pick one to see
 * its report. No ring means nothing was recorded that night.
 * When several recent nights are missing, the calendar suggests a bedtime reminder (and asks for
 * notifications first if they're off).
 * A night with a recording problem keeps the usual header, with the problem in the middle (image, problem,
 * reason, how to solve): couldn't hear clearly → Record tonight; stopped early → See what was saved.
 * Straight after stopping: while the night is looked through, a sheet asks how the night was (1 to 5);
 * pick one or dismiss it. Every report has a banner for that night's Morning check-in (sleep remedies).
 * No nights (none yet, or all deleted from Profile): the empty state, NoReports.
 * `demoState`: the demo menu's Recording Details states, applied to the latest night (prototype only);
 * 'empty' shows the empty state after deleting.
 */
export function ReportsScreen({ demoState, onRecordAgain, onOpenNotes }: { demoState?: string; onRecordAgain: () => void; onOpenNotes: (night: Night) => void }) {
  const all = useNights();
  const nights = demoState === 'empty' ? NONE : all;
  const map = useMemo(() => calendarNights(nights), [nights]);
  const latest = nights[0];
  const [selected, setSelected] = useState<string | undefined>(latest?.id);
  const [calendar, setCalendar] = useState(false);
  const [savedOpen, setSavedOpen] = useState<string | null>(null); // stopped early: "See what was saved" tapped, for this night
  // Straight after a recording: the latest night, "Looking through your night", then its report.
  const analysing = useAnalysing();
  if (analysing && latest && selected !== latest.id) setSelected(latest.id);
  // How was your night? Asked once per recording, while it's looked through
  const [rating, setRating] = useState(shouldAskRating);
  if (!rating && shouldAskRating()) setRating(true);
  const closeRating = () => {
    markRatingAsked();
    setRating(false);
  };
  const night = (selected && map.get(selected)?.night) || latest;
  const notes = useNightNotes();

  if (!night) return <NoReports deleted={demoState === 'empty' || recordingsDeleted()} onRecordAgain={onRecordAgain} />;

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
        onAddNotes={state !== 'processing' && !problem ? () => onOpenNotes(night) : undefined}
        notesChosen={optionsOf(nightEntry(notes, night.id).notes.filter(isRemedy))}
      />

      <NightRating
        visible={rating}
        onRate={(n) => {
          if (latest) rateNight(latest.id, n);
          closeRating();
        }}
        onClose={closeRating}
      />

      <TopSheet visible={calendar} onClose={() => setCalendar(false)}>
        <MonthCalendar
          nights={map}
          selected={night.id}
          first={nights[nights.length - 1].date}
          diary={new Set(Object.keys(notes.nights).filter((id) => notes.nights[id].notes.length > 0))}
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

/** How the night was, 1 to 5: the moon filling up, with a word for each. */
const RATINGS = [
  { emoji: '🌑', name: 'Restless' },
  { emoji: '🌒', name: 'Choppy' },
  { emoji: '🌓', name: 'Okay' },
  { emoji: '🌔', name: 'Rested' },
  { emoji: '🌕', name: 'Dreamy' },
];

/** Straight after stopping: how the night was, 1 to 5. Pick one, or dismiss the sheet. */
function NightRating({ visible, onRate, onClose }: { visible: boolean; onRate: (n: number) => void; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <AppText variant="heading" accessibilityRole="header" style={{ textAlign: 'center', marginTop: space.lg }}>
        How was your night?
      </AppText>
      <View style={styles.rates}>
        {RATINGS.map((r, i) => (
          <Pressable key={r.name} onPress={() => onRate(i + 1)} accessibilityRole="button" accessibilityLabel={`${r.name}, ${i + 1} out of 5`} style={({ pressed }) => [styles.rate, pressed && { opacity: 0.7 }]}>
            <View style={styles.rateDisc}>
              <AppText variant="headline">{r.emoji}</AppText>
            </View>
            <AppText variant="small" color="textMuted" numberOfLines={1}>
              {r.name}
            </AppText>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const NONE: Night[] = [];

/**
 * Reports with nothing in it: before the first recording, or after Delete all recordings. The tab's
 * title, then in the middle: the moon in soft rings, what's happened, the one thing to do (Record
 * tonight, to Home) and a tip for a good first night. After deleting it says so plainly: a fresh start.
 */
function NoReports({ deleted, onRecordAgain }: { deleted: boolean; onRecordAgain: () => void }) {
  const insets = useInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + PAGE_TITLE_TOP, paddingBottom: TAB_BAR_CLEARANCE }]}>
      <StatusBar style="light" />
      <PageTitle title="Reports" />
      <View style={styles.empty}>
        <View style={styles.rings} accessible={false}>
          <View style={[styles.ring, styles.ringOuter]} />
          <View style={[styles.ring, styles.ringMid]} />
          <View style={styles.moon}>
            <Icon name="bedtime" size={40} color="accent" />
          </View>
        </View>
        <AppText variant="headline" accessibilityRole="header" style={styles.center}>
          {deleted ? 'Your recordings are deleted' : 'No reports yet'}
        </AppText>
        <AppText color="textMuted" style={[styles.center, { marginTop: space.sm }]}>
          {deleted ? 'A fresh start. Record tonight and your new report will be here in the morning.' : 'Record tonight and your first report will be here in the morning.'}
        </AppText>
        <Button label="Record tonight" icon="mic" onPress={onRecordAgain} style={{ marginTop: space.xl, alignSelf: 'stretch' }} />
        <View style={styles.tip}>
          <Icon name="lightbulb" size={20} color="textMuted" />
          <AppText variant="small" color="textMuted" style={{ flex: 1 }}>
            Put your phone near the bed, charging, screen down.
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  calendarButton: titleControl, // same as the avatar on Home
  calendarGlyph: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  nudge: { flexDirection: 'row', gap: space.md, marginTop: space.lg, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.tintAccent }, // Breath wash, so the Midnight mini button stands out
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: PAGE_SIDE, paddingBottom: space.xxl },
  center: { textAlign: 'center' },
  rings: { width: 176, height: 176, alignItems: 'center', justifyContent: 'center', marginBottom: space.xl },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: alpha(colors.accent, 0.16) },
  ringOuter: { width: 176, height: 176 },
  ringMid: { width: 132, height: 132, borderColor: alpha(colors.accent, 0.28) },
  moon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tintAccent },
  tip: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xl },
  rates: { flexDirection: 'row', justifyContent: 'space-between', gap: space.xs, marginTop: space.xxl, marginBottom: space.xl },
  rate: { flex: 1, alignItems: 'center', gap: space.sm },
  rateDisc: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
