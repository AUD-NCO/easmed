import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { startAnalysing } from '../lib/recordings';
import { RecordingScreen } from '../screens/RecordingScreen';

/**
 * Opened over Home (transparent), so the record button's blue can grow out of Home itself.
 * Stopping in the morning goes straight to Reports: "Looking through your night", then the results.
 * ?state=paused: the demo nav's paused night (Airese was closed by another app). Prototype only.
 */
export default function Recording() {
  const p = useLocalSearchParams<{ x?: string; y?: string; r?: string; state?: string }>();
  const [startedAt] = useState(() => (p.state === 'paused' ? new Date(Date.now() - 150 * 60_000) : new Date()));
  const [pausedAt] = useState(() => (p.state === 'paused' ? new Date(Date.now() - 5 * 60_000) : undefined));
  const from = p.x && p.y && p.r ? { x: Number(p.x), y: Number(p.y), r: Number(p.r) } : undefined;
  return (
    <RecordingScreen
      startedAt={startedAt}
      pausedAt={pausedAt}
      from={from}
      onStop={() => {
        startAnalysing();
        router.replace('/reports');
      }}
    />
  );
}
