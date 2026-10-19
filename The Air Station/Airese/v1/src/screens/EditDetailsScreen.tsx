import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, type TextInput } from 'react-native';
import {
  AboutYou,
  AppText,
  BrowserDemo,
  Button,
  DetailPage,
  FormDivider,
  FormGroup,
  FormInput,
  Icon,
  MailDemo,
  PAGE_SIDE,
  PhoneField,
  ExplainSheet,
  InfoButton,
  PHONE_WHY,
  missingAbout,
  missingAboutMessage,
  type AboutKey,
} from '../components';
import { codeSentTo, markVerified, sendCode } from '../lib/emailCode';
import { isValidEmail, isValidPhone, setProfile, useProfile, type Profile } from '../lib/profile';
import { space } from '@ds/theme';

type Errors = { name?: string; phone?: string; email?: string };

const check = (p: Profile, verified: boolean): Errors => {
  const first = p.firstName.trim(), last = p.lastName.trim();
  return {
    name: !first && !last ? 'Add your first and last name.' : !first ? 'Add your first name.' : last ? undefined : 'Add your last name.',
    phone: !p.phone ? 'Add your phone number.' : isValidPhone(p.phone, p.phoneCountry) ? undefined : 'Check your phone number.',
    email: !p.email.trim() ? 'Add your email address.' : !isValidEmail(p.email) ? 'Check your email address.' : verified ? undefined : 'Verify your new email to save it.',
  };
};

/**
 * Your details (Profile → Your details): the same fields and rules as onboarding (DetailsScreen and
 * AboutYouScreen), all required. Edits are a draft: Save checks them and keeps them; Back leaves
 * without changing anything. Fields are checked when you leave them, and all again on Save.
 *
 * Email: the saved address shows Verified (onboarding verified it). A new one needs Verify (the same email code as
 * onboarding, coming back here: lib/emailCode.ts) and Save is dimmed until then; tapping it anyway
 * says why. `returning`: reopened from the email link, so the draft starts on the address just verified.
 * Browser preview: Verify plays the mail app and browser inside the phone, as in onboarding.
 */
export function EditDetailsScreen({ onBack, returning = false }: { onBack: () => void; returning?: boolean }) {
  const saved = useProfile();
  const [draft, setDraft] = useState<Profile>(() => (returning && codeSentTo() ? { ...saved, email: codeSentTo() } : saved));
  const [errors, setErrors] = useState<Errors>({});
  const [missing, setMissing] = useState<AboutKey[]>([]);
  const [phoneWhy, setPhoneWhy] = useState(false);
  const [sent, setSent] = useState(false); // phone: the code is on its way
  const [demo, setDemo] = useState<'mail' | 'browser' | null>(null);
  const emailRef = useRef<TextInput>(null);

  // The saved email was verified in onboarding (it can't be finished without), so only a new one needs it
  const email = draft.email.trim();
  const verified = !!email && (email === saved.email || email === saved.verifiedEmail);

  const update = (next: Partial<Profile>) => {
    const d = { ...draft, ...next };
    setDraft(d);
    const touched = (Object.keys(next) as (keyof Profile)[]).map((k) => (k === 'firstName' || k === 'lastName' ? 'name' : k === 'phoneCountry' ? 'phone' : k)).filter((k): k is keyof Errors => k in errors);
    if (touched.length) setErrors((e) => ({ ...e, ...Object.fromEntries(touched.map((k) => [k, undefined])) }));
    if (missing.length) setMissing(missingAbout(d).filter((k) => missing.includes(k)));
  };
  const recheck = (k: keyof Errors) => setErrors((e) => ({ ...e, [k]: check(draft, verified)[k] }));

  const verify = async () => {
    const email = draft.email.trim();
    const error = !email ? 'Add your email address.' : isValidEmail(email) ? undefined : 'Check your email address.';
    setErrors((e) => ({ ...e, email: error }));
    if (error) return;
    await sendCode(email);
    if (Platform.OS === 'web') setDemo('mail');
    else setSent(true);
  };

  const save = (leave: (then: () => void) => void) => {
    const next = check(draft, verified);
    const gaps = missingAbout(draft);
    setErrors(next);
    setMissing(gaps);
    if (Object.values(next).some(Boolean) || gaps.length) return;
    setProfile({ ...draft, firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim() });
    leave(onBack);
  };

  return (
    <>
      <DetailPage backLabel="Profile" title="Your details" onBack={onBack} footer={(leave) => <Button label="Save" onPress={() => save(leave)} disabled={!verified} />}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.body}>
            <FormGroup title="Name" error={errors.name}>
              <FormInput
                placeholder="First name"
                value={draft.firstName}
                onChangeText={(firstName) => update({ firstName })}
                onBlur={() => recheck('name')}
                autoComplete="given-name"
                textContentType="givenName"
                autoCapitalize="words"
                returnKeyType="next"
              />
              <FormDivider />
              <FormInput
                placeholder="Last name"
                value={draft.lastName}
                onChangeText={(lastName) => update({ lastName })}
                onBlur={() => recheck('name')}
                autoComplete="family-name"
                textContentType="familyName"
                autoCapitalize="words"
                returnKeyType="next"
              />
            </FormGroup>

            <FormGroup title="Phone" titleAction={<InfoButton size={24} onPress={() => setPhoneWhy(true)} label="Why we ask for your phone number" />} error={errors.phone}>
              <PhoneField
                country={draft.phoneCountry}
                digits={draft.phone}
                onChange={(phoneCountry, phone) => update({ phoneCountry, phone })}
                onBlur={() => {
                  if (draft.phone) recheck('phone');
                }}
                returnKeyType="next"
              />
            </FormGroup>

            <FormGroup title="Email" error={errors.email} footer={verified ? undefined : sent ? 'Code sent. Check your email.' : 'Verify your new email to save it.'}>
              <FormInput
                ref={emailRef}
                placeholder="name@example.com"
                accessibilityLabel="Email address"
                value={draft.email}
                onChangeText={(email) => (update({ email }), setSent(false))}
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

            <AboutYou value={draft} onChange={update} missing={missing} error={missing.length ? missingAboutMessage(missing) : undefined} />
          </View>
          <ExplainSheet content={phoneWhy ? PHONE_WHY : null} onClose={() => setPhoneWhy(false)} />
        </KeyboardAvoidingView>
      </DetailPage>

      {/* Browser preview only: the mail app, then the browser, inside the phone */}
      {demo === 'mail' && (
        <View style={StyleSheet.absoluteFill}>
          <MailDemo onOpenCode={() => setDemo('browser')} onBack={() => setDemo(null)} />
        </View>
      )}
      {demo === 'browser' && (
        <View style={StyleSheet.absoluteFill}>
          <BrowserDemo
            email={draft.email.trim()}
            from="profile-details"
            onVerified={() => (markVerified(), setDemo(null))}
            onChangeEmail={() => (setDemo(null), emailRef.current?.focus())}
            onBack={() => setDemo('mail')}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_SIDE, marginTop: space.xl, gap: space.xl },
  verified: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
