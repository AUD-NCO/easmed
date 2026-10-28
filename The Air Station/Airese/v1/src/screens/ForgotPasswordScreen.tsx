import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, DetailPage, EmailCodeSheet, FormGroup, FormInput, PAGE_SIDE, PasswordField } from '../components';
import { passwordProblem, resetPassword } from '../lib/account';
import { sendCode } from '../lib/emailCode';
import { isValidEmail } from '../lib/profile';
import { space } from '@ds/theme';

/**
 * Forgot password, from Log in. Two steps on one page:
 *   email  where to send a 6-digit code → the same Verify your email sheet as sign-up (EmailCodeSheet)
 *   new    the code was right: a new password → Save and log in
 * `demo`: opens on the new-password step (demo nav).
 */
export function ForgotPasswordScreen({ email: initialEmail = '', onBack, onDone, demo = false }: { email?: string; onBack: () => void; onDone: () => void; demo?: boolean }) {
  const [step, setStep] = useState<'email' | 'new'>(demo ? 'new' : 'email');
  const [email, setEmail] = useState(initialEmail || (demo ? 'alex@example.com' : ''));
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [codeSheet, setCodeSheet] = useState(false);

  const send = async () => {
    const e = !email.trim() ? 'Add your email address.' : isValidEmail(email) ? undefined : 'Check your email address.';
    setError(e);
    if (e) return;
    await sendCode(email.trim());
    setCodeSheet(true);
  };
  const save = () => {
    const e = passwordProblem(password);
    setError(e);
    if (e) return;
    resetPassword(email.trim(), password);
    onDone();
  };

  return (
    <>
      <DetailPage
        backLabel="Log in"
        onBack={onBack}
        title={step === 'email' ? 'Reset your password' : 'Make a new password'}
        subtitle={step === 'email' ? 'We’ll email you a code to check it’s you.' : `For ${email.trim()}.`}
        footer={() => (step === 'email' ? <Button label="Send code" onPress={send} /> : <Button label="Save and log in" onPress={save} />)}
      >
        <View style={styles.body}>
          {step === 'email' ? (
            <FormGroup title="Email" error={error}>
              <FormInput
                placeholder="name@example.com"
                accessibilityLabel="Email address"
                value={email}
                onChangeText={(t) => (setEmail(t), setError(undefined))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="username"
                returnKeyType="send"
                onSubmitEditing={send}
              />
            </FormGroup>
          ) : (
            <FormGroup title="New password" error={error}>
              <PasswordField isNew value={password} onChangeText={(t) => (setPassword(t), setError(undefined))} returnKeyType="done" onSubmitEditing={save} />
            </FormGroup>
          )}
        </View>
      </DetailPage>

      <EmailCodeSheet email={email.trim()} visible={codeSheet} onVerified={() => setStep('new')} onClose={() => setCodeSheet(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_SIDE, marginTop: space.xl, gap: space.xl },
});
