import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { EditDetailsScreen } from '../screens/EditDetailsScreen';
import { markVerified } from '../lib/emailCode';

/**
 * Profile → Your details. Also where the Airese page sends people back to after changing their
 * email: airese://profile-details?verified=1 (lib/emailCode.ts). Engineering: confirm with the
 * server before trusting ?verified=1.
 */
export default function ProfileDetails() {
  const { verified } = useLocalSearchParams<{ verified?: string }>();
  useState(() => verified === '1' && markVerified());
  return <EditDetailsScreen returning={verified === '1'} onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />;
}
