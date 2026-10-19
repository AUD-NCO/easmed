import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText, BrowserDemo, Button, Checkbox, FormDivider, FormGroup, FormInput, Icon, InlineLink, MailDemo, PhoneField, ExplainSheet, InfoButton, PHONE_WHY } from '../components';
import { markVerified, sendCode } from '../lib/emailCode';
import { isValidEmail, isValidPhone, setProfile, useProfile, type Profile } from '../lib/profile';
import type { LegalDoc } from './LegalScreen';
import { colors, space, useInsets } from '@ds/theme';

const SIDE = space.gutter; // standard screen edge

type Errors = { name?: string; phone?: string; email?: string; terms?: string };

/**
 * Onboarding, first of two steps: Your details → About you.
 * All required: first and last name, phone (so the sleep care team can call when asked), a verified
 * email and agreeing to the terms. Native grouped form (iOS Settings style, see components/Form).
 *
 * Email: Verify, inside the field, emails a 6-digit code; the person confirms it on the Airese page
 * and comes back here, where the field shows Verified (flow: lib/emailCode.ts). Continue stays
 * dimmed until then, with the reason under the field; tapping it anyway turns that reason into an
 * error. Changing the email undoes Verified.
 * Browser preview: Verify plays the rest inside the phone: the mail app (MailDemo), then the browser
 * (BrowserDemo). `demo` opens straight onto one of them (demo nav).
 */
export function DetailsScreen({ onDone, onOpenLegal, demo: initialDemo = null }: { onDone?: () => void; onOpenLegal: (doc: LegalDoc) => void; demo?: 'mail' | 'browser' | null }) {
  const insets = useInsets();
  const saved = useProfile();
  const [draft, setDraft] = useState<Profile>(saved);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [phoneWhy, setPhoneWhy] = useState(false);
  const [sent, setSent] = useState(false); // phone: the code is on its way
  const [demo, setDemo] = useState(initialDemo);
  const scroll = useRef<ScrollView>(null);

  const lastRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

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
    email: () => (!draft.email.trim() ? 'Add your email address.' : isValidEmail(draft.email) ? undefined : 'Check your email address.'),
    terms: () => (agreed ? undefined : 'Tick the box to agree before you begin.'),
  };

  const verified = !!draft.email.trim() && saved.verifiedEmail === draft.email.trim();

  // Saves what's typed so far (the app may be reopened from the email link), then sends the code.
  const verify = async () => {
    const error = checks.email();
    setErrors((e) => ({ ...e, email: error }));
    if (error) return;
    const email = draft.email.trim();
    setProfile({ ...draft, firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email });
    await sendCode(email);
    if (Platform.OS === 'web') setDemo('mail');
    else setSent(true);
  };

  const submit = () => {
    const next: Errors = { name: checks.name(), phone: checks.phone(), email: checks.email() ?? (verified ? undefined : 'Verify your email to continue.'), terms: checks.terms() };
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
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </FormGroup>

            <FormGroup title="Email" error={errors.email} footer={verified ? undefined : sent ? 'Code sent. Check your email.' : 'Verify your email to continue.'}>
              <FormInput
                ref={emailRef}
                placeholder="name@example.com"
                accessibilityLabel="Email address"
                value={draft.email}
                onChangeText={(email) => (update({ email }), clear('email'), setSent(false))}
                onBlur={() => setErrors((e) => ({ ...e, email: checks.email() }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="done"
                trailing={
                  verified ? (
                    <View style={styles.verified} accessibilityLabel="Email verified">
                      <Icon name="check_circle" size={20} color="accent" />
                      <AppText variant="small">Verified</AppText>
                    </View>
                  ) : (
                    <Button label={sent ? 'Resend' : 'Verify'} variant="mini" onPress={verify} style={{ alignSelf: 'center' }} accessibilityLabel={sent ? 'Resend the code' : 'Verify email'} />
                  )
                }
              />
            </FormGroup>

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
          <Button label="Continue" onPress={submit} disabled={!verified} style={{ marginTop: space.md }} />
        </View>
      </KeyboardAvoidingView>

      <ExplainSheet content={phoneWhy ? PHONE_WHY : null} onClose={() => setPhoneWhy(false)} />

      {/* Browser preview only: the mail app, then the browser, inside the phone */}
      {demo === 'mail' && (
        <View style={StyleSheet.absoluteFill}>
          <MailDemo onOpenCode={() => setDemo('browser')} onBack={() => setDemo(null)} />
        </View>
      )}
      {demo === 'browser' && (
        <View style={StyleSheet.absoluteFill}>
          <BrowserDemo
            email={draft.email.trim() || saved.email}
            from="details"
            onVerified={() => (markVerified(), setDemo(null))}
            onChangeEmail={() => (setDemo(null), emailRef.current?.focus())}
            onBack={() => setDemo('mail')}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fields: { marginTop: space.xxl, gap: space.xl },
  verified: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  bottom: {
    paddingHorizontal: SIDE,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
  },
});
