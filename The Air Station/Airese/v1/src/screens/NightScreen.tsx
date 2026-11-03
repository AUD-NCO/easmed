import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  BigNumber,
  CARE_CTA,
  CareConfirmSheet,
  RemediesSheet,
  ClipPlayer,
  ComparisonIndicator,
  DataCard,
  DetailPage,
  ExplainSheet,
  FlipLine,
  HourlyBars,
  Icon,
  ListenButton,
  CheckInBanner,
  type IconName,
  LargeSheet,
  VerdictActions,
  type VerdictAction,
  type Mood,
  PAGE_SIDE,
  PrivacyFooter,
  PromptBody,
  ScoreTile,
  SnoringChart,
} from '../components';
import { CompactVerdict, HighlightTile, LoudPauses, MellowSnoreTile, MellowVerdict, QuietVerdict, ReportTrio, SnoreRow, TallScoreTile, type TrioLayout } from '../components/ReportTrio';
import { benchmarks, classify, zoneOf, type Benchmark } from '../lib/benchmarks';
import { useClipPlayer } from '../lib/clipPlayer';
import {
  EXPLAIN,
  asleepStretches,
  CLIP_LABEL,
  INTENSITY_LABEL,
  SAMPLE_SECONDS,
  clockAt,
  nightDetails,
  shortDuration,
  summary,
  trend,
  trendWords,
  type Clip,
  type ExplainKey,
  type NightDetails,
  type NightState,
} from '../lib/nightDetails';
import { MIN_READABLE_MINUTES, stopTime, type ProblemCopy, type Stop } from '../lib/recordingIssues';
import { formatNightDate, formatRecorded, formatSpan, useAudioDeleted, type Night } from '../lib/recordings';
import { formatDuration } from '../lib/time';
import { alpha, colors, motion, radius, space, type, useReducedMotion } from '@ds/theme';


/**
 * Recording Details (L1): one night as a series of flat cards in two shapes (wide and square), each
 * with a visual and one line of insight. Only the Night report card goes deeper (a large sheet with
 * every measure); the (i)s and the verdict's action open small sheets.
 *
 * Three layers, for three readers:
 *   glance   (everyone, at 6 am) Snore Score and breathing as plain levels · the verdict and its one next step
 *   explore  your night in sound (the chart), then the moments to hear (up to 3: the two loudest
 *            snoring episodes and a breathing pause, with the pause and the breath after it marked);
 *            tapping a moment on the chart plays it · snoring time and sleep
 *   report   (the curious, and doctors) the night report sheet: zoomable chart, every measure, how it's measured
 * Snoring is a score (comparable, safe to track). Breathing is a plain level on the page; its exact
 * rate lives in its sheet and the report, pending Clinical. The sticky action follows the level of concern.
 * Colour by data: Ember snoring, Iris breathing, Dew sleep. Type: four sizes, regular and semibold.
 * States: processing, stopped early (what was saved), and a ready night as ordinary, moderate or severe
 * (classify: the higher of the Snore Score and breathing pauses bands).
 * A recording problem (couldn't hear clearly, stopped early): the usual header, and the problem in the
 * middle (PromptBody: image, problem, reason, how to solve, one button) in place of the cards.
 *
 * Stopped early, after "See what was saved": the saved part only. Scores if there's enough to read
 * (labelled with how much was recorded, never compared with your usual), and the clips either way.
 */
export function NightScreen({
  night: wholeNight,
  state: initialState,
  stop,
  problem,
  onBack,
  slideIn = Platform.OS === 'web',
  trailing,
  bottomInset,
  onRecordAgain,
  tag,
  onAddNotes,
  notesChosen = [],
  trio = 'mellow',
}: {
  /** The scores and verdict: the report's own design, or a temporary layout variant to compare (ReportTrio). */
  trio?: TrioLayout;
  night: Night;
  state: NightState;
  /** Stopped early: how and when (state 'stopped'). */
  stop?: Stop;
  /** A recording problem: shown in place of the cards. */
  problem?: { copy: ProblemCopy; cta: string; onCta: () => void };
  /** Opened over something (a back button). Leave out when it's the Reports tab's own page. */
  onBack?: () => void;
  slideIn?: boolean;
  /** A tag beside the subtitle, e.g. "Last night" (Reports, on the most recent night). */
  tag?: string;
  /** Top-right control (Reports: the calendar); see DetailPage. */
  trailing?: React.ComponentProps<typeof DetailPage>['trailing'];
  /** Room for the tab bar when it's a tab's page. */
  bottomInset?: number;
  /** "Record again tonight": where that goes (Reports: to Home). Defaults to going back. */
  onRecordAgain?: () => void;
  /** A small banner under the header opens this night's Morning check-in. */
  onAddNotes?: () => void;
  /** The remedies already in this night's Morning check-in; empty when none yet. */
  notesChosen?: { icon: IconName; label: string }[];
}) {
  const [state] = useState(initialState); // fixed for this page: a later change of the demo param doesn't swap it
  // Stopped early: the page is about what was saved
  const stopped = state === 'stopped' && stop ? stop : undefined;
  const night = stopped ? { ...wholeNight, minutes: stopped.savedMinutes } : wholeNight;
  const readable = !stopped || stopped.savedMinutes >= MIN_READABLE_MINUTES;
  const [report, setReport] = useState(false); // the Night report sheet
  const [explain, setExplain] = useState<ExplainKey | null>(null);
  const [remedies, setRemedies] = useState(false);
  const [pausesInfo, setPausesInfo] = useState(false); // the (i) on Breathing pauses
  const [careSheet, setCareSheet] = useState(false);
  const [heroBottom, setHeroBottom] = useState(0); // where the verdict card ends: the footer waits until it's scrolled past
  const player = useClipPlayer();
  const audioDeleted = useAudioDeleted(); // Profile → Delete all recordings: the report stays, the sound doesn't
  const d = nightDetails(night, state === 'processing' || state === 'stopped' ? 'ordinary' : state);
  // The moment in the player: a breathing pause if there was one (the clearest proof), else the first.
  const [selected, setSelected] = useState((d.featured.find((c) => c.type === 'Interrupted breathing') ?? d.featured[0])?.id);

  const ready = state !== 'processing' && state !== 'poor' && state !== 'stopped';
  const tier = classify(d); // the higher of the Snore Score and breathing pauses bands
  const sum = summary(d, tier);
  const marks = benchmarks(d);
  const lead = d.featured.find((c) => c.id === selected) ?? d.featured[0];
  const sound = mark(marks, 'sound');
  const breathing = mark(marks, 'breathing');
  const moment = lead ? d.featured.indexOf(lead) : -1;
  const pick = (c: Clip) => {
    setSelected(c.id);
    if (player.playing !== c.id) player.toggle(c);
  };

  // The night's one next step, in the verdict card and (once that's scrolled away) the sticky footer:
  // the same button in both places (label, icon, colour), so the page never offers two different actions.
  // Ordinary night: keep tracking. Moderate: talk to our sleep care team, with remedies to try tonight as a
  // round button beside it. Severe: talk to our sleep care team.
  const mood: Mood = tier === 'severe' ? 'urgent' : tier === 'moderate' ? 'watch' : 'calm';
  const step = (leave: (then: () => void) => void): VerdictAction =>
    tier !== 'ordinary'
      ? { label: CARE_CTA.label, icon: CARE_CTA.icon, onPress: () => setCareSheet(true) }
      : { label: 'Keep tracking', onPress: () => (onRecordAgain ? onRecordAgain() : onBack && leave(onBack)) };

  const secondary = tier === 'moderate' ? { label: 'Use a remedy', icon: 'healing' as const, onPress: () => setRemedies(true) } : undefined;

  // Listen, from a score: down to the recording (the moment card) with that moment picked, and the card
  // lit up for a moment so the eye lands on it. Nothing plays until they press play there.
  const bodyY = useRef(0); // where the cards start in the page
  const playerY = useRef(0); // where the moment card starts among them
  const glow = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const goListen = (c: Clip, scrollTo: (y: number) => void) => {
    setSelected(c.id);
    scrollTo(bodyY.current + playerY.current);
    glow.setValue(0);
    Animated.sequence([
      Animated.delay(reduced ? 0 : motion.stagger), // once the scroll has mostly settled
      Animated.timing(glow, { toValue: 1, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: motion.useNativeDriver }),
      Animated.timing(glow, { toValue: 0, duration: motion.slow.duration, delay: motion.hold, easing: motion.slow.easeIn, useNativeDriver: motion.useNativeDriver }),
    ]).start();
  };
  const moments = audioDeleted ? [] : d.featured;
  const loudSnore = moments.find((c) => c.type !== 'Interrupted breathing');
  const pause = moments.find((c) => c.type === 'Interrupted breathing');

  // Snoring is a score; breathing a plain level (its exact rate is in the Night report). Name and level only,
  // and under each, Listen: the way from the number to the sound behind it.
  const snoreTile = (scrollTo: (y: number) => void) => (
    <MellowSnoreTile
      fraction={sound.value / sound.max}
      value={sound.display}
      name="Snore Score"
      level={zoneOf(sound).word}
      accessibilityLabel={`Snore Score: ${sound.display} out of 100, ${zoneOf(sound).word}`}
      action={loudSnore && <ListenButton accessibilityLabel="Listen to your snoring" onPress={() => goListen(loudSnore, scrollTo)} />}
    />
  );
  const pausesTile = (scrollTo: (y: number) => void) => (
    <HighlightTile
      fraction={breathing.value / breathing.max}
      name="Breathing pauses"
      level={zoneOf(breathing).word}
      accessibilityLabel={`Breathing pauses: ${zoneOf(breathing).word}`}
      action={pause && <ListenButton filled accessibilityLabel="Listen to a breathing pause" onPress={() => goListen(pause, scrollTo)} />}
      infoLabel="What’s a breathing pause?"
      onInfo={() => setPausesInfo(true)}
    />
  );
  const scores = (scrollTo: (y: number) => void) => (
    <View style={styles.pair}>
      {snoreTile(scrollTo)}
      {pausesTile(scrollTo)}
    </View>
  );

  // Two cards: the chart (the index to the audio: tap a moment to hear it), then the moment's player.
  const sound_ = (
    <>
      <DataCard title="Your night in sound" insight={audioDeleted ? 'The audio was deleted. The chart and scores stay.' : undefined}>
        <SnoringChart d={d} mode="overview" moments={moments} selected={lead?.id} onSelect={pick} />
      </DataCard>
      {lead && !audioDeleted && (
      <View onLayout={(e) => (playerY.current = e.nativeEvent.layout.y)}>
      <DataCard>
        <ClipPlayer clip={lead} time={clockAt(d, lead.at)} player={player} detail={`${CLIP_LABEL[lead.type]} · ${lead.seconds} sec`} />
        {d.featured.length > 1 && (
      <View style={styles.stepper}>
        <Pressable onPress={() => pick(d.featured[moment - 1])} disabled={moment <= 0} accessibilityRole="button" accessibilityLabel="Previous moment" style={[styles.stepButton, moment <= 0 && styles.off]}>
          <Icon name="chevron_left" size={22} color="text" />
        </Pressable>
        <AppText variant="small" color="textMuted" accessibilityLiveRegion="polite">{`${moment + 1} of ${d.featured.length}`}</AppText>
        <Pressable
          onPress={() => pick(d.featured[moment + 1])}
          disabled={moment >= d.featured.length - 1}
          accessibilityRole="button"
          accessibilityLabel="Next moment"
          style={[styles.stepButton, moment >= d.featured.length - 1 && styles.off]}
        >
          <Icon name="chevron_right" size={22} color="text" />
        </Pressable>
      </View>
        )}
      </DataCard>
      {/* Lit up on arriving from Listen */}
      <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glow }]} />
      </View>
      )}
    </>
  );

  return (
    <>
      <DetailPage
        backLabel={onBack ? 'Back' : undefined}
        title={formatNightDate(night.date)}
        subtitle={<FlipLine lines={[formatRecorded(night.minutes), formatSpan(night)]} />} // one line: how long, then when, taking turns
        subtitleTag={tag}
        onBack={onBack}
        slideIn={onBack ? slideIn : false}
        trailing={trailing}
        bottomInset={bottomInset}
        footer={
          !ready
            ? undefined
            : (leave) => {
                return <VerdictActions mood={mood} action={step(leave)} secondary={secondary} />;
              }
        }
        footerAfter={ready ? heroBottom : undefined} // hidden from the start; shows once the verdict card has scrolled away
      >
        {(leave, scrollTo) => (
        <View style={styles.body} onLayout={(e) => (bodyY.current = e.nativeEvent.layout.y)}>
          {problem && <PromptBody art={problem.copy.art} title={problem.copy.title} body={problem.copy.reason} fix={problem.copy.fix} cta={problem.cta} onCta={problem.onCta} />}
          {state === 'processing' && <Processing />}
          {onAddNotes && !ready && <NotesNudge still={trio === 'mellow'} chosen={notesChosen} onPress={onAddNotes} />}

          {stopped && !problem && (
            <>
              {/* One line between the header and the cards: this is only part of the night */}
              <View style={styles.partial} accessibilityRole="text">
                <Icon name="warning" size={18} color="lamp" />
                <AppText variant="small" color="text">{`Partial recording · stopped at ${stopTime(wholeNight, stopped)}`}</AppText>
              </View>
              {readable && scores(scrollTo)}
              {sound_}
              <PrivacyFooter onMore={() => setExplain('privacy')} />
            </>
          )}

          {ready && (
            <>
              {/* The scores and the verdict: see ReportTrio */}
              <View onLayout={(e) => setHeroBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
                {trio === 'mellow' ? (
                  <ReportTrio
                    layout={trio}
                    snore={snoreTile(scrollTo)}
                    pauses={pausesTile(scrollTo)}
                    verdict={<MellowVerdict mood={mood} title={sum.headline} body={sum.body} action={step(leave)} secondary={secondary} />}
                  />
                ) : trio === 'loud' ? (
                  <ReportTrio
                    layout={trio}
                    pauses={
                      <LoudPauses
                        fraction={breathing.value / breathing.max}
                        name="Breathing pauses"
                        level={zoneOf(breathing).word}
                        accessibilityLabel={`Breathing pauses: ${zoneOf(breathing).word}`}
                        action={pause && <ListenButton accessibilityLabel="Listen to a breathing pause" onPress={() => goListen(pause, scrollTo)} />}
                      />
                    }
                    snore={
                      <SnoreRow
                        fraction={sound.value / sound.max}
                        value={sound.display}
                        name="Snore Score"
                        level={zoneOf(sound).word}
                        accessibilityLabel={`Snore Score: ${sound.display} out of 100, ${zoneOf(sound).word}`}
                        action={loudSnore && <ListenButton accessibilityLabel="Listen to your snoring" onPress={() => goListen(loudSnore, scrollTo)} />}
                      />
                    }
                    verdict={<QuietVerdict mood={mood} title={sum.headline} body={sum.body} action={step(leave)} secondary={secondary} />}
                  />
                ) : (
                  <ReportTrio
                    layout={trio}
                    pauses={
                      <TallScoreTile
                        layout={trio}
                        fraction={breathing.value / breathing.max}
                        name="Breathing pauses"
                        level={zoneOf(breathing).word}
                        accessibilityLabel={`Breathing pauses: ${zoneOf(breathing).word}`}
                        action={pause && <ListenButton accessibilityLabel="Listen to a breathing pause" onPress={() => goListen(pause, scrollTo)} />}
                      />
                    }
                    snore={
                      <ScoreTile
                        tone="snoring"
                        fraction={sound.value / sound.max}
                        value={sound.display}
                        name="Snore Score"
                        level={zoneOf(sound).word}
                        accessibilityLabel={`Snore Score: ${sound.display} out of 100, ${zoneOf(sound).word}`}
                        ringSize={96}
                        action={loudSnore && <ListenButton accessibilityLabel="Listen to your snoring" onPress={() => goListen(loudSnore, scrollTo)} />}
                      />
                    }
                    verdict={<CompactVerdict mood={mood} title={sum.headline} body={sum.body} action={step(leave)} secondary={secondary} />}
                  />
                )}
              </View>

              {onAddNotes && <NotesNudge still={trio === 'mellow'} chosen={notesChosen} onPress={onAddNotes} />}

              {sound_}

              {/* Snoring time and sleep */}
              <View style={styles.pair}>
                <DataCard shape="square" icon="graphic_eq" tone="snoring" label="Snoring" accessibilityLabel={`Snoring time: ${formatDuration(d.snoringMinutes)}`}>
                  <BigNumber value={shortDuration(d.snoringMinutes)} />
                  <Trend value={d.snoringMinutes} usual={d.baseline.snoringMinutes} />
                  <View style={styles.mini}>
                    <HourlyBars compact hours={d.hourly} />
                  </View>
                </DataCard>
                <DataCard shape="square" icon="bedtime" tone="sleep" label="Sleep" accessibilityLabel={`Sleep: ${formatDuration(d.sleepMinutes)}. ${zoneOf(mark(marks, 'sleep')).word}`}>
                  <BigNumber value={shortDuration(d.sleepMinutes)} />
                  <Note>{zoneOf(mark(marks, 'sleep')).word}</Note>
                  <View style={styles.mini}>
                    <AsleepStrip d={d} />
                  </View>
                </DataCard>
              </View>

              {/* The night report: every measure, for the curious and for a doctor */}
              <DataCard title="Night report" insight="Every measure from last night, and how Airese got it. Handy to show a doctor." onPress={() => setReport(true)}>
                <View style={styles.stats}>
                  <Stat value={shortDuration(d.snoringMinutes)} label="Snoring" />
                  <Stat value={`${snoringPerHour(d)} min`} label="Snoring an hour" />
                  <Stat value={`${pct(d.snoringMinutes, d.night.minutes)}%`} label="Snoring rate" />
                </View>
              </DataCard>

              <PrivacyFooter onMore={() => setExplain('privacy')} />
            </>
          )}
        </View>
        )}
      </DetailPage>

      {/* The Night report: every measure, and how it's measured */}
      <LargeSheet visible={report} title="Night report" onClose={() => setReport(false)}>
        <ReportBody d={d} />
      </LargeSheet>

      {/* Small sheets: one-line explanations */}
      <ExplainSheet content={explain ? EXPLAIN[explain] : null} onClose={() => setExplain(null)} />
      <RemediesSheet visible={remedies} onClose={() => setRemedies(false)} />
      <ExplainSheet content={pausesInfo ? PAUSES_INFO : null} onClose={() => setPausesInfo(false)} />
      {/* Talk to our sleep care team: say what's shared, then Request a call back (confirms in the sheet) or Not now */}
      <CareConfirmSheet visible={careSheet} onClose={() => setCareSheet(false)} />
    </>
  );
}

// The (i) on Breathing pauses: what they are, and why Airese listens for them. Short, calm, not a diagnosis.
const PAUSES_INFO = {
  title: 'What’s a breathing pause?',
  body: 'Your breathing stops for 10 seconds or more while you sleep, then starts again, often with a gasp or snort. You won’t notice it yourself, so it’s easy to miss.\n\nAirese listens for these all night, which most sleep apps don’t. If they happen often, it’s worth talking to our sleep care team.',
};

const mark = (marks: Benchmark[], k: Benchmark['key']) => marks.find((b) => b.key === k)!;
/** Where a score sits on its guide scale, 0 to 1. */

// ---------- Small pieces ----------

function Trend({ value, usual }: { value: number; usual: number }) {
  const t = trend(value, usual);
  return (
    <View style={{ marginTop: space.xs }}>
      <ComparisonIndicator trend={t} words={trendWords[t]} />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <AppText color="text" style={styles.semibold} numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="small" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

function Note({ children }: { children: string }) {
  return (
    <AppText variant="small" color="textMuted" style={{ marginTop: space.xs }}>
      {children}
    </AppText>
  );
}

/** Asleep across the night as a Dew line with gaps where restless. */
function AsleepStrip({ d }: { d: NightDetails }) {
  return (
    <View style={styles.strip} accessible={false}>
      {asleepStretches(d).map((a, i) => (
        <View key={i} style={[styles.asleep, { left: `${(a.start / d.night.minutes) * 100}%`, width: `${((a.end - a.start) / d.night.minutes) * 100 - 1}%` }]} />
      ))}
    </View>
  );
}

const pct = (part: number, whole: number) => Math.round((part / whole) * 100);

// ---------- Sheet contents ----------

/**
 * The Night report sheet: the snoring measures Airese can stand behind (time, rate, loudness level),
 * and how it measures. No decibels, sleep estimate, pauses, coughs, movement or scores for now
 * (stakeholder review, Oct 2026): more snoring measures to come from Engineering.
 */
function ReportBody({ d }: { d: NightDetails }) {
  return (
    <View style={styles.sheetBody}>
      <AppText color="textMuted">Everything Airese measured last night, and how. Phones differ, so compare nights rather than reading one number on its own.</AppText>
      <Block label="Snoring">
        <Rows
          rows={[
            ['Recorded', formatDuration(d.night.minutes)],
            ['Snoring time', formatDuration(d.snoringMinutes)],
            ['Snoring an hour', `${snoringPerHour(d)} min`],
            ['Snoring rate', `${pct(d.snoringMinutes, d.night.minutes)}% of the recording`],
          ]}
        />
      </Block>
      <Block label="How loud, as a share of snoring time">
        <Rows rows={(['light', 'moderate', 'loud', 'veryLoud'] as const).map((k) => [INTENSITY_LABEL[k], `${d.intensityShare[k]}%`])} />
      </Block>
      <Block label="How Airese measures">
        <AppText color="text">{`Your phone’s microphone listens through the night and checks the sound every ${SAMPLE_SECONDS} seconds. Airese recognises snoring from the sound alone, on your phone, and sorts it into four levels, from light to very loud.`}</AppText>
      </Block>
      <AppText variant="small" color="textMuted">
        Prototype: the loudness levels are placeholders for Clinical and Engineering to confirm. Not a diagnosis.
      </AppText>
    </View>
  );
}

function Rows({ rows }: { rows: string[][] }) {
  return rows.map(([what, value]) => (
    <View key={what} style={styles.refRow}>
      <AppText color="text" style={{ flex: 1 }}>
        {what}
      </AppText>
      <AppText color="textMuted" style={{ textAlign: 'right', flexShrink: 1 }}>
        {value}
      </AppText>
    </View>
  ));
}

/** Minutes of snoring in an average hour of the recording. */
const snoringPerHour = (d: NightDetails) => Math.round(d.snoringMinutes / (d.night.minutes / 60));

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <AppText variant="small" color="textMuted" accessibilityRole="header" style={{ marginBottom: space.lg }}>
        {label}
      </AppText>
      {children}
    </View>
  );
}

/**
 * Every night's report: a quiet row for the night's Morning check-in, under the verdict (above the cards
 * while there's no verdict). Tap to add or change it. One line, never taller: once filled in, the
 * remedies show as a row of overlapping icons that fade out towards the end (a habit: notes tagged to
 * each night, to see patterns over time). No entrance animation; while it's empty, one soft shine sweeps
 * across it once so it isn't missed (`still`: no shine, the report's own design).
 */
function NotesNudge({ chosen, onPress, still = false }: { chosen: { icon: IconName; label: string }[]; onPress: () => void; still?: boolean }) {
  return (
    <CheckInBanner
      quiet
      shine={!still && !chosen.length} // one sweep while it's still empty, so it isn't missed
      text={chosen.length ? 'Morning check-in' : 'Add your Morning check-in'}
      icons={chosen.map((c) => c.icon)}
      label={chosen.length ? `Morning check-in: ${chosen.map((c) => c.label).join(', ')}` : undefined}
      onPress={onPress}
    />
  );
}

/** While the night is looked through: what's happening, a line at a time. */
const PROCESSING_LINES = [
  'Finding snoring and breathing pauses.',
  'Picking the moments worth hearing.',
  'Comparing with your usual nights.',
  'Putting your report together.',
];

/** Straight after a recording: analysis still running. No empty cards (PRD §16). */
function Processing() {
  const t = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [line, setLine] = useState(0);
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: motion.slow.duration * 1.5, easing: motion.slow.easeInOut, useNativeDriver: motion.useNativeDriver }));
    loop.start();
    return () => loop.stop();
  }, [t]);
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: motion.fast.duration, easing: motion.fast.easeIn, useNativeDriver: motion.useNativeDriver }).start(() => {
        setLine((l) => (l + 1) % PROCESSING_LINES.length);
        Animated.timing(fade, { toValue: 1, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: motion.useNativeDriver }).start();
      });
    }, motion.hold);
    return () => clearInterval(id);
  }, [fade]);
  return (
    <View style={styles.processing} accessibilityLiveRegion="polite">
      <AppText variant="heading" color="text" style={{ textAlign: 'center' }}>
        Looking through your night
      </AppText>
      <Animated.View style={{ opacity: fade }}>
        <AppText color="textMuted" style={{ textAlign: 'center', marginTop: space.sm }}>
          {PROCESSING_LINES[line]}
        </AppText>
      </Animated.View>
      <View style={styles.progress}>
        <Animated.View style={[styles.glint, { transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [-80, 200] }) }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: PAGE_SIDE, marginTop: space.xl, gap: space.lg },
  // Partial recording: a pill with a faint Lamp tint, like the header's tag (not a card)
  partial: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: space.sm, minHeight: 36, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: alpha(colors.lamp, 0.14) },
  pair: { flexDirection: 'row', gap: space.md },
  mini: { marginTop: 'auto', paddingTop: space.lg },
  semibold: { fontFamily: type.heading.fontFamily, fontWeight: type.heading.fontWeight },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.lg },
  stepButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.moon, 0.08) },
  off: { opacity: 0.4 },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.card, borderWidth: 2, borderColor: colors.accent },
  stats: { flexDirection: 'row', gap: space.md },

  // The card's next step: full width, 48 pt. On the urgent (wine) card it's Moon, not Breath: blue on wine clashes.


  strip: { height: 12, justifyContent: 'center' },
  asleep: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: colors.dataSleep },

  sheetBody: { gap: space.xl, paddingTop: space.sm },
  block: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.gutter },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.sm },

  processing: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: space.xxl * 3 },
  progress: { width: 200, height: 4, borderRadius: 2, marginTop: space.xl, overflow: 'hidden', backgroundColor: alpha(colors.mist, 0.15) },
  glint: { width: 80, height: 4, borderRadius: 2, backgroundColor: colors.accent },
});
