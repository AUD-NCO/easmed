import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, DetailPage, EmailCodeSheet, FormGroup, PAGE_SIDE, PasswordField } from '../components';
import { changePassword, useAccount } from '../lib/account';
import { sendCode } from '../lib/emailCode';
import { useProfile } from '../lib/profile';
import { space } from '@ds/theme';

/**
 * Change password (Profile → Account), while logged in. The current password, then a new one, Save.
 * Forgot the current one: a 6-digit code to the verified email (the same Verify your email sheet as
 * sign-up), then only the new password. Saving goes back to Profile, which confirms with a toast.
 */
export function ChangePasswordScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const account = useAccount();
  const profile = useProfile();
  const email = account.account?.email || profile.email;
  const [verified, setVerified] = useState(false); // forgot the current one, and the code checked out
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [currentError, setCurrentError] = useState<string>();
  const [nextError, setNextError] = useState<string>();
  const [codeSheet, setCodeSheet] = useState(false);

  const forgot = async () => {
    await sendCode(email);
    setCodeSheet(true);
  };
  const save = () => {
    // Prototype: anything typed is accepted; only an empty field asks to be filled in.
    // Engineering: check the current password server-side and apply the password rules (lib/account).
    const c = verified || current ? undefined : 'Enter your current password.';
    const n = next ? undefined : 'Enter a new password.';
    setCurrentError(c);
    setNextError(n);
    if (c || n) return;
    changePassword(email, next);
    onDone();
  };

  return (
    <>
      <DetailPage
        backLabel="Profile"
        onBack={onBack}
        title="Change password"
        subtitle={verified ? `Code confirmed for ${email}.` : `For ${email}.`}
        footer={() => <Button label="Save" onPress={save} />}
      >
        <View style={styles.body}>
          {!verified && (
            <View>
              <FormGroup title="Current password" error={currentError}>
                <PasswordField value={current} onChangeText={(t) => (setCurrent(t), setCurrentError(undefined))} returnKeyType="next" />
              </FormGroup>
              <Button label="Forgot your current password?" variant="quiet" onPress={forgot} style={styles.link} />
            </View>
          )}
          <FormGroup title="New password" error={nextError}>
            <PasswordField isNew value={next} onChangeText={(t) => (setNext(t), setNextError(undefined))} returnKeyType="done" onSubmitEditing={save} />
          </FormGroup>
        </View>
      </DetailPage>

      <EmailCodeSheet email={email} visible={codeSheet} onVerified={() => (setVerified(true), setCurrentError(undefined))} onClose={() => setCodeSheet(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_SIDE, marginTop: space.xl, gap: space.xl },
  link: { alignSelf: 'flex-start', marginTop: space.xs },
});
