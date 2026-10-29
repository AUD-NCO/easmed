import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText, Button, FormDivider, FormGroup, FormInput, PhoneField, ExplainSheet, InfoButton, PHONE_WHY } from '../components';
import { isValidPhone, setProfile, useProfile, type Profile } from '../lib/profile';
import { colors, space, useInsets } from '@ds/theme';

const SIDE = space.gutter; // standard screen edge

type Errors = { name?: string; phone?: string };

/**
 * Set-up, after Create account and the permissions: Your details → About you.
 * Both required: first and last name, and phone (so the sleep care team can call when asked).
 * The email and password were set on Create account (RegisterScreen). Native grouped form
 * (iOS Settings style, see components/Form).
 */
export function DetailsScreen({ onDone }: { onDone?: () => void }) {
  const insets = useInsets();
  const saved = useProfile();
  const [draft, setDraft] = useState<Profile>(saved);
  const [errors, setErrors] = useState<Errors>({});
  const [phoneWhy, setPhoneWhy] = useState(false);
  const scroll = useRef<ScrollView>(null);

  const lastRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const update = (next: Partial<Profile>) => setDraft((d) => ({ ...d, ...next }));
  const clear = (k: keyof Errors) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));

  const checks = {
    name: () => {
      const first = draft.firstName.trim(), last = draft.lastName.trim();
      if (!first && !last) return 'Add your first and last name.';
      if (!first) return 'Add your first name.';
      return last ? undefined : 'Add your last name.';
    },
    phone: () => (!draft.phone ? 'Add your phone number.' : isValidPhone(draft.phone, draft.phoneCountry) ? undefined : 'Check your phone number.'),
  };

  const submit = () => {
    const next: Errors = { name: checks.name(), phone: checks.phone() };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return scroll.current?.scrollTo({ y: 0, animated: true });
    setProfile({ firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), phoneCountry: draft.phoneCountry, phone: draft.phone });
    onDone?.();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: insets.top + space.xxl, paddingBottom: space.xl, paddingHorizontal: SIDE }}
        >
          <AppText variant="headline" accessibilityRole="header">
            Your details
          </AppText>

          <View style={styles.fields}>
            <FormGroup title="Name" error={errors.name}>
              <FormInput
                placeholder="First name"
                value={draft.firstName}
                onChangeText={(firstName) => (update({ firstName }), clear('name'))}
                autoCapitalize="words"
                autoComplete="given-name"
                textContentType="givenName"
                returnKeyType="next"
                onSubmitEditing={() => lastRef.current?.focus()}
              />
              <FormDivider />
              <FormInput
                ref={lastRef}
                placeholder="Last name"
                value={draft.lastName}
                onChangeText={(lastName) => (update({ lastName }), clear('name'))}
                autoCapitalize="words"
                autoComplete="family-name"
                textContentType="familyName"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
            </FormGroup>

            <FormGroup title="Phone" titleAction={<InfoButton size={24} onPress={() => setPhoneWhy(true)} label="Why we ask for your phone number" />} error={errors.phone}>
              <PhoneField
                ref={phoneRef}
                country={draft.phoneCountry}
                digits={draft.phone}
                onChange={(phoneCountry, phone) => (update({ phoneCountry, phone }), clear('phone'))}
                onBlur={() => {
                  if (draft.phone) setErrors((e) => ({ ...e, phone: checks.phone() }));
                }}
                returnKeyType="done"
              />
            </FormGroup>

          </View>
        </ScrollView>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
          <Button label="Continue" onPress={submit} />
        </View>
      </KeyboardAvoidingView>

      <ExplainSheet content={phoneWhy ? PHONE_WHY : null} onClose={() => setPhoneWhy(false)} />

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fields: { marginTop: space.xxl, gap: space.xl },
  bottom: {
    paddingHorizontal: SIDE,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
  },
});
