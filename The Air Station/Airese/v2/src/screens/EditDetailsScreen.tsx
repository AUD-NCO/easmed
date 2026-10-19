import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { AboutYou, Button, DetailPage, FormDivider, FormGroup, FormInput, PAGE_SIDE, PhoneField, ExplainSheet, InfoButton, PHONE_WHY } from '../components';
import { isValidEmail, isValidPhone, setProfile, useProfile, type Profile } from '../lib/profile';
import { space } from '@ds/theme';

type Errors = { firstName?: string; phone?: string; email?: string };

const check = (p: Profile): Errors => ({
  firstName: p.firstName.trim() ? undefined : 'Add your first name.',
  phone: !p.phone ? 'Add your phone number.' : isValidPhone(p.phone, p.phoneCountry) ? undefined : 'Check your phone number.',
  email: !p.email.trim() || isValidEmail(p.email) ? undefined : 'Check your email address.',
});

/**
 * Your details (Profile → Edit details): the same fields as onboarding (DetailsScreen).
 * Edits are a draft: Save checks them and keeps them; Back leaves without changing anything.
 * Fields are checked when you leave them, and all again on Save.
 */
export function EditDetailsScreen({ onBack }: { onBack: () => void }) {
  const saved = useProfile();
  const [draft, setDraft] = useState<Profile>(saved);
  const [errors, setErrors] = useState<Errors>({});
  const [phoneWhy, setPhoneWhy] = useState(false);

  const update = (next: Partial<Profile>) => {
    setDraft((d) => ({ ...d, ...next }));
    const touched = Object.keys(next).filter((k) => k in errors) as (keyof Errors)[];
    if (touched.length) setErrors((e) => ({ ...e, ...Object.fromEntries(touched.map((k) => [k, undefined])) }));
  };
  const recheck = (k: keyof Errors) => setErrors((e) => ({ ...e, [k]: check(draft)[k] }));

  const save = (leave: (then: () => void) => void) => {
    const next = check(draft);
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setProfile({ ...draft, firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim() });
    leave(onBack);
  };

  return (
    <DetailPage backLabel="Profile" title="Your details" onBack={onBack} footer={(leave) => <Button label="Save" onPress={() => save(leave)} />}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <FormGroup title="Name" error={errors.firstName}>
            <FormInput
              placeholder="First name"
              value={draft.firstName}
              onChangeText={(firstName) => update({ firstName })}
              onBlur={() => recheck('firstName')}
              autoComplete="given-name"
              textContentType="givenName"
              autoCapitalize="words"
              returnKeyType="next"
            />
            <FormDivider />
            <FormInput placeholder="Last name" value={draft.lastName} onChangeText={(lastName) => update({ lastName })} autoComplete="family-name" textContentType="familyName" autoCapitalize="words" returnKeyType="next" />
          </FormGroup>

          <FormGroup title="Phone" titleAction={<InfoButton size={24} onPress={() => setPhoneWhy(true)} label="Why we ask for your phone number" />} error={errors.phone}>
            <PhoneField country={draft.phoneCountry} digits={draft.phone} onChange={(phoneCountry, phone) => update({ phoneCountry, phone })} onBlur={() => {
                if (draft.phone) recheck('phone');
              }} returnKeyType="next" />
          </FormGroup>

          <FormGroup title="Email (optional)" error={errors.email}>
            <FormInput
              placeholder="name@example.com"
              accessibilityLabel="Email address, optional"
              value={draft.email}
              onChangeText={(email) => update({ email })}
              onBlur={() => recheck('email')}
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
        <ExplainSheet content={phoneWhy ? PHONE_WHY : null} onClose={() => setPhoneWhy(false)} />
      </KeyboardAvoidingView>
    </DetailPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_SIDE, marginTop: space.xl, gap: space.xl },
});
