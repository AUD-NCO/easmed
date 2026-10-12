import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { demoAfterFirstNight } from '../../lib/nightNotes';
import { setDemoLastNightStopped, setDemoStartProblem } from '../../lib/recordingIssues';
import { HomeScreen } from '../../screens/HomeScreen';

/**
 * ?state=…: the demo nav's Home states. Prototype only.
 *   after-first-night    one night recorded, no notes for tonight
 *   after-stopped-night  last night's recording stopped early: the banner points to it
 */
export default function Home() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  useState(() => {
    if (state === 'after-first-night') demoAfterFirstNight();
    setDemoStartProblem(null);
    setDemoLastNightStopped(state === 'after-stopped-night' ? 'stopped-phone' : null);
  });
  return (
    <HomeScreen
      onOpenNotes={() => router.push('/night-notes')}
      onOpenProfile={() => router.push('/profile')}
      onOpenLastNight={(night) => {
        setDemoLastNightStopped(null); // seen
        router.navigate({ pathname: '/reports', params: { state: night } });
      }}
      onCantStart={(kind) => router.push({ pathname: '/recording-problem', params: { kind } })}
      onStartRecording={(from) => router.push({ pathname: '/recording', params: { x: String(from.x), y: String(from.y), r: String(from.r) } })}
    />
  );
}
