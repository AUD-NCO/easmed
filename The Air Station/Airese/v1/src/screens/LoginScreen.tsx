import React, { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';
import { AppText, Button, DetailPage, FormGroup, FormInput, InlineLink, PAGE_SIDE, PasswordField } from '../components';
import { logIn } from '../lib/account';
import { isValidEmail } from '../lib/profile';
import { space } from '@ds/theme';

/**
 * Log in: email and password (lib/account.ts). From I already have an account on the walkthrough,
 * and where the app opens once you've logged out (then there's no back). Forgot password? opens the reset.
 * One plain error at a time, under the field it's about; wrong password says so and points to the reset.
 */
export function LoginScreen({ onBack, onLoggedIn, onForgot, onSignUp, email: initialEmail = '' }: { onBack?: () => void; onLoggedIn: () => void; onForgot: (email: string) => void; onSignUp: () => void; email?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    const e = { email: !email.trim() ? 'Add your email address.' : isValidEmail(email) ? undefined : 'Check your email address.', password: password ? undefined : 'Add your password.' };
    setErrors(e);
    if (e.email || e.password) return;
    setBusy(true);
    const problem = await logIn(email.trim(), password);
    setBusy(false);
    if (problem) return setErrors({ password: problem });
    onLoggedIn();
  };

  return (
    <DetailPage
      backLabel={onBack ? 'Back' : undefined}
      onBack={onBack}
      title="Log in"
      subtitle="With your email and password."
      footer={() => <Button label={busy ? 'Logging in' : 'Log in'} onPress={submit} />}
    >
      <View style={styles.body}>
        <FormGroup title="Email" error={errors.email}>
          <FormInput
            placeholder="name@example.com"
            accessibilityLabel="Email address"
            value={email}
            onChangeText={(t) => (setEmail(t), setErrors((x) => ({ ...x, email: undefined })))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </FormGroup>
        <FormGroup title="Password" error={errors.password}>
          <PasswordField
            ref={passwordRef}
            value={password}
            onChangeText={(t) => (setPassword(t), setErrors((x) => ({ ...x, password: undefined })))}
            returnKeyType="go"
            onSubmitEditing={submit}
          />
        </FormGroup>
        <Button label="Forgot password?" variant="quiet" onPress={() => onForgot(email.trim())} style={styles.link} />

        {/* One sentence, one line: the link sits in the text (same font and baseline) */}
        <AppText color="textMuted" style={styles.new}>
          New to Airese? <InlineLink onPress={onSignUp}>Create an account</InlineLink>
        </AppText>
      </View>
    </DetailPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_SIDE, marginTop: space.xl, gap: space.xl },
  link: { alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: -space.md },
  new: { marginTop: space.lg },
});
