import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { finishNight, summarize, useNightNotes } from '../lib/nightNotes';
import { startAnalysing, useNights } from '../lib/recordings';
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
  const notes = useNightNotes();
  const latest = useNights()[0]; // prototype: the night just recorded shows as the latest sample night
  const from = p.x && p.y && p.r ? { x: Number(p.x), y: Number(p.y), r: Number(p.r) } : undefined;
  return (
    <RecordingScreen
      startedAt={startedAt}
      pausedAt={pausedAt}
      from={from}
      notesTonight={summarize(notes.tonight)}
      onOpenNotes={() => router.push({ pathname: '/night-notes', params: { from: 'recording' } })}
      onStop={() => {
        if (latest) finishNight(latest.id);
        startAnalysing();
        router.replace('/reports');
      }}
    />
  );
}
