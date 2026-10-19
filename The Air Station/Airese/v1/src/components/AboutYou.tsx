import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { countryByCode, flag, MY_STATES } from '../lib/countries';
import {
  ageFrom,
  CM_PER_IN,
  GENDER_LABEL,
  heightLabel,
  KG_PER_LB,
  placeLabel,
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
import { FormDivider, FormGroup, FormInput, FormTitle } from '@ds/components/Form';
import { Icon, type IconName } from '@ds/components/Icon';
import { InfoButton } from '@ds/components/InfoButton';
import { RulerPicker, WheelPicker } from '@ds/components/Pickers';
import { SegmentedControl } from '@ds/components/SegmentedControl';

const ABOUT_WHY = { title: 'Why we ask about you', body: 'It helps a doctor read your report better, if you choose to consult one. All of it is optional.' };

type Fields = Pick<Profile, 'gender' | 'birthYear' | 'heightCm' | 'weightKg' | 'units' | 'city' | 'region' | 'country' | 'phoneCountry'>;
type Sheet = 'gender' | 'age' | 'height' | 'weight' | 'place' | null;

/**
 * "About you": gender, age, height, weight and where you live, as tiles rather than form fields.
 * Each tile opens a small sheet made for that one question (tap, pick, done) and then shows the
 * answer. All optional; (i) says why we ask (a doctor reads the report better with them).
 * Used in onboarding (DetailsScreen) and Profile → Your details.
 */
export function AboutYou({ value, onChange }: { value: Fields; onChange: (next: Partial<Profile>) => void }) {
  const [open, setOpen] = useState<Sheet>(null);
  const [why, setWhy] = useState(false);
  const close = () => setOpen(null);
  const age = ageFrom(value.birthYear);
  const place = placeLabel(value);

  return (
    <View>
      <FormTitle title="About you (optional)" action={<InfoButton size={24} onPress={() => setWhy(true)} label="Why we ask about you" />} />
      <View style={styles.grid}>
        <Tile icon="person" label="Gender" value={value.gender ? GENDER_LABEL[value.gender] : ''} onPress={() => setOpen('gender')} />
        <Tile icon="cake" label="Age" value={age != null ? `${age}` : ''} onPress={() => setOpen('age')} a11yValue={age != null ? `${age} years, born ${value.birthYear}` : undefined} />
        <Tile icon="height" label="Height" value={heightLabel(value.heightCm, value.units)} onPress={() => setOpen('height')} />
        <Tile icon="monitor_weight" label="Weight" value={weightLabel(value.weightKg, value.units)} onPress={() => setOpen('weight')} />
        <Tile icon="location_on" label="Where you live" value={place} onPress={() => setOpen('place')} wide />
      </View>
      <ExplainSheet content={why ? ABOUT_WHY : null} onClose={() => setWhy(false)} />

      <GenderSheet visible={open === 'gender'} value={value.gender} onClose={close} onPick={(gender) => (onChange({ gender }), close())} />
      <AgeSheet visible={open === 'age'} birthYear={value.birthYear} onClose={close} onDone={(birthYear) => (onChange({ birthYear }), close())} />
      <MeasureSheet kind="height" visible={open === 'height'} metric={value.heightCm} units={value.units} onUnits={(units) => onChange({ units })} onClose={close} onDone={(heightCm) => (onChange({ heightCm }), close())} />
      <MeasureSheet kind="weight" visible={open === 'weight'} metric={value.weightKg} units={value.units} onUnits={(units) => onChange({ units })} onClose={close} onDone={(weightKg) => (onChange({ weightKg }), close())} />
      <PlaceSheet visible={open === 'place'} value={value} onClose={close} onDone={(p) => (onChange(p), close())} />
    </View>
  );
}

function Tile({ icon, label, value, onPress, wide, a11yValue }: { icon: IconName; label: string; value: string; onPress: () => void; wide?: boolean; a11yValue?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${a11yValue ?? (value || 'not added')}`}
      accessibilityHint={value ? 'Change' : 'Add'}
      style={({ pressed }) => [styles.tile, wide && styles.tileWide, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.badge}>
        <Icon name={icon} size={22} color="accent" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="small" color="textMuted" numberOfLines={1}>
          {label}
        </AppText>
        <AppText color={value ? 'text' : 'accent'} numberOfLines={wide ? 2 : 1}>
          {value || 'Add'}
        </AppText>
      </View>
      {wide && <Icon name="chevron_right" size={24} color="textMuted" />}
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

// ---------- Age (year of birth) ----------

const THIS_YEAR = new Date().getFullYear();
const YEAR_MIN = 1920;
const YEAR_MAX = THIS_YEAR - 13; // Airese is for adults and older teens
const YEAR_START = THIS_YEAR - 40; // where the wheel starts before there's an answer

function AgeSheet({ visible, birthYear, onDone, onClose }: { visible: boolean; birthYear: string; onDone: (y: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(Number(birthYear) || YEAR_START);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(Number(birthYear) || YEAR_START);
  }
  return (
    <BottomSheet visible={visible} onClose={onClose} dragFrom="top" fit>
      <SheetHead title="When were you born?" why="Sleep and breathing change with age." />
      <WheelPicker min={YEAR_MIN} max={YEAR_MAX} value={draft} onChange={setDraft} label="Year of birth" />
      <AppText color="textMuted" style={{ textAlign: 'center', marginTop: space.md }} accessibilityLiveRegion="polite">
        {THIS_YEAR - draft} years old
      </AppText>
      <SheetActions onDone={() => onDone(String(draft))} onClear={birthYear ? () => onDone('') : undefined} />
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

type Place = Pick<Profile, 'city' | 'region' | 'country'>;
type Step = 'country' | 'malaysia' | 'other';

/**
 * Singapore is one tap (it's a city-state). Malaysia: pick the state, type the town or city.
 * Anywhere else: type it. Before there's an answer, the phone's country is suggested first.
 */
function PlaceSheet({ visible, value, onDone, onClose }: { visible: boolean; value: Fields; onDone: (p: Place) => void; onClose: () => void }) {
  const [step, setStep] = useState<Step>('country');
  const [draft, setDraft] = useState<Place>(value);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraft({ city: value.city, region: value.region, country: value.country });
      setStep('country');
    }
  }
  const suggested = value.country || countryByCode(value.phoneCountry)?.name || '';

  const option = (key: 'Singapore' | 'Malaysia' | 'other', label: string, lead: React.ReactNode, onPress: () => void) => {
    const on = key === 'other' ? !!suggested && suggested !== 'Singapore' && suggested !== 'Malaysia' : suggested === key;
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
            {option('Singapore', 'Singapore', <AppText style={styles.flag}>{flag('SG')}</AppText>, () => onDone({ country: 'Singapore', region: '', city: '' }))}
            {option('Malaysia', 'Malaysia', <AppText style={styles.flag}>{flag('MY')}</AppText>, () => {
              if (draft.country !== 'Malaysia') setDraft({ country: 'Malaysia', region: '', city: '' });
              setStep('malaysia');
            })}
            {option('other', 'Somewhere else', <Icon name="public" size={26} color="accent" />, () => {
              if (draft.country === 'Singapore' || draft.country === 'Malaysia') setDraft({ country: '', region: '', city: '' });
              setStep('other');
            })}
          </View>
          {value.country ? <Button label="Clear" variant="quiet" onPress={() => onDone({ country: '', region: '', city: '' })} style={{ marginTop: space.lg }} /> : null}
        </>
      )}

      {step === 'malaysia' && (
        <>
          <BackLink onPress={() => setStep('country')} />
          <SheetHead title="Which state?" why="And your town or city, if you like." />
          <View style={styles.states} accessibilityRole="radiogroup" accessibilityLabel="State">
            {MY_STATES.map((s) => {
              const on = draft.region === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setDraft((d) => ({ ...d, region: s }))}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={s}
                  style={({ pressed }) => [styles.state, on && styles.stateOn, pressed && { opacity: 0.8 }]}
                >
                  <AppText variant="small" color={on ? 'onAccent' : 'text'}>
                    {s}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <FormGroup title="Town or city" onSheet style={{ marginTop: space.xl }}>
            <FormInput
              placeholder="e.g. Petaling Jaya"
              accessibilityLabel="Town or city"
              value={draft.city}
              onChangeText={(city) => setDraft((d) => ({ ...d, city }))}
              autoCapitalize="words"
              autoComplete="postal-address-locality"
              textContentType="addressCity"
              returnKeyType="done"
            />
          </FormGroup>
          <SheetActions onDone={() => onDone({ ...draft, country: 'Malaysia', city: draft.city.trim() })} />
        </>
      )}

      {step === 'other' && (
        <>
          <BackLink onPress={() => setStep('country')} />
          <SheetHead title="Where do you live?" why="Type as much as you like." />
          <FormGroup title="Place" onSheet>
            <FormInput
              placeholder="Town or city"
              value={draft.city}
              onChangeText={(city) => setDraft((d) => ({ ...d, city }))}
              autoCapitalize="words"
              autoComplete="postal-address-locality"
              textContentType="addressCity"
            />
            <FormDivider />
            <FormInput
              placeholder="State or region"
              value={draft.region}
              onChangeText={(region) => setDraft((d) => ({ ...d, region }))}
              autoCapitalize="words"
              autoComplete="postal-address-region"
              textContentType="addressState"
            />
            <FormDivider />
            <FormInput
              placeholder="Country"
              value={draft.country}
              onChangeText={(country) => setDraft((d) => ({ ...d, country }))}
              autoCapitalize="words"
              autoComplete="country"
              textContentType="countryName"
              returnKeyType="done"
            />
          </FormGroup>
          <SheetActions onDone={() => onDone({ city: draft.city.trim(), region: draft.region.trim(), country: draft.country.trim() })} />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  tileWide: { flexBasis: '100%' },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tintAccent },

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
  states: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  state: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.background },
  stateOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, marginTop: -space.md, marginLeft: -space.xs, marginBottom: space.xs },
});
