import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { dayKey, type CalendarNight } from '../lib/reports';
import { colors, loudnessRamp, radius, space } from '@ds/theme';
import { AppText } from '@ds/components/AppText';
import { Icon } from '@ds/components/Icon';
import { ScoreRing } from '@ds/components/ScoreRing';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const RING = 40;
const CELL = 48;
const DOT = 6;

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();

/**
 * A month of nights, the standard way: month and year on top with ‹ › to step through months, and
 * tap the month name for a month-and-year grid to jump further. Weeks start on Sunday.
 * Each recorded night has a ring for its Sound Score (fuller is louder, through the loudness ramp);
 * a dashed ring where Airese couldn't hear clearly; no ring where nothing was recorded.
 * A small Moon dot by the ring: the night's Sleep Diary was filled in.
 * Only recorded nights can be picked; days still to come are dimmed. Months run from the first
 * recording to this month. Today's date is in Breath.
 */
export function MonthCalendar({
  nights,
  selected,
  onPick,
  first,
  diary,
  today = new Date(),
}: {
  nights: Map<string, CalendarNight>;
  /** The night on show (its id). */
  selected?: string;
  onPick: (n: CalendarNight) => void;
  /** The earliest month to allow (the first recording). */
  first: Date;
  /** Nights (ids) with something in their Sleep Diary. */
  diary?: Set<string>;
  today?: Date;
}) {
  const sel = selected ? nights.get(selected)?.night.date : undefined;
  const [month, setMonth] = useState(() => startOfMonth(sel ?? today));
  const [view, setView] = useState<'days' | 'months'>('days');
  const [year, setYear] = useState(month.getFullYear());
  const min = monthIndex(first);
  const max = monthIndex(today);
  const at = monthIndex(month);

  const step = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));

  return (
    <View>
      {/* Header: month and year (tap for the month grid), ‹ › */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            setYear(month.getFullYear());
            setView(view === 'days' ? 'months' : 'days');
          }}
          accessibilityRole="button"
          accessibilityLabel={view === 'days' ? `${MONTHS[month.getMonth()]} ${month.getFullYear()}. Choose month and year` : 'Back to days'}
          style={({ pressed }) => [styles.title, pressed && { opacity: 0.8 }]}
        >
          <AppText variant="heading">{view === 'days' ? `${MONTHS[month.getMonth()]} ${month.getFullYear()}` : `${year}`}</AppText>
          <Icon name={view === 'days' ? 'keyboard_arrow_down' : 'close'} size={view === 'days' ? 24 : 20} color="accent" />
        </Pressable>
        <View style={styles.arrows}>
          {view === 'days' ? (
            <>
              <Arrow dir="prev" label="Previous month" disabled={at <= min} onPress={() => step(-1)} />
              <Arrow dir="next" label="Next month" disabled={at >= max} onPress={() => step(1)} />
            </>
          ) : (
            <>
              <Arrow dir="prev" label="Previous year" disabled={year * 12 + 11 < min} onPress={() => setYear(year - 1)} />
              <Arrow dir="next" label="Next year" disabled={(year + 1) * 12 > max} onPress={() => setYear(year + 1)} />
            </>
          )}
        </View>
      </View>

      {view === 'days' ? (
        <Days month={month} nights={nights} selected={selected} onPick={onPick} today={today} diary={diary} />
      ) : (
        <View style={styles.months} accessibilityRole="radiogroup" accessibilityLabel={`Months of ${year}`}>
          {MONTHS.map((name, i) => {
            const idx = year * 12 + i;
            const disabled = idx < min || idx > max;
            const on = idx === at;
            return (
              <Pressable
                key={name}
                disabled={disabled}
                onPress={() => {
                  setMonth(new Date(year, i, 1));
                  setView('days');
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: on, disabled }}
                accessibilityLabel={`${name} ${year}`}
                style={({ pressed }) => [styles.month, on && styles.monthOn, pressed && { opacity: 0.8 }]}
              >
                <AppText color={on ? 'onAccent' : disabled ? 'textMuted' : 'text'} style={disabled ? { opacity: 0.5 } : undefined}>
                  {name.slice(0, 3)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function Days({ month, nights, selected, onPick, today, diary }: { month: Date; nights: Map<string, CalendarNight>; selected?: string; onPick: (n: CalendarNight) => void; today: Date; diary?: Set<string> }) {
  const lead = month.getDay(); // blank cells before the 1st (weeks start on Sunday)
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const todayKey = dayKey(today);

  return (
    <View>
      <View style={styles.week} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {WEEKDAYS.map((d, i) => (
          <AppText key={i} variant="small" color="textMuted" style={styles.weekday}>
            {d}
          </AppText>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day == null) return <View key={`b${i}`} style={styles.cell} />;
          const date = new Date(month.getFullYear(), month.getMonth(), day);
          const key = dayKey(date);
          const n = nights.get(key);
          const on = key === selected;
          const isToday = key === todayKey;
          const noted = !!n && !!diary?.has(n.night.id);
          const future = date > today && !isToday;
          const label = `${WEEKDAYS_LONG[date.getDay()]} ${day} ${MONTHS[month.getMonth()]}${
            n ? (n.score == null ? ', recorded, couldn’t hear clearly' : `, Sound Score ${n.score}`) : ', no recording'
          }${noted ? ', Sleep Diary filled in' : ''}${isToday ? ', today' : ''}`;
          return (
            <Pressable
              key={key}
              disabled={!n}
              onPress={() => n && onPick(n)}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: on, disabled: !n }}
              style={({ pressed }) => [styles.cell, pressed && { opacity: 0.8 }]}
            >
              {n ? (
                n.score == null ? (
                  <Svg width={RING} height={RING} style={styles.ring as object}>
                    <Circle cx={RING / 2} cy={RING / 2} r={RING / 2 - 1.5} stroke={colors.textMuted} strokeWidth={1.5} strokeDasharray="3 4" fill="none" />
                  </Svg>
                ) : (
                  <View style={styles.ring}>
                    <ScoreRing fraction={n.score / 100} color={colors.dataSnoring} ramp={loudnessRamp} size={RING} stroke={3} />
                  </View>
                )
              ) : null}
              {noted && <View style={styles.dot} />}
              <View style={[styles.dayInner, on && styles.dayOn]}>
                <AppText color={on ? 'onAccent' : isToday ? 'accent' : n ? 'text' : 'textMuted'} style={future ? { opacity: 0.5 } : undefined}>
                  {day}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Arrow({ dir, label, disabled, onPress }: { dir: 'prev' | 'next'; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.arrow, { opacity: disabled ? 0.35 : pressed ? 0.8 : 1 }]}
    >
      <Icon name={dir === 'prev' ? 'chevron_left' : 'chevron_right'} size={28} color="accent" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  title: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 44 },
  arrows: { flexDirection: 'row', gap: space.xs },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row', marginBottom: space.xs },
  weekday: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  // Each day: a seventh of the width, 48 tall (past the 44 pt target); ring 40 inside it
  cell: { width: `${100 / 7}%`, height: CELL, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: RING, height: RING }, // centred by the cell (no offsets)
  dayInner: { width: RING - 8, height: RING - 8, borderRadius: (RING - 8) / 2, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: colors.accent },
  // Sleep Diary filled in: just outside the ring's top right
  dot: { position: 'absolute', top: (CELL - RING) / 2 - 1, width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.moon, transform: [{ translateX: RING / 2 }] },
  months: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.sm },
  month: { width: '33.33%', minHeight: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  monthOn: { backgroundColor: colors.accent },
});

