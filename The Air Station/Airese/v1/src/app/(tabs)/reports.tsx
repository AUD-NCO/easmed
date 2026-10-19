import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { startAnalysing } from '../../lib/recordings';
import { ReportsScreen } from '../../screens/ReportsScreen';

/**
 * ?state=…: the demo menu's Recording Details states, on the latest night (prototype only).
 * ?state=processing is the same as stopping a recording. Not a key: switching tabs clears the param,
 * and that must not reload the page.
 */
export default function Reports() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  useState(() => state === 'processing' && startAnalysing());
  return <ReportsScreen demoState={state === 'processing' ? undefined : state} onRecordAgain={() => router.navigate('/home')} />;
}
