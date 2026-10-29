import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { RegisterScreen } from '../screens/RegisterScreen';
import { setProfile } from '../lib/profile';

/**
 * Create account, from the walkthrough's Get started (or Log in's Create an account). Also where
 * Copy OTP in the code email opens the app (lib/emailCode.ts).
 * ?state=mail: the demo nav's email step, inside the phone. Prototype only.
 */
export default function Register() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  // Arriving here (walkthrough, the demo nav): not verified yet
  useState(() => !state && setProfile({ verifiedEmail: '' }));
  return (
    <RegisterScreen
      demo={state === 'mail' ? state : null}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/onboarding'))}
      onDone={() => {
        router.dismissAll(); // the account is made: no way back to the walkthrough
        router.replace('/permissions/microphone');
      }}
      onOpenLegal={(doc) => router.push({ pathname: '/legal/[doc]', params: { doc } })}
    />
  );
}
