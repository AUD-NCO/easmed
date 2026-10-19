import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AboutYou, AppText, Button, Checkbox, FormDivider, FormGroup, FormInput, InlineLink, PhoneField, ExplainSheet, InfoButton, PHONE_WHY } from '../components';
import { isValidEmail, isValidPhone, setProfile, useProfile, type Profile } from '../lib/profile';
import type { LegalDoc } from './LegalScreen';
import { colors, space, useInsets } from '@ds/theme';

const SIDE = space.gutter; // standard screen edge

type Errors = { name?: string; phone?: string; email?: string; terms?: string };

/**
 * Last onboarding step: one short screen, not a multi-step form.
 * Required: first name, phone (so the sleep care team can call when asked) and agreeing to the terms.
 * Optional: email, and "About you" (gender, age, height, weight, where you live) as tiles that each
 * open a small sheet. Whatever is skipped can be added later in Profile → Your details.
 * Native grouped form (iOS Settings style, see components/Form).
 */
export function DetailsScreen({ onDone, onOpenLegal }: { onDone?: () => void; onOpenLegal: (doc: LegalDoc) => void }) {
  const insets = useInsets();
  const saved = useProfile();
  const [draft, setDraft] = useState<Profile>(saved);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [phoneWhy, setPhoneWhy] = useState(false);
  const scroll = useRef<ScrollView>(null);

  const lastRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const update = (next: Partial<Profile>) => setDraft((d) => ({ ...d, ...next }));
  const clear = (k: keyof Errors) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));

  const checks = {
    name: () => (draft.firstName.trim() ? undefined : 'Add your first name.'),
    phone: () => (!draft.phone ? 'Add your phone number.' : isValidPhone(draft.phone, draft.phoneCountry) ? undefined : 'Check your phone number.'),
    email: () => (!draft.email.trim() || isValidEmail(draft.email) ? undefined : 'Check your email address.'),
    terms: () => (agreed ? undefined : 'Tick the box to agree before you begin.'),
  };

  const submit = () => {
    const next: Errors = { name: checks.name(), phone: checks.phone(), email: checks.email(), terms: checks.terms() };
    setErrors(next);
    if (next.name || next.phone || next.email) scroll.current?.scrollTo({ y: 0, animated: true });
    if (Object.values(next).some(Boolean)) return;
    setProfile({ ...draft, firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim() });
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
            Great! One last thing…
          </AppText>
          <AppText color="textMuted" style={{ marginTop: space.xs }}>
            Before we begin
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
                onChangeText={(lastName) => update({ lastName })}
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
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </FormGroup>

            <FormGroup title="Email (optional)" error={errors.email}>
              <FormInput
                ref={emailRef}
                placeholder="name@example.com"
                accessibilityLabel="Email address, optional"
                value={draft.email}
                onChangeText={(email) => (update({ email }), clear('email'))}
                onBlur={() => setErrors((e) => ({ ...e, email: checks.email() }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="done"
              />
            </FormGroup>

            <AboutYou value={draft} onChange={update} />
          </View>
        </ScrollView>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
          <Checkbox
            checked={agreed}
            onToggle={() => (setAgreed((a) => !a), clear('terms'))}
            label="I agree to the Terms and Conditions and Privacy Policy"
            error={errors.terms}
          >
            I agree to the <InlineLink onPress={() => onOpenLegal('terms')}>Terms and Conditions</InlineLink> and{' '}
            <InlineLink onPress={() => onOpenLegal('privacy')}>Privacy Policy</InlineLink>.
          </Checkbox>
          <Button label="Begin your journey" onPress={submit} style={{ marginTop: space.md }} />
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
