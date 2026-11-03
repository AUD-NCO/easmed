import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { countryByCode, flag } from '../lib/countries';
import {
  ageFrom,
  birthDateLabel,
  CM_PER_IN,
  daysIn,
  GENDER_LABEL,
  heightLabel,
  KG_PER_LB,
  MONTHS,
  parseDate,
  placeLabel,
  toDate,
  weightLabel,
  type Gender,
  type Profile,
  type Units,
} from '../lib/profile';
import { colors, radius, space, type } from '@ds/theme';
import { AppText } from '@ds/components/AppText';
import { BottomSheet } from '@ds/components/BottomSheet';
import { Button } from '@ds/components/Button';
import { ExplainSheet } from '@ds/components/ExplainSheet';
import { FormDivider, FormGroup, FormInput } from '@ds/components/Form';
import { Icon, type IconName } from '@ds/components/Icon';
import { InfoButton } from '@ds/components/InfoButton';
import { ROW, RulerPicker, VISIBLE, WheelPicker } from '@ds/components/Pickers';
import { SegmentedControl } from '@ds/components/SegmentedControl';

/** The (i) beside About you, in onboarding and Profile. */
export const ABOUT_WHY = { title: 'Why we ask', body: 'This helps us understand your nights, and helps a doctor read your report if you share it.' };

type Fields = Pick<Profile, 'gender' | 'birthDate' | 'heightCm' | 'weightKg' | 'units' | 'city' | 'region' | 'country' | 'postcode' | 'phoneCountry'>;
type Sheet = 'gender' | 'age' | 'height' | 'weight' | 'place' | null;
export type AboutKey = Exclude<Sheet, null>;

const ABOUT_LABEL: Record<AboutKey, string> = { gender: 'gender', age: 'date of birth', height: 'height', weight: 'weight', place: 'where you live' };

/** The questions still unanswered, in tile order. "Prefer not to say" counts as an answer. */
export function missingAbout(v: Fields): AboutKey[] {
  const answered: Record<AboutKey, boolean> = { gender: !!v.gender, age: !!v.birthDate, height: !!v.heightCm, weight: !!v.weightKg, place: !!v.country };
  return (Object.keys(answered) as AboutKey[]).filter((k) => !answered[k]);
}

/** "Add your age." / "Add your age and weight." / "Add your gender, age and where you live." */
export function missingAboutMessage(keys: AboutKey[]) {
  const names = keys.map((k) => ABOUT_LABEL[k]);
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  return `Add your ${list}.`;
}

/**
 * "About you": gender, age, height, weight and where you live, as a list to fill in one by one
 * (label on the left, the answer or "Add" on the right, a chevron). Each row opens a small sheet made
 * for that one question (tap, pick, done) and then shows the answer.
 * All required. Onboarding (AboutYouScreen): the page has its own heading and (i) (heading={false}).
 * Profile → Your details: the group's own title and (i). Either way the screen passes `missing` and
 * `error` once Begin or Save is tapped with gaps.
 */
export function AboutYou({ value, onChange, heading = true, missing = [], error }: { value: Fields; onChange: (next: Partial<Profile>) => void; heading?: boolean; missing?: AboutKey[]; error?: string }) {
  const [open, setOpen] = useState<Sheet>(null);
  const [why, setWhy] = useState(false);
  const close = () => setOpen(null);
  const age = ageFrom(value.birthDate);

  return (
    <View>
      <FormGroup
        title={heading ? 'About you' : ''}
        titleAction={heading ? <InfoButton size={24} onPress={() => setWhy(true)} label="Why we ask about you" /> : undefined}
        error={error}
      >
        <Row icon="person" label="Gender" value={value.gender ? GENDER_LABEL[value.gender] : ''} onPress={() => setOpen('gender')} missing={missing.includes('gender')} />
        <FormDivider />
        <Row
          icon="cake"
          label="Date of birth"
          value={birthDateLabel(value.birthDate)}
          onPress={() => setOpen('age')}
          a11yValue={age != null ? `${birthDateLabel(value.birthDate, true)}, ${age} years old` : undefined}
          missing={missing.includes('age')}
        />
        <FormDivider />
        <Row icon="height" label="Height" value={heightLabel(value.heightCm, value.units)} onPress={() => setOpen('height')} missing={missing.includes('height')} />
        <FormDivider />
        <Row icon="monitor_weight" label="Weight" value={weightLabel(value.weightKg, value.units)} onPress={() => setOpen('weight')} missing={missing.includes('weight')} />
        <FormDivider />
        <Row icon="location_on" label="Where you live" value={placeLabel(value)} onPress={() => setOpen('place')} missing={missing.includes('place')} />
      </FormGroup>
      <ExplainSheet content={why ? ABOUT_WHY : null} onClose={() => setWhy(false)} />

      <GenderSheet visible={open === 'gender'} value={value.gender} onClose={close} onPick={(gender) => (onChange({ gender }), close())} />
      <DateOfBirthSheet visible={open === 'age'} birthDate={value.birthDate} onClose={close} onDone={(birthDate) => (onChange({ birthDate }), close())} />
      <MeasureSheet kind="height" visible={open === 'height'} metric={value.heightCm} units={value.units} onUnits={(units) => onChange({ units })} onClose={close} onDone={(heightCm) => (onChange({ heightCm }), close())} />
      <MeasureSheet kind="weight" visible={open === 'weight'} metric={value.weightKg} units={value.units} onUnits={(units) => onChange({ units })} onClose={close} onDone={(weightKg) => (onChange({ weightKg }), close())} />
      <PlaceSheet visible={open === 'place'} value={value} onClose={close} onDone={(p) => (onChange(p), close())} />
    </View>
  );
}

/** One question: icon and label, then the answer (or "Add", in error red while it's missing) and a chevron. */
function Row({ icon, label, value, onPress, a11yValue, missing }: { icon: IconName; label: string; value: string; onPress: () => void; a11yValue?: string; missing?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${a11yValue ?? (value || 'not added')}`}
      accessibilityHint={value ? 'Change' : 'Add'}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Icon name={icon} size={24} color="text" />
      <AppText style={{ flex: 1 }}>{label}</AppText>
      <AppText color={value ? 'textMuted' : missing ? 'error' : 'accent'} numberOfLines={1} style={styles.value}>
        {value || 'Add'}
      </AppText>
      <Icon name="chevron_right" size={22} color="textMuted" />
    </Pressable>
  );
}

/** Sheet title, with an optional plain line under it saying why we ask. */
function SheetHead({ title, why }: { title: string; why?: string }) {
  return (
    <View style={{ marginBottom: space.xl }}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {why ? (
        <AppText color="textMuted" style={{ marginTop: space.xs }}>
          {why}
        </AppText>
      ) : null}
    </View>
  );
}

/** The sheet's own buttons: Done, and Clear once there's an answer to take back. */
function SheetActions({ onDone, onClear }: { onDone: () => void; onClear?: () => void }) {
  return (
    <View style={{ marginTop: space.xl }}>
      <Button label="Done" onPress={onDone} />
      {onClear ? <Button label="Clear" variant="quiet" onPress={onClear} style={{ marginTop: space.sm }} /> : null}
    </View>
  );
}

// ---------- Gender ----------

const GENDERS: { key: Exclude<Gender, 'unsaid'>; icon: IconName }[] = [
  { key: 'male', icon: 'male' },
  { key: 'female', icon: 'female' },
  { key: 'transgender', icon: 'transgender' },
];

function GenderSheet({ visible, value, onPick, onClose }: { visible: boolean; value: Profile['gender']; onPick: (g: Profile['gender']) => void; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} fit>
      <SheetHead title="Gender" />
      <View style={styles.genders} accessibilityRole="radiogroup" accessibilityLabel="Gender">
        {GENDERS.map((g) => {
          const on = value === g.key;
          return (
            <Pressable
              key={g.key}
              onPress={() => onPick(g.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={GENDER_LABEL[g.key]}
              style={({ pressed }) => [styles.gender, on && styles.genderOn, pressed && { opacity: 0.8 }]}
            >
              <Icon name={g.icon} size={40} color={on ? 'accent' : 'text'} />
              <AppText variant="small" color="text" style={{ textAlign: 'center' }}>
                {GENDER_LABEL[g.key]}
              </AppText>
              {on && (
                <View style={styles.genderCheck}>
                  <Icon name="check" size={16} color="onAccent" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={() => onPick('unsaid')}
        accessibilityRole="radio"
        accessibilityState={{ selected: value === 'unsaid' }}
        accessibilityLabel={GENDER_LABEL.unsaid}
        style={({ pressed }) => [styles.unsaid, pressed && { opacity: 0.8 }]}
      >
        {value === 'unsaid' && <Icon name="check" size={20} color="accent" />}
        <AppText color={value === 'unsaid' ? 'accent' : 'text'}>{GENDER_LABEL.unsaid}</AppText>
      </Pressable>
      {value && value !== 'unsaid' ? <Button label="Clear" variant="quiet" onPress={() => onPick('')} /> : null}
    </BottomSheet>
  );
}

// ---------- Date of birth ----------

const THIS_YEAR = new Date().getFullYear();
const YEAR_MIN = 1920;
const YEAR_MAX = THIS_YEAR - 13; // Airese is for adults and older teens
const START = { year: THIS_YEAR - 40, month: 1, day: 1 }; // where the wheels start before there's an answer

/**
 * Day, month and year on three wheels in one sheet (the iOS date picker), in the order dates are
 * written in Singapore and Malaysia. Same taps as a single wheel: open, scroll, Done. Months are
 * named so 03/04 can't be misread. A day past the month's end (31 → February) comes back to the last day.
 */
function DateOfBirthSheet({ visible, birthDate, onDone, onClose }: { visible: boolean; birthDate: string; onDone: (d: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(parseDate(birthDate) ?? START);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(parseDate(birthDate) ?? START);
  }
  const lastDay = daysIn(draft.year, draft.month);
  const change = (next: Partial<typeof draft>) =>
    setDraft((d) => {
      const n = { ...d, ...next };
      return { ...n, day: Math.min(n.day, daysIn(n.year, n.month)) };
    });
  const iso = toDate(draft.year, draft.month, draft.day);

  return (
    <BottomSheet visible={visible} onClose={onClose} dragFrom="top" fit>
      <SheetHead title="When were you born?" why="Sleep and breathing change with age." />
      <View style={styles.dateWheels}>
        <View style={styles.dateBand} pointerEvents="none" />
        {/* keyed by the month's length so the wheel redraws at the clamped day */}
        <View key={lastDay} style={{ flex: 2 }}>
          <WheelPicker band={false} min={1} max={lastDay} value={draft.day} onChange={(day) => change({ day })} label="Day" />
        </View>
        <View style={{ flex: 4 }}>
          <WheelPicker band={false} min={1} max={12} value={draft.month} onChange={(month) => change({ month })} label="Month" format={(m) => MONTHS[m - 1]} />
        </View>
        <View style={{ flex: 3 }}>
          <WheelPicker band={false} min={YEAR_MIN} max={YEAR_MAX} value={draft.year} onChange={(year) => change({ year })} label="Year" />
        </View>
      </View>
      <AppText color="textMuted" style={{ textAlign: 'center', marginTop: space.md }} accessibilityLiveRegion="polite">
        {ageFrom(iso)} years old
      </AppText>
      <SheetActions onDone={() => onDone(iso)} onClear={birthDate ? () => onDone('') : undefined} />
    </BottomSheet>
  );
}

// ---------- Height and weight ----------

const MEASURE = {
  height: {
    title: 'How tall are you?',
    label: 'Height',
    why: 'With your weight, this gives your BMI. It helps us find insights relevant to you.',
    start: 165, // cm
    metric: { min: 100, max: 230, unit: 'cm', segment: 'cm' },
    imperial: { min: 39, max: 90, unit: undefined, segment: 'ft / in' }, // inches
    toImperial: (cm: number) => cm / CM_PER_IN,
    toMetric: (inches: number) => inches * CM_PER_IN,
    display: (inches: number) => `${Math.floor(inches / 12)}′ ${inches % 12}″`,
  },
  weight: {
    title: 'How much do you weigh?',
    label: 'Weight',
    why: 'With your height, this gives your BMI. It helps us find insights relevant to you.',
    start: 65, // kg
    metric: { min: 30, max: 200, unit: 'kg', segment: 'kg' },
    imperial: { min: 66, max: 440, unit: 'lb', segment: 'lb' },
    toImperial: (kg: number) => kg / KG_PER_LB,
    toMetric: (lb: number) => lb * KG_PER_LB,
    display: undefined,
  },
} as const;

/** Height or weight on a ruler. Always kept in metric; the units switch only changes what's shown. */
function MeasureSheet({
  kind,
  visible,
  metric,
  units,
  onUnits,
  onDone,
  onClose,
}: {
  kind: 'height' | 'weight';
  visible: boolean;
  metric: string;
  units: Units;
  onUnits: (u: Units) => void;
  onDone: (metric: string) => void;
  onClose: () => void;
}) {
  const m = MEASURE[kind];
  const [draft, setDraft] = useState(Number(metric) || m.start);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(Number(metric) || m.start);
  }
  const range = m[units];
  const shown = Math.round(units === 'metric' ? draft : m.toImperial(draft));

  return (
    <BottomSheet visible={visible} onClose={onClose} dragFrom="top" fit>
      <SheetHead title={m.title} why={m.why} />
      <SegmentedControl
        label="Units"
        segments={[
          { key: 'metric', label: m.metric.segment },
          { key: 'imperial', label: m.imperial.segment },
        ]}
        selected={units}
        onSelect={(k) => onUnits(k as Units)}
      />
      <View style={{ marginTop: space.xl }}>
        <RulerPicker
          min={range.min}
          max={range.max}
          value={Math.min(range.max, Math.max(range.min, shown))}
          onChange={(v) => setDraft(units === 'metric' ? v : Math.round(m.toMetric(v) * 10) / 10)}
          label={m.label}
          unit={range.unit}
          display={units === 'imperial' ? m.display : undefined}
          editable={!(units === 'imperial' && kind === 'height')}
        />
      </View>
      <SheetActions onDone={() => onDone(String(draft))} onClear={metric ? () => onDone('') : undefined} />
    </BottomSheet>
  );
}

// ---------- Where you live ----------

type Place = Pick<Profile, 'city' | 'region' | 'country' | 'postcode'>;
type Step = 'country' | 'malaysia';

/** The ten places most people in Malaysia will pick. Anywhere else is a postcode. */
const MY_PLACES = ['Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Subang Jaya', 'Klang', 'Johor Bahru', 'Penang', 'Ipoh', 'Kota Kinabalu', 'Kuching'];

/**
 * Singapore is one tap (it's a city-state). Malaysia: pick one of the ten popular places, or enter the
 * 5-digit postcode if it's somewhere else. Picking a place clears the postcode, and typing clears the place.
 * V1 is for Singapore and Malaysia only (no "Somewhere else" country for now). Before there's an answer,
 * the phone's country is suggested first.
 */
function PlaceSheet({ visible, value, onDone, onClose }: { visible: boolean; value: Fields; onDone: (p: Place) => void; onClose: () => void }) {
  const [step, setStep] = useState<Step>('country');
  const [city, setCity] = useState(value.city);
  const [postcode, setPostcode] = useState(value.postcode);
  const [error, setError] = useState('');
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setCity(value.country === 'Malaysia' ? value.city : '');
      setPostcode(value.country === 'Malaysia' ? value.postcode : '');
      setError('');
      setStep('country');
    }
  }
  const NONE: Place = { country: '', region: '', city: '', postcode: '' };
  const suggested = value.country || countryByCode(value.phoneCountry)?.name || '';

  const option = (key: 'Singapore' | 'Malaysia', label: string, lead: React.ReactNode, onPress: () => void) => {
    const on = suggested === key;
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.placeOption, on && styles.placeOptionOn, pressed && { opacity: 0.8 }]}
      >
        {lead}
        <AppText style={{ flex: 1 }}>{label}</AppText>
        <Icon name="chevron_right" size={24} color="textMuted" />
      </Pressable>
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} dragFrom="top" fit>
      {step === 'country' && (
        <>
          <SheetHead title="Where do you live?" why="So the sleep care team can suggest a centre near you." />
          <View style={{ gap: space.sm }}>
            {option('Singapore', 'Singapore', <AppText style={styles.flag}>{flag('SG')}</AppText>, () => onDone({ ...NONE, country: 'Singapore' }))}
            {option('Malaysia', 'Malaysia', <AppText style={styles.flag}>{flag('MY')}</AppText>, () => setStep('malaysia'))}
          </View>
          {value.country ? <Button label="Clear" variant="quiet" onPress={() => onDone(NONE)} style={{ marginTop: space.lg }} /> : null}
        </>
      )}

      {step === 'malaysia' && (
        <>
          <BackLink onPress={() => setStep('country')} />
          <SheetHead title="Where in Malaysia?" why="Pick the closest, or enter your postcode." />
          <View style={styles.places} accessibilityRole="radiogroup" accessibilityLabel="Place in Malaysia">
            {MY_PLACES.map((p) => {
              const on = city === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    setCity(p);
                    setPostcode('');
                    setError('');
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={p}
                  style={({ pressed }) => [styles.place, on && styles.placeOn, pressed && { opacity: 0.8 }]}
                >
                  <AppText variant="small" color={on ? 'onAccent' : 'text'}>
                    {p}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <FormGroup title="Somewhere else? Enter postcode" onSheet error={error} style={{ marginTop: space.xl }}>
            <FormInput
              placeholder="e.g. 47400"
              accessibilityLabel="Postcode"
              value={postcode}
              onChangeText={(t) => {
                setPostcode(t.replace(/\D/g, '').slice(0, 5));
                setCity('');
                setError('');
              }}
              keyboardType="number-pad"
              maxLength={5}
              autoComplete="postal-code"
              textContentType="postalCode"
              returnKeyType="done"
            />
          </FormGroup>
          <SheetActions
            onDone={() => {
              if (city) onDone({ ...NONE, country: 'Malaysia', city });
              else if (postcode.length === 5) onDone({ ...NONE, country: 'Malaysia', postcode });
              else setError(postcode ? 'Enter your 5-digit postcode.' : 'Pick a place or enter your postcode.');
            }}
          />
        </>
      )}
    </BottomSheet>
  );
}

function BackLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Back to countries" hitSlop={8} style={styles.back}>
      <Icon name="chevron_left" size={24} color="accent" />
      <AppText color="accent">Countries</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  value: { maxWidth: '55%', textAlign: 'right' },

  genders: { flexDirection: 'row', gap: space.sm },
  gender: {
    flex: 1,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.lg,
    paddingHorizontal: space.xs,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.divider,
    backgroundColor: colors.background,
  },
  genderOn: { borderColor: colors.accent, backgroundColor: colors.tintAccent },
  unsaid: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, marginTop: space.md },
  genderCheck: { position: 'absolute', top: space.sm, right: space.sm, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },

  placeOption: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.background,
  },
  placeOptionOn: { borderColor: colors.accent },
  flag: { fontSize: type.headline.fontSize, lineHeight: type.headline.lineHeight }, // emoji flag, sized from the type scale
  places: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  place: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.background },
  placeOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  dateWheels: { flexDirection: 'row' },
  dateBand: { position: 'absolute', left: 0, right: 0, top: ROW * Math.floor(VISIBLE / 2), height: ROW, borderRadius: radius.md, backgroundColor: colors.background },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, marginTop: -space.md, marginLeft: -space.xs, marginBottom: space.xs },
});
