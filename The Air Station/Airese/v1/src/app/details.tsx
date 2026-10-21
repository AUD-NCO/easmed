import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { DetailsScreen } from '../screens/DetailsScreen';
import { setProfile } from '../lib/profile';

/**
 * Your details. Also where Copy OTP in the code email opens the app (lib/emailCode.ts).
 * ?state=mail: the demo nav's email step, inside the phone. Prototype only.
 */
export default function Details() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  // Arriving here (onboarding, the demo nav): not verified yet
  useState(() => !state && setProfile({ verifiedEmail: '' }));
  return (
    <DetailsScreen
      demo={state === 'mail' ? state : null}
      onDone={() => router.push('/about-you')}
      onOpenLegal={(doc) => router.push({ pathname: '/legal/[doc]', params: { doc } })}
    />
  );
}
