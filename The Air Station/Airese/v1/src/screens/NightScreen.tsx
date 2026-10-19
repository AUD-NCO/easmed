import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  AudioSnippet,
  BenchmarkScale,
  BigNumber,
  Button,
  ClipPlayer,
  ComparisonIndicator,
  DataCard,
  DetailPage,
  ExplainSheet,
  HourlyBars,
  Icon,
  InsightCard,
  LargeSheet,
  LoudnessBars,
  VERDICT_ACTION,
  VerdictCard,
  type Mood,
  NightTimeline,
  PAGE_SIDE,
  PrivacyFooter,
  PromptBody,
  RampFill,
  RecentNightsChart,
  ScoreTile,
  SnoringChart,
  asleepStretches,
  useClipPlayer,
  type ClipPlayerState,
} from '../components';
import { benchmarks, zoneOf, type Benchmark } from '../lib/benchmarks';
import {
  EXPLAIN,
  busiestWindow,
  CLIP_LABEL,
  SAMPLE_SECONDS,
  clockAt,
  dbAt,
  loudMinutes,
  meaning,
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
import { formatNightDate, formatRecorded, formatSpan, type Night } from '../lib/recordings';
import { formatDuration } from '../lib/time';
import { alpha, colors, dataInk, motion, radius, space, type } from '@ds/theme';

/** What a card opens: a large sheet. */
type Sheet = 'report' | 'sound' | 'snoring' | 'breathing' | 'sleep' | 'clips' | 'recent';
const SHEET_TITLE: Record<Sheet, string> = {
  report: 'Night report',
  sound: 'Sound Score',
  snoring: 'Snoring through the night',
  breathing: 'Breathing pauses',
  sleep: 'Sleep',
  clips: 'All clips',
  recent: 'Your recent nights',
};

/**
 * Recording Details (L1): one night as a series of cards in two shapes (wide and square). Each
 * card has a visual, one line of insight and "›" to a large sheet with the full story.
 *
 * Three layers, for three readers:
 *   glance   (everyone, at 6 am) Sound Score and breathing as plain levels · the verdict and its one next step
 *   explore  your night in sound: the chart is the index to the clips; tap a moment to hear it, with the
 *            pause and the breath after it marked · snoring time and sleep · recent nights · what it means
 *   report   (the curious, and doctors) the night report sheet: zoomable chart, every measure, how it's measured
 * Snoring is a score (comparable, safe to track). Breathing is a plain level on the page; its exact
 * rate lives in its sheet and the report, pending Clinical. The sticky action follows the level of concern.
 * Colour by data: Ember snoring, Iris breathing, Dew sleep. Type: four sizes, regular and semibold.
 * States: processing, stopped early (what was saved), ordinary, unusual, repeated pattern.
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
}: {
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
}) {
  const [state] = useState(initialState); // fixed for this page: a later change of the demo param doesn't swap it
  // Stopped early: the page is about what was saved
  const stopped = state === 'stopped' && stop ? stop : undefined;
  const night = stopped ? { ...wholeNight, minutes: stopped.savedMinutes } : wholeNight;
  const readable = !stopped || stopped.savedMinutes >= MIN_READABLE_MINUTES;
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [lastSheet, setLastSheet] = useState<Sheet>('report');
  const [explain, setExplain] = useState<ExplainKey | 'care' | 'remedy' | null>(null);
  const [heroBottom, setHeroBottom] = useState(0); // where the verdict card ends: the footer waits until it's scrolled past
  const player = useClipPlayer();
  const d = nightDetails(night, state === 'processing' || state === 'stopped' ? 'steady' : state);
  // The moment in the player: a breathing pause if there was one (the clearest proof), else the first.
  const [selected, setSelected] = useState((d.featured.find((c) => c.type === 'Interrupted breathing') ?? d.featured[0])?.id);

  const open = (s: Sheet) => {
    setLastSheet(s);
    setSheet(s);
  };

  const ready = state !== 'processing' && state !== 'poor' && state !== 'stopped';
  const concern = state === 'pattern';
  const sum = summary(d);
  const means = meaning(d);
  const usual = stopped ? undefined : d.baseline; // part of a night: never compared with your usual (the Partial recording note says it)
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
  // Ordinary night: keep tracking. Unusual: something to try tonight. Repeated pattern: book a call.
  const mood: Mood = concern ? 'urgent' : state === 'unusual' ? 'watch' : 'calm';
  const step = (leave: (then: () => void) => void) =>
    concern
      ? { label: 'Book a call', icon: 'call' as const, onPress: () => setExplain('care') }
      : state === 'unusual'
        ? { label: 'Try using a remedy', onPress: () => setExplain('remedy') }
        : { label: 'Keep tracking', onPress: () => (onRecordAgain ? onRecordAgain() : onBack && leave(onBack)) };

  // Snoring is a score; breathing a plain level (its exact rate is in its sheet and the report).
  const scores = (
    <View style={styles.pair}>
      <ScoreTile
        tone="snoring"
        fraction={sound.value / sound.max}
        value={sound.display}
        name="Sound Score"
        level={zoneOf(sound).word}
        detail={usual && trendWords[trend(d.snoringMinutes, usual.snoringMinutes)]}
        onPress={() => open('sound')}
        accessibilityLabel={`Sound Score: ${sound.display} out of 100, ${zoneOf(sound).word}. More`}
      />
      <ScoreTile
        tone="breathing"
        fraction={breathing.value / breathing.max}
        icon="airwave"
        name="Breathing pauses"
        level={zoneOf(breathing).word}
        detail={usual && trendWords[trend(d.breathingEvents.length, usual.breathingEvents)]}
        onPress={() => open('breathing')}
        accessibilityLabel={`Breathing pauses: ${zoneOf(breathing).word}. More`}
      />
    </View>
  );

  // The chart is the index to the audio: tap a moment to hear it.
  const sound_ = (
    <DataCard title="Your night in sound">
      <AppText color="text" style={{ marginBottom: space.xl }}>
        {chartLine(d)}
      </AppText>
      <SnoringChart d={d} mode="overview" moments={d.featured} selected={lead?.id} onSelect={pick} />
      {lead && (
        <View style={styles.moment}>
          <ClipPlayer clip={lead} time={clockAt(d, lead.at)} player={player} detail={`${CLIP_LABEL[lead.type]} · ${dbAt(d, lead.at)} dB · ${lead.seconds} sec`} />
        </View>
      )}
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
        <Pressable onPress={() => open('clips')} accessibilityRole="button" accessibilityLabel={`All ${d.clips.length} clips`} style={styles.allClips}>
          <AppText variant="small" color="accent">{`All ${d.clips.length}`}</AppText>
          <Icon name="chevron_right" size={18} color="accent" />
        </Pressable>
      </View>
    </DataCard>
  );

  return (
    <>
      <DetailPage
        backLabel={onBack ? 'Back' : undefined}
        title={formatNightDate(night.date)}
        subtitle={`${formatRecorded(night.minutes)}\n${formatSpan(night)}`} // two lines: how long, then when
        subtitleTag={tag}
        onBack={onBack}
        slideIn={onBack ? slideIn : false}
        trailing={trailing}
        bottomInset={bottomInset}
        footer={
          !ready
            ? undefined
            : (leave) => {
                const s = step(leave);
                return <Button label={s.label} icon={s.icon} color={VERDICT_ACTION[mood]} onPress={s.onPress} />;
              }
        }
        footerAfter={ready ? heroBottom : undefined} // hidden from the start; shows once the verdict card has scrolled away
      >
        {(leave) => (
        <View style={styles.body}>
          {problem && <PromptBody art={problem.copy.art} title={problem.copy.title} body={problem.copy.reason} fix={problem.copy.fix} cta={problem.cta} onCta={problem.onCta} />}
          {state === 'processing' && <Processing />}

          {stopped && !problem && (
            <>
              {/* One line between the header and the cards: this is only part of the night */}
              <View style={styles.partial} accessibilityRole="text">
                <Icon name="warning" size={18} color="lamp" />
                <AppText variant="small" color="text">{`Partial recording · stopped at ${stopTime(wholeNight, stopped)}`}</AppText>
              </View>
              {readable && scores}
              {sound_}
              <PrivacyFooter onMore={() => setExplain('privacy')} />
            </>
          )}

          {ready && (
            <>
              {scores}

              {/* The verdict: the words, the night's one next step, and the week as a graph behind them */}
              <View onLayout={(e) => setHeroBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
                <VerdictCard
                  mood={mood}
                  title={sum.headline}
                  body={sum.body}
                  values={d.recent.map((r) => r.snoringMinutes)} // the week behind the words: last 7 nights of snoring, tonight last
                  action={step(leave)}
                />
              </View>

              {sound_}

              {/* Snoring time and sleep */}
              <View style={styles.pair}>
                <DataCard shape="square" icon="graphic_eq" tone="snoring" label="Snoring" onPress={() => open('snoring')} accessibilityLabel={`Snoring time: ${formatDuration(d.snoringMinutes)}. More`}>
                  <BigNumber value={shortDuration(d.snoringMinutes)} />
                  <Trend value={d.snoringMinutes} usual={d.baseline.snoringMinutes} />
                  <View style={styles.mini}>
                    <HourlyBars compact hours={d.hourly} />
                  </View>
                </DataCard>
                <DataCard shape="square" icon="bedtime" tone="sleep" label="Sleep" onPress={() => open('sleep')} accessibilityLabel={`Sleep: ${formatDuration(d.sleepMinutes)}. ${zoneOf(mark(marks, 'sleep')).word}. More`}>
                  <BigNumber value={shortDuration(d.sleepMinutes)} />
                  <Note>{zoneOf(mark(marks, 'sleep')).word}</Note>
                  <View style={styles.mini}>
                    <AsleepStrip d={d} />
                  </View>
                </DataCard>
              </View>

              {/* Recent nights */}
              <DataCard title="Your recent nights" insight={recentLine(d)} onPress={() => open('recent')}>
                <RecentNightsChart nights={d.recent.map((r) => ({ day: r.day, value: r.snoringMinutes, tonight: r.tonight }))} usual={d.baseline.snoringMinutes} level={scaleAt(mark(marks, 'snoring'))} format={formatDuration} />
              </DataCard>

              {/* What it means */}
              {means && <InsightCard tone="warm" icon="lightbulb" title={means.title} body={means.body} onInfo={() => setExplain('deciding')} infoLabel="How Airese decides what to say" />}

              {/* The night report: every measure, for the curious and for a doctor */}
              <DataCard title="Night report" insight="Every measure from last night, and how Airese got it. Handy to show a doctor." onPress={() => open('report')}>
                <View style={styles.stats}>
                  <Stat value={`${d.peakDb} dB`} label="Loudest" />
                  <Stat value={String(breathing.value)} label="Pauses an hour" />
                  <Stat value={shortDuration(loudMinutes(d))} label="Above 60 dB" />
                </View>
              </DataCard>

              <PrivacyFooter onMore={() => setExplain('privacy')} />
            </>
          )}
        </View>
        )}
      </DetailPage>

      {/* Large sheets: the full story behind each card */}
      <LargeSheet visible={sheet !== null} title={SHEET_TITLE[lastSheet]} onClose={() => setSheet(null)}>
        <SheetBody which={lastSheet} d={d} marks={marks} player={player} />
      </LargeSheet>

      {/* Small sheets: one-line explanations */}
      <ExplainSheet
        content={explain === 'care' ? CARE : explain === 'remedy' ? REMEDY : explain ? EXPLAIN[explain] : null}
        onClose={() => setExplain(null)}
        // Callback flow (contact details, consent): design to come
        action={explain === 'care' ? { label: 'Request a callback', onPress: () => setExplain(null) } : undefined}
        dismissLabel={explain === 'care' ? 'Not now' : undefined}
      />
    </>
  );
}

const CARE = {
  title: 'Talk to a sleep care team',
  body: 'A sleep care team from The Air Station can go through your recent nights with you and suggest what to do next. It isn’t a diagnosis.',
};

// Over-the-counter things some people find help; not medical advice, and no product names.
const REMEDY = {
  title: 'Something to try tonight',
  body: 'Nasal strips, sleeping on your side, or a humidifier help some people snore less. You can get them without a prescription. Try one tonight and add it to Night Notes, so Airese can show you if it made a difference.',
};

const mark = (marks: Benchmark[], k: Benchmark['key']) => marks.find((b) => b.key === k)!;
/** Where a score sits on its guide scale, 0 to 1. */
const scaleAt = (b: Benchmark) => (b.value - b.min) / (b.max - b.min);

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

/** The chart's one line: how long it was louder than a conversation, and when. */
function chartLine(d: NightDetails) {
  const loud = loudMinutes(d);
  return loud ? `Louder than a conversation for ${formatDuration(loud)}, mostly between ${busiestWindow(d)}.` : `Quieter than a conversation all night.`;
}

/** Breathing pauses in each hour of the recording. */
function breathingByHour(d: NightDetails) {
  return d.hourly.map((h, i) => ({ label: h.label, minutes: d.breathingEvents.filter((m) => Math.floor(m / 60) === i).length }));
}

function recentLine(d: NightDetails) {
  const t = trend(d.snoringMinutes, d.baseline.snoringMinutes);
  const usual = formatDuration(d.baseline.snoringMinutes);
  return t === 'less' ? `Less snoring than your usual ${usual}.` : t === 'more' ? `More snoring than your usual ${usual}.` : `About your usual ${usual} of snoring.`;
}

// ---------- Sheet contents ----------

function SheetBody({ which, d, marks, player }: { which: Sheet; d: NightDetails; marks: Benchmark[]; player: ClipPlayerState }) {
  const usual = d.baseline;
  switch (which) {
    case 'report':
      return (
        <View style={styles.sheetBody}>
          <AppText color="textMuted">Everything Airese measured last night, and how. Phones differ, so compare nights rather than reading one number on its own.</AppText>
          <Block label="The whole night">
            <SnoringChart d={d} height={240} />
          </Block>
          <Block label="Measures">
            {[
              ['Recorded', formatDuration(d.night.minutes)],
              ['Asleep (estimated)', formatDuration(d.sleepMinutes)],
              ['Snoring', `${formatDuration(d.snoringMinutes)} · ${pct(d.snoringMinutes, d.night.minutes)}%`],
              ['Above 60 dB', formatDuration(loudMinutes(d))],
              ['Average while snoring', `${d.averageDb} dB`],
              ['Loudest', `${d.peakDb} dB`],
              ['Breathing pauses', `${d.breathingEvents.length} · ${mark(marks, 'breathing').value} an hour`],
              ['Coughs', String(d.coughs.length)],
              ['Movements', String(d.movements.length)],
              ['Restless', `${d.awakenings} ${d.awakenings === 1 ? 'time' : 'times'}`],
              ['Sound Score', `${d.soundScore} · loudness ${d.soundParts.loudness} + snoring ${d.soundParts.snoring}`],
            ].map(([what, value]) => (
              <View key={what} style={styles.refRow}>
                <AppText color="text" style={{ flex: 1 }}>
                  {what}
                </AppText>
                <AppText color="textMuted" style={{ textAlign: 'right', flexShrink: 1 }}>
                  {value}
                </AppText>
              </View>
            ))}
          </Block>
          {marks.map((b) => (
            <ScoreCard key={b.key} b={b} />
          ))}
          <Block label="How Airese measures">
            <AppText color="text">{`Your phone’s microphone measures sound level every ${SAMPLE_SECONDS} seconds. Airese recognises snoring, pauses in breathing, coughs and movement from the sound alone, on your phone. A pause is counted when snoring stops for a moment and starts again with a louder breath.`}</AppText>
          </Block>
          <AppText variant="small" color="textMuted">
            Prototype: guide ranges and the Sound Score formula are placeholders for Clinical and Engineering to confirm. Not a diagnosis.
          </AppText>
        </View>
      );
    case 'sound': {
      const sound = mark(marks, 'sound');
      return (
        <View style={styles.sheetBody}>
          <Lead value={`${d.soundScore} out of 100`} note={`${zoneOf(sound).word}. ${sound.guide}.`} />
          <Block label="What it’s made of">
            <Part label="Loudness" value={d.soundParts.loudness} note={`Your snoring averaged ${d.averageDb} dB, peaking at ${d.peakDb} dB.`} />
            <Part label="Snoring" value={d.soundParts.snoring} note={`You snored for ${pct(d.snoringMinutes, d.night.minutes)}% of the night.`} />
          </Block>
          <ScoreCard b={sound} />
          <Plain muted>{EXPLAIN.soundScore.body}</Plain>
        </View>
      );
    }
    case 'snoring':
      return (
        <View style={styles.sheetBody}>
          <Lead value={formatDuration(d.snoringMinutes)} note={`${pct(d.snoringMinutes, d.night.minutes)}% of the recording. ${chartLine(d)}`} />
          <Block label="How loud, through the night">
            <SnoringChart d={d} height={260} />
          </Block>
          <Block label="By hour">
            <HourlyBars hours={d.hourly} />
          </Block>
          <Block label="Snoring intensity">
            <LoudnessBars share={d.intensityShare} />
          </Block>
          <Block label="For reference">
            {[
              ['Whisper', '30 dB'],
              ['Quiet room', '40 dB'],
              ['Conversation', '60 dB'],
              ['Vacuum cleaner', '75 dB'],
            ].map(([what, db]) => (
              <View key={what} style={styles.refRow}>
                <AppText color="text">{what}</AppText>
                <AppText color="textMuted">{db}</AppText>
              </View>
            ))}
          </Block>
          {usual && <Plain>{`Your usual is ${formatDuration(usual.snoringMinutes)}. ${trendWords[trend(d.snoringMinutes, usual.snoringMinutes)]} tonight.`}</Plain>}
          <Plain muted>{`${EXPLAIN.snoring.body} ${EXPLAIN.loudness.body}`}</Plain>
        </View>
      );
    case 'breathing': {
      const b = mark(marks, 'breathing');
      return (
        <View style={styles.sheetBody}>
          <Lead value={`${b.value} an hour`} note={`${d.breathingEvents.length} pauses in ${formatDuration(d.sleepMinutes)} of sleep.`} />
          <ScoreCard b={b} />
          <Block label="By hour">
            <HourlyBars hours={breathingByHour(d)} scale={b.max} what="Breathing pauses" unit="pauses" />
          </Block>
          {usual && <Plain>{`Your usual is ${usual.breathingEvents} a night. ${trendWords[trend(d.breathingEvents.length, usual.breathingEvents)]} tonight.`}</Plain>}
          <Plain muted>{EXPLAIN.breathing.body}</Plain>
        </View>
      );
    }
    case 'sleep':
      return (
        <View style={styles.sheetBody}>
          <Lead value={formatDuration(d.sleepMinutes)} note={`Estimated from ${formatDuration(d.night.minutes)} of recording.`} />
          <Block label="Asleep and restless">
            <AsleepStrip d={d} />
            <AppText variant="small" color="textMuted" style={{ marginTop: space.md }}>
              {`Restless ${d.awakenings} ${d.awakenings === 1 ? 'time' : 'times'}: ${d.awake.map((w) => clockAt(d, w.start)).join(', ')}`}
            </AppText>
          </Block>
          <ScoreCard b={mark(marks, 'sleep')} />
          <Plain muted>{EXPLAIN.sleep.body}</Plain>
        </View>
      );
    case 'clips':
      return (
        <View style={[styles.sheetBody, { gap: space.md }]}>
          <Plain muted>{EXPLAIN.clips.body}</Plain>
          <View style={[styles.block, { marginBottom: space.md }]}>
            <NightTimeline full details={d} clips={d.clips} playing={player.playing} onClip={player.toggle} />
          </View>
          {d.clips.map((c) => (
            <AudioSnippet key={c.id} clip={c} time={clockAt(d, c.at)} player={player} />
          ))}
        </View>
      );
    case 'recent':
      return (
        <View style={styles.sheetBody}>
          {usual && <RecentNightsChart nights={d.recent.map((r) => ({ day: r.day, value: r.snoringMinutes, tonight: r.tonight }))} usual={usual.snoringMinutes} level={scaleAt(mark(marks, 'snoring'))} format={formatDuration} />}
          {usual && (
            <Block label="Tonight compared with your usual">
              <CompareRow label="Snoring" tonight={formatDuration(d.snoringMinutes)} usual={formatDuration(usual.snoringMinutes)} t={trend(d.snoringMinutes, usual.snoringMinutes)} />
              <CompareRow label="Breathing pauses" tonight={String(d.breathingEvents.length)} usual={String(usual.breathingEvents)} t={trend(d.breathingEvents.length, usual.breathingEvents)} />
              <CompareRow label="Loudness" tonight={`${d.averageDb} dB`} usual={`${usual.averageDb} dB`} t={trend(d.averageDb, usual.averageDb)} />
            </Block>
          )}
          <Plain muted>{EXPLAIN.usual.body}</Plain>
        </View>
      );
  }
}

/** One part of the Sound Score: a bar out of 50 (through the loudness ramp, like the score's ring) and what it reflects. */
function Part({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <View style={styles.part} accessible accessibilityLabel={`${label}: ${value} of 50. ${note}`}>
      <View style={styles.partHead}>
        <AppText color="text">{label}</AppText>
        <AppText color="text" style={styles.semibold}>{`${value} of 50`}</AppText>
      </View>
      <View style={styles.partTrack}>
        <View style={{ width: `${(value / 50) * 100}%`, height: '100%', borderRadius: 5, overflow: 'hidden' }}>
          <RampFill direction="right" to={value / 50} />
        </View>
      </View>
      <AppText variant="small" color="textMuted">
        {note}
      </AppText>
    </View>
  );
}

/** One score with its scale (All details). */
function ScoreCard({ b }: { b: Benchmark }) {
  const zone = zoneOf(b);
  const color = dataInk(b.tone, scaleAt(b)); // the colour the score reaches, as on its ring
  return (
    <View style={styles.block}>
      <View style={styles.scoreHead}>
        <AppText color="text" style={{ flex: 1 }}>
          {b.name}
        </AppText>
        <View style={[styles.word, { borderColor: color }]}>
          <AppText variant="small" color="text">
            {zone.word}
          </AppText>
        </View>
      </View>
      <AppText variant="title" color="text" style={{ marginTop: space.sm }}>
        {b.display}
      </AppText>
      <View style={{ marginTop: space.lg }}>
        <BenchmarkScale b={b} color={color} />
      </View>
      <AppText variant="small" color="textMuted" style={{ marginTop: space.md }}>
        {b.usual != null ? `${b.guide}. The thin line is your usual.` : `${b.guide}.`}
      </AppText>
      <AppText variant="small" color="text" style={{ marginTop: space.sm }}>
        {b.explain}
      </AppText>
    </View>
  );
}

function Lead({ value, note }: { value: string; note: string }) {
  return (
    <View>
      <BigNumber value={value} />
      <AppText color="textMuted" style={{ marginTop: space.xs }}>
        {note}
      </AppText>
    </View>
  );
}

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

function Plain({ children, muted }: { children: string; muted?: boolean }) {
  return <AppText color={muted ? 'textMuted' : 'text'}>{children}</AppText>;
}

function CompareRow({ label, tonight, usual, t }: { label: string; tonight: string; usual: string; t: ReturnType<typeof trend> }) {
  return (
    <View style={styles.compareRow}>
      <View style={{ flex: 1 }}>
        <AppText color="text">{label}</AppText>
        <AppText variant="small" color="textMuted">{`${tonight} tonight · ${usual} usual`}</AppText>
      </View>
      <ComparisonIndicator trend={t} words={trendWords[t]} />
    </View>
  );
}

/** Straight after a recording: analysis still running. No empty cards (PRD §16). */
function Processing() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: motion.slow.duration * 1.5, easing: motion.slow.easeInOut, useNativeDriver: motion.useNativeDriver }));
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <View style={styles.processing} accessibilityLiveRegion="polite">
      <AppText variant="heading" color="text" style={{ textAlign: 'center' }}>
        Looking through your night
      </AppText>
      <AppText color="textMuted" style={{ textAlign: 'center', marginTop: space.sm }}>
        Finding the moments worth showing you.
      </AppText>
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

  moment: { marginTop: space.xl, paddingTop: space.xl, borderTopWidth: StyleSheet.hairlineWidth, borderColor: alpha(colors.moon, 0.16) },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.lg },
  stepButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.moon, 0.08) },
  off: { opacity: 0.4 },
  stats: { flexDirection: 'row', gap: space.md },

  // The card's next step: full width, 48 pt. On the urgent (wine) card it's Moon, not Breath: blue on wine clashes.
  listen: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.lg, borderRadius: radius.pill, backgroundColor: colors.accent, marginTop: space.xl },
  listenUrgent: { backgroundColor: colors.text },

  allClips: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, marginLeft: 'auto' },

  strip: { height: 12, justifyContent: 'center' },
  asleep: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: colors.dataSleep },

  sheetBody: { gap: space.xl, paddingTop: space.sm },
  block: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.gutter },
  scoreHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  word: { paddingHorizontal: space.md, minHeight: 28, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1.5 },
  part: { gap: space.sm, paddingVertical: space.sm },
  partHead: { flexDirection: 'row', justifyContent: 'space-between' },
  partTrack: { height: 10, borderRadius: 5, backgroundColor: alpha(colors.mist, 0.1), overflow: 'hidden' },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.sm },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },

  processing: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: space.xxl * 3 },
  progress: { width: 200, height: 4, borderRadius: 2, marginTop: space.xl, overflow: 'hidden', backgroundColor: alpha(colors.mist, 0.15) },
  glint: { width: 80, height: 4, borderRadius: 2, backgroundColor: colors.accent },
});
