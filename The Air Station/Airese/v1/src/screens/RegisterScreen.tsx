import React, { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';
import { AppText, Button, Checkbox, DetailPage, EmailCodeSheet, FormGroup, FormInput, Icon, InlineLink, PAGE_SIDE, PasswordField } from '../components';
import { createAccount, passwordProblem } from '../lib/account';
import { markVerified, sendCode } from '../lib/emailCode';
import { isValidEmail, setProfile, useProfile } from '../lib/profile';
import type { LegalDoc } from './LegalScreen';
import { space } from '@ds/theme';

type Errors = { email?: string; password?: string; terms?: string };

/**
 * Create account: the walkthrough's Get started. A verified email, a password and agreeing to the
 * terms make the account (lib/account.ts); Continue creates it and goes on to the permissions, then
 * Your details. Log in's Create an account also comes here.
 *
 * Email: Verify, inside the field, emails a 6-digit code and opens the Verify your email sheet
 * (EmailCodeSheet); the person pastes the code there and the field shows Verified (flow:
 * lib/emailCode.ts). Continue stays dimmed until then; tapping it anyway shows why, under the field.
 * Changing the email undoes Verified.
 * `demo`: opens straight onto the sheet's mail app (demo nav).
 */
export function RegisterScreen({
  onBack,
  onDone,
  onOpenLegal,
  demo = null,
}: {
  onBack?: () => void;
  onDone: () => void;
  onOpenLegal: (doc: LegalDoc) => void;
  demo?: 'mail' | null;
}) {
  const saved = useProfile();
  const [email, setEmail] = useState(saved.email);
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [codeSheet, setCodeSheet] = useState(demo === 'mail');
  const passwordRef = useRef<TextInput>(null);

  const clear = (k: keyof Errors) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));
  const emailProblem = () => (!email.trim() ? 'Add your email address.' : isValidEmail(email) ? undefined : 'Check your email address.');
  const verified = !!email.trim() && saved.verifiedEmail === email.trim();

  // Saves the email (the app may be reopened from the email link), then sends the code.
  const verify = async () => {
    const error = emailProblem();
    setErrors((e) => ({ ...e, email: error }));
    if (error) return;
    setProfile({ email: email.trim() });
    await sendCode(email.trim());
    setCodeSheet(true);
  };

  const submit = () => {
    const next: Errors = {
      email: emailProblem() ?? (verified ? undefined : 'Verify your email to continue.'),
      password: passwordProblem(password),
      terms: agreed ? undefined : 'Tick the box to agree before you begin.',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setProfile({ email: email.trim() });
    createAccount(email.trim(), password);
    onDone();
  };

  return (
    <View style={{ flex: 1 }}>
      <DetailPage
        backLabel={onBack ? 'Back' : undefined}
        onBack={onBack}
        title="Create account"
        subtitle="With your email and a password."
        footer={() => (
          <View>
            <Checkbox checked={agreed} onToggle={() => (setAgreed((a) => !a), clear('terms'))} label="I agree to the Terms and Conditions and Privacy Policy" error={errors.terms}>
              I agree to the <InlineLink onPress={() => onOpenLegal('terms')}>Terms and Conditions</InlineLink> and{' '}
              <InlineLink onPress={() => onOpenLegal('privacy')}>Privacy Policy</InlineLink>.
            </Checkbox>
            <Button label="Continue" onPress={submit} disabled={!verified} style={{ marginTop: space.md }} />
          </View>
        )}
      >
        <View style={styles.body}>
          <FormGroup title="Email" error={errors.email}>
            <FormInput
              placeholder="name@example.com"
              accessibilityLabel="Email address"
              value={email}
              onChangeText={(t) => (setEmail(t), clear('email'))}
              onBlur={() => email && setErrors((e) => ({ ...e, email: emailProblem() }))}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              trailing={
                verified ? (
                  <View style={styles.verified} accessibilityLabel="Email verified">
                    <Icon name="check_circle" size={20} color="accent" />
                    <AppText variant="small">Verified</AppText>
                  </View>
                ) : (
                  <Button label="Verify" variant="mini" onPress={verify} style={{ alignSelf: 'center' }} accessibilityLabel="Verify email" />
                )
              }
            />
          </FormGroup>

          {/* With the verified email, this is how you log in */}
          <FormGroup title="Password" error={errors.password}>
            <PasswordField
              ref={passwordRef}
              isNew
              value={password}
              onChangeText={(p) => (setPassword(p), clear('password'))}
              onBlur={() => password && setErrors((e) => ({ ...e, password: passwordProblem(password) }))}
              returnKeyType="done"
            />
          </FormGroup>
        </View>
      </DetailPage>

      <EmailCodeSheet
        email={email.trim() || saved.email}
        visible={codeSheet}
        startInMail={demo === 'mail'}
        onVerified={() => markVerified(email.trim() || saved.email)}
        onClose={() => setCodeSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_SIDE, marginTop: space.xl, gap: space.xl },
  verified: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
