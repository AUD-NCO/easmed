import React, { forwardRef, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions, type TextInputProps } from 'react-native';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { COUNTRIES, LAUNCH_COUNTRIES, countryByCode, dialCode, flag, type Country } from '../lib/countries';
import { formatPhone } from '../lib/profile';
import { colors, radius, space, type } from '@ds/theme';
import { AppText } from '@ds/components/AppText';
import { BottomSheet } from '@ds/components/BottomSheet';
import { FormInput } from '@ds/components/Form';
import { Icon } from '@ds/components/Icon';

/** What (i) on the phone group says. */
export const PHONE_WHY = { title: 'Why we ask for your phone number', body: 'So the sleep care team can call you, when you ask them to. It stays on this phone until then.' };

type Props = Omit<TextInputProps, 'style' | 'value' | 'onChangeText' | 'onChange'> & {
  country: CountryCode;
  /** National number, digits only. */
  digits: string;
  onChange: (country: CountryCode, digits: string) => void;
};

/**
 * Phone number, the way most apps do it: a flag and country code chip, then the number, formatted as
 * you type ("9123 4567" for Singapore, "12-345 6789" for Malaysia). Tap the chip to pick another
 * country; Singapore and Malaysia are pinned at the top. Pasting a full "+60…" number picks the
 * country for you. Sits inside a FormGroup like any other FormInput.
 */
export const PhoneField = forwardRef<TextInput, Props>(function PhoneField({ country, digits, onChange, ...input }, ref) {
  const [picking, setPicking] = useState(false);
  const shown = formatPhone(digits, country);

  const onChangeText = (text: string) => {
    // A full international number (pasted, or autofilled from the contact card): take its country too.
    if (text.trim().startsWith('+')) {
      const parsed = parsePhoneNumberFromString(text);
      if (parsed?.country && countryByCode(parsed.country)) return onChange(parsed.country, String(parsed.nationalNumber));
    }
    let next = text.replace(/\D/g, '').slice(0, 15);
    // Deleting a space or dash leaves the digits as they were: take the digit before it instead.
    if (next === digits && text.length < shown.length) next = next.slice(0, -1);
    onChange(country, next);
  };

  return (
    <>
      <FormInput
        ref={ref}
        {...input}
        value={shown}
        onChangeText={onChangeText}
        placeholder={country === 'MY' ? '12-345 6789' : country === 'SG' ? '9123 4567' : 'Phone number'}
        accessibilityLabel={`Phone number, ${countryByCode(country)?.name ?? country} ${dialCode(country)}`}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        leading={
          <Pressable
            onPress={() => setPicking(true)}
            accessibilityRole="button"
            accessibilityLabel={`Country code: ${countryByCode(country)?.name ?? country}, ${dialCode(country)}. Change`}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.8 }]}
          >
            <AppText style={styles.flag}>{flag(country)}</AppText>
            <AppText color="text">{dialCode(country)}</AppText>
            <Icon name="keyboard_arrow_down" size={20} color="textMuted" />
          </Pressable>
        }
      />
      <CountrySheet
        visible={picking}
        selected={country}
        onClose={() => setPicking(false)}
        onPick={(c) => {
          setPicking(false);
          onChange(c, digits);
        }}
      />
    </>
  );
});

/**
 * Searchable country list in a bottom sheet. `showDialCode` for the phone picker; off for "Where you live".
 */
export function CountrySheet({
  visible,
  selected,
  onPick,
  onClose,
  showDialCode = true,
  title = 'Country code',
}: {
  visible: boolean;
  selected?: string;
  onPick: (code: CountryCode) => void;
  onClose: () => void;
  showDialCode?: boolean;
  title?: string;
}) {
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase().replace(/^\+/, '');

  const results = useMemo(
    () => (q ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || dialCode(c.code).slice(1).startsWith(q)) : null),
    [q],
  );
  const pick = (c: CountryCode) => {
    onPick(c);
    setQuery('');
  };
  const row = (c: Country) => <CountryRow key={c.code} country={c} selected={c.code === selected} showDialCode={showDialCode} onPress={() => pick(c.code)} />;

  return (
    <BottomSheet visible={visible} onClose={onClose} dragFrom="top">
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      <View style={styles.search}>
        <Icon name="search" size={22} color="textMuted" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          accessibilityLabel="Search countries"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          keyboardAppearance="dark"
          autoCorrect={false}
          maxFontSizeMultiplier={2}
          style={styles.searchInput}
        />
      </View>
      <ScrollView style={{ maxHeight: height * 0.45 }} keyboardShouldPersistTaps="handled">
        {results ? (
          results.length ? (
            results.map(row)
          ) : (
            <AppText color="textMuted" style={{ paddingVertical: space.lg }}>
              No country called “{query.trim()}”.
            </AppText>
          )
        ) : (
          <>
            {LAUNCH_COUNTRIES.map(row)}
            <View style={styles.rule} />
            {COUNTRIES.slice(LAUNCH_COUNTRIES.length).map(row)}
          </>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

function CountryRow({ country, selected, showDialCode, onPress }: { country: Country; selected: boolean; showDialCode: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={showDialCode ? `${country.name}, ${dialCode(country.code)}` : country.name}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
    >
      <AppText style={styles.flag}>{flag(country.code)}</AppText>
      <AppText color="text" style={{ flex: 1 }} numberOfLines={1}>
        {country.name}
      </AppText>
      {showDialCode && <AppText color="textMuted">{dialCode(country.code)}</AppText>}
      <View style={styles.check}>{selected && <Icon name="check" size={22} color="accent" />}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingRight: space.sm,
    marginRight: space.xs,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.divider,
  },
  flag: { fontSize: type.headline.fontSize, lineHeight: type.headline.lineHeight }, // emoji flag, sized from the type scale
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 48,
    marginTop: space.lg,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  searchInput: { ...type.body, flex: 1, minWidth: 0, alignSelf: 'stretch', color: colors.text, outlineStyle: 'none' } as object,
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: space.md },
  check: { width: 24, alignItems: 'center' },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginVertical: space.sm },
});
