import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { DetailsScreen } from '../screens/DetailsScreen';
import { setProfile } from '../lib/profile';
import { markVerified } from '../lib/emailCode';

/**
 * Your details. Also where the Airese page sends people back to: airese://details?verified=1
 * (lib/emailCode.ts). Engineering: confirm with the server before trusting ?verified=1.
 * ?state=mail | browser: the demo nav's email steps, inside the phone. Prototype only.
 */
export default function Details() {
  const { verified, state } = useLocalSearchParams<{ verified?: string; state?: string }>();
  // Back from the Airese page: verified. Any other arrival (onboarding, the demo nav): not yet.
  useState(() => (verified === '1' ? markVerified() : !state && setProfile({ verifiedEmail: '' })));
  return (
    <DetailsScreen
      demo={state === 'mail' || state === 'browser' ? state : null}
      onDone={() => router.push('/about-you')}
      onOpenLegal={(doc) => router.push({ pathname: '/legal/[doc]', params: { doc } })}
    />
  );
}
